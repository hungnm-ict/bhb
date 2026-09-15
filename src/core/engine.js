import { getRenderTarget } from './canvas.js';
import { matchPoint } from './region.js';
import { clickBufferPoint } from './input.js';
import { getBufferSize } from './coords.js';
import { isRuleReady, colorForPoint } from '../rules/model.js';
import { detectScreen, ruleAllowedOn } from '../rules/screen.js';
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
  };

  let pollTimer = null;
  let autoStopTimer = null;
  let restTimer = null;

  const TASKS = {
    [TaskId.RERUN]: { interval: INTERVAL_RERUN_HUNT, getRules: deps.getRerunRules },
    [TaskId.WORLD_BOSS]: { interval: INTERVAL_WORLD_BOSS, getRules: deps.getWorldBossRules },
    [TaskId.SCRIPT]: { interval: INTERVAL_SCRIPT, getRules: deps.getScriptRules },
  };

  /**
   * A discrete thing that happened, for the activity log.
   *
   * `lastMessage` is overwritten on every tick, so a log cannot be recovered
   * from it; these events are what the log tab is built from.
   *
   * @param {'click'|'busy'|'task'|'idle'|'screen'|'resource'} kind
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
      setMessage(`${state.activeTask}: no match`);
      return;
    }

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
    if (realNow() - state.lastActionAt >= AUTO_STOP_TIMEOUT) {
      const stopped = state.activeTask;
      stop();
      setMessage(`${stopped} auto-stopped (idle ${AUTO_STOP_TIMEOUT / 60000}m)`);
    }
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

  return { start, stop, toggle, tick, getState, on: emitter.on, setMessage };
}
