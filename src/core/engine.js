import { getRenderTarget } from './canvas.js';
import { matchPoint } from './region.js';
import { clickBufferPoint } from './input.js';
import { getBufferSize } from './coords.js';
import { isRuleReady, colorForPoint } from '../rules/model.js';
import { detectScreen, ruleAllowedOn } from '../rules/screen.js';
import { rulesForActivity, looseRules } from '../rules/activity.js';
import { createEmitter } from './events.js';
import {
  realNow,
  realSetInterval,
  realClearInterval,
  realSetTimeout,
  realClearTimeout,
} from './timers.js';
import {
  INTERVAL_RERUN_HUNT,
  INTERVAL_RERUN_REST,
  INTERVAL_WORLD_BOSS,
  INTERVAL_SCRIPT,
  INTERVAL_AUTO_STOP_CHECK,
  INTERVAL_RUN_ALL,
  IDLE_ADVANCE_TICKS,
  AUTO_STOP_TIMEOUT,
} from './constants.js';

/**
 * The automation loop.
 *
 * One task runs at a time. A task polls on its own interval, walks its rules
 * in order, and clicks the first point whose colour matches — first match
 * wins, so rule order encodes priority.
 *
 * All scheduling uses the real timers: the speed hack scales the *game*, and
 * a poll that sped up with it would just burn CPU re-reading the same frame.
 */

export const TaskId = Object.freeze({
  RERUN: 'rerun',
  WORLD_BOSS: 'wb',
  SCRIPT: 'script',
  RUN_ALL: 'runAll',
});

export const Phase = Object.freeze({
  HUNTING: 'hunting',
  RESTING: 'resting',
});

/**
 * @typedef {object} EngineDeps
 * @property {() => import('../rules/model.js').Rule[]} getScriptRules
 * @property {() => import('../rules/model.js').Rule[]} getRerunRules
 * @property {() => import('../rules/model.js').Rule[]} getWorldBossRules
 * @property {() => string} getScaleMode
 * @property {() => import('../rules/screen.js').Screen[]} [getScreens]
 * @property {() => import('../rules/activity.js').Activity[]} [getActivities]
 * @property {() => boolean} [shouldCloseAfterRound]
 * @property {() => void} [closeGame]
 * @property {() => boolean} [shouldRecoverFromHang]
 * @property {(task: string) => boolean} [recoverFromHang] false when it has given up
 */

export function createEngine(deps) {
  const emitter = createEmitter();

  const state = {
    /** @type {string | null} */
    activeTask: null,
    phase: Phase.HUNTING,
    lastActionAt: 0,
    lastMessage: '',
    /** @type {string | null} id of the screen detected on the last tick */
    screen: null,
    /** @type {string | null} */
    screenName: null,
    /** @type {string | null} id of the activity Run-All is on */
    activity: null,
    /** @type {string | null} */
    activityName: null,
    round: 0,
  };

  /** Activities already out of resources this round; cleared when it wraps. */
  let spent = new Set();
  let queueIndex = 0;
  let idleTicks = 0;

  let pollTimer = null;
  let autoStopTimer = null;
  let restTimer = null;

  const TASKS = {
    [TaskId.RERUN]: { interval: INTERVAL_RERUN_HUNT, getRules: deps.getRerunRules },
    [TaskId.WORLD_BOSS]: { interval: INTERVAL_WORLD_BOSS, getRules: deps.getWorldBossRules },
    [TaskId.SCRIPT]: { interval: INTERVAL_SCRIPT, getRules: () => looseRules(deps.getScriptRules()) },
    [TaskId.RUN_ALL]: { interval: INTERVAL_RUN_ALL, getRules: runAllRules },
  };

  function activities() {
    return (deps.getActivities ? deps.getActivities() : []).filter((a) => a.enabled);
  }

  /** The current activity's rules; the queue never sees the loose Script set. */
  function runAllRules() {
    const current = currentActivity();
    return current ? rulesForActivity(deps.getScriptRules(), current.id) : [];
  }

  function currentActivity() {
    const queue = activities();
    return queue.length > 0 ? queue[queueIndex % queue.length] : null;
  }

  function setActivity(activity) {
    state.activity = activity ? activity.id : null;
    state.activityName = activity ? activity.name : null;
  }

  /**
   * Move to the next activity that still has something left this round.
   *
   * @param {string} why for the log: 'spent' or 'idle'
   */
  function advanceQueue(why) {
    const queue = activities();
    if (queue.length === 0) {
      return;
    }

    const leaving = currentActivity();
    if (why === 'spent' && leaving) {
      spent.add(leaving.id);
    }
    idleTicks = 0;

    for (let step = 1; step <= queue.length; step += 1) {
      const index = (queueIndex + step) % queue.length;

      if (index === 0) {
        // Everything ran dry inside one round. Spinning would teach the user
        // nothing, so stop and say which activity finished it off.
        if (spent.size >= queue.length) {
          report('resource', { label: leaving ? leaving.name : 'run all' });
          stop();
          setMessage('run all: everything is spent');
          return;
        }
        // The queue wrapped: resources regenerate, so everything is fair again.
        state.round += 1;
        spent = new Set();
        if (deps.shouldCloseAfterRound && deps.shouldCloseAfterRound() && deps.closeGame) {
          deps.closeGame();
        }
      }

      if (!spent.has(queue[index].id)) {
        queueIndex = index;
        setActivity(queue[index]);
        report('activity', { label: queue[index].name, activityId: queue[index].id, why });
        setMessage(`${queue[index].name}: ${why === 'spent' ? 'next' : 'nothing to do, next'}`);
        return;
      }
    }
  }

  /**
   * A discrete thing that happened, for the activity log.
   *
   * `lastMessage` is overwritten on every tick, so a log cannot be recovered
   * from it; these events are what the log tab is built from.
   *
   * @param {'click'|'busy'|'task'|'idle'|'screen'|'resource'|'activity'|'hang'} kind
   * @param {object} [detail]
   */
  function report(kind, detail = {}) {
    emitter.emit('action', { at: realNow(), kind, task: state.activeTask, ...detail });
  }

  function setMessage(message) {
    state.lastMessage = message;
    emitter.emit('change', getState());
  }

  function getState() {
    return {
      activeTask: state.activeTask,
      phase: state.phase,
      lastMessage: state.lastMessage,
      screen: state.screen,
      screenName: state.screenName,
      activity: state.activity,
      activityName: state.activityName,
      round: state.round,
      spent: [...spent],
      remainingMs: state.activeTask
        ? Math.max(0, AUTO_STOP_TIMEOUT - (realNow() - state.lastActionAt))
        : 0,
    };
  }

  /**
   * Walk a rule's points and click the first colour match.
   * @returns {{ rule: object, clicked: boolean } | null}
   */
  function evaluateRules(rules, canvas, gl, screenId) {
    const buffer = getBufferSize(canvas);
    const scaleMode = deps.getScaleMode();

    for (const rule of rules) {
      if (!isRuleReady(rule)) {
        continue;
      }
      // Gated out before any pixel is read, which pays back the screen check.
      if (!ruleAllowedOn(rule, screenId)) {
        continue;
      }

      for (const storedPoint of rule.points) {
        const hit = matchPoint(
          gl,
          storedPoint,
          colorForPoint(rule, storedPoint),
          buffer,
          scaleMode,
          rule.tolerance
        );
        if (!hit.matched) {
          continue;
        }

        return { rule, point: hit.point, clicked: clickBufferPoint(canvas, hit.point) };
      }
    }

    return null;
  }

  /**
   * Where the game is, once per tick.
   *
   * @returns {import('../rules/screen.js').Screen | null}
   */
  function updateScreen(canvas, gl) {
    const screens = deps.getScreens ? deps.getScreens() : [];
    if (screens.length === 0) {
      return null;
    }

    const screen = detectScreen(gl, screens, getBufferSize(canvas), deps.getScaleMode());
    const id = screen ? screen.id : null;

    if (id !== state.screen) {
      state.screen = id;
      state.screenName = screen ? screen.name : null;
      report('screen', { label: screen ? screen.name || screen.id : 'unknown', screenId: id });
    }

    return screen;
  }

  function tick() {
    if (!state.activeTask) {
      return;
    }
    // The rest phase deliberately reads nothing: after a Rerun click the game
    // is mid-run, and the button's colour would otherwise retrigger.
    if (state.activeTask === TaskId.RERUN && state.phase === Phase.RESTING) {
      return;
    }

    const target = getRenderTarget();
    if (!target) {
      setMessage('waiting for game canvas');
      return;
    }

    const screen = updateScreen(target.canvas, target.gl);
    // Under Run-All an exhausted resource is the cue to move on, not to stop.
    if (screen && screen.stopsTask && state.activeTask === TaskId.RUN_ALL) {
      advanceQueue('spent');
      return;
    }
    if (screen && screen.stopsTask) {
      const stopped = state.activeTask;
      const label = screen.name || screen.id;
      report('resource', { label });
      stop();
      setMessage(`${stopped} stopped: ${label}`);
      return;
    }

    const task = TASKS[state.activeTask];
    const hit = evaluateRules(task.getRules(), target.canvas, target.gl, state.screen);

    if (!hit) {
      if (state.activeTask === TaskId.RUN_ALL) {
        idleTicks += 1;
        if (idleTicks >= IDLE_ADVANCE_TICKS) {
          advanceQueue('idle');
          return;
        }
        setMessage(`${state.activityName || 'run all'}: no match`);
        return;
      }
      setMessage(`${state.activeTask}: no match`);
      return;
    }

    idleTicks = 0;

    if (hit.clicked) {
      state.lastActionAt = realNow();
      if (state.activeTask === TaskId.RERUN) {
        enterRestPhase();
      }
    }

    report(hit.clicked ? 'click' : 'busy', {
      ruleId: hit.rule.id,
      label: hit.rule.label || hit.rule.id,
      point: hit.point,
    });
    setMessage(`${hit.rule.label || hit.rule.id} → ${hit.clicked ? 'click' : 'busy'}`);
  }

  function enterRestPhase() {
    state.phase = Phase.RESTING;
    clearTimeout_(restTimer);

    restTimer = realSetTimeout(() => {
      restTimer = null;
      if (state.activeTask === TaskId.RERUN) {
        state.phase = Phase.HUNTING;
        setMessage('rerun: hunting');
      }
    }, INTERVAL_RERUN_REST);

    setMessage(`rerun: resting ${INTERVAL_RERUN_REST / 1000}s`);
  }

  function clearInterval_(id) {
    if (id !== null && id !== undefined) {
      realClearInterval(id);
    }
  }

  function clearTimeout_(id) {
    if (id !== null && id !== undefined) {
      realClearTimeout(id);
    }
  }

  function checkAutoStop() {
    if (!state.activeTask) {
      return;
    }
    if (realNow() - state.lastActionAt < AUTO_STOP_TIMEOUT) {
      return;
    }

    const stalled = state.activeTask;

    // The watchdog does not add a second timer; it changes what this one does.
    if (deps.shouldRecoverFromHang && deps.shouldRecoverFromHang() && deps.recoverFromHang) {
      report('hang', { label: stalled });
      setMessage(`${stalled} looks stuck — reloading`);
      if (deps.recoverFromHang(stalled)) {
        return;
      }
      stop();
      setMessage(`${stalled} stopped: reloading did not help`);
      return;
    }

    stop();
    setMessage(`${stalled} auto-stopped (idle ${AUTO_STOP_TIMEOUT / 60000}m)`);
  }

  /** @param {string} taskId */
  function start(taskId) {
    if (!TASKS[taskId]) {
      throw new Error(`unknown task: ${taskId}`);
    }
    if (state.activeTask) {
      stop();
    }

    state.activeTask = taskId;
    state.phase = Phase.HUNTING;
    state.lastActionAt = realNow();

    // Starting Run-All begins a clean round, at the top of the queue.
    spent = new Set();
    queueIndex = 0;
    idleTicks = 0;
    state.round = taskId === TaskId.RUN_ALL ? 1 : 0;
    setActivity(taskId === TaskId.RUN_ALL ? currentActivity() : null);

    pollTimer = realSetInterval(tick, TASKS[taskId].interval);
    autoStopTimer = realSetInterval(checkAutoStop, INTERVAL_AUTO_STOP_CHECK);

    report('task', { started: true, label: taskId });
    setMessage(`${taskId} started`);
    tick();
  }

  function stop() {
    if (!state.activeTask) {
      return;
    }
    const stopped = state.activeTask;

    state.activeTask = null;
    state.phase = Phase.HUNTING;
    state.screen = null;
    state.screenName = null;
    setActivity(null);

    clearInterval_(pollTimer);
    clearInterval_(autoStopTimer);
    clearTimeout_(restTimer);
    pollTimer = autoStopTimer = restTimer = null;

    report('task', { started: false, label: stopped });
    setMessage(`${stopped} stopped`);
  }

  /** Start the task, or stop it if it is the one already running. */
  function toggle(taskId) {
    if (state.activeTask === taskId) {
      stop();
    } else {
      start(taskId);
    }
  }

  return { start, stop, toggle, tick, checkIdle: checkAutoStop, getState, on: emitter.on, setMessage };
}
