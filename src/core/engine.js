import { getRenderTarget } from './canvas.js';
import { matchPoint } from './region.js';
import { clickBufferPoint } from './input.js';
import { getBufferSize } from './coords.js';
import { isStepReady, colorForPoint, StepKind, pointsByPlace } from '../bot/step.js';
import { detectScreen, stepAllowedOn } from '../bot/screen.js';
import { stepsForActivity, looseSteps } from '../bot/activity.js';
import { createEmitter } from './events.js';
import { realNow, realSetInterval, realClearInterval } from './timers.js';
import {
  INTERVAL_SCRIPT,
  INTERVAL_AUTO_STOP_CHECK,
  INTERVAL_RUN_ALL,
  IDLE_ADVANCE_TICKS,
  RESYNC_AFTER_TICKS,
  AUTO_STOP_TIMEOUT,
} from './constants.js';

/**
 * The automation loop.
 *
 * One task runs at a time. A task polls on its own interval, walks its steps
 * in order, and clicks the first point whose colour matches — first match
 * wins, so step order encodes priority.
 *
 * All scheduling uses the real timers: the speed hack scales the *game*, and
 * a poll that sped up with it would just burn CPU re-reading the same frame.
 */

export const TaskId = Object.freeze({
  SCRIPT: 'script',
  SOLO: 'solo',
  RUN_ALL: 'runAll',
});

/**
 * @typedef {object} EngineDeps
 * @property {() => import('../bot/step.js').Step[]} getScriptSteps
 * @property {() => string} getScaleMode
 * @property {() => import('../bot/screen.js').Screen[]} [getScreens]
 * @property {() => import('../bot/activity.js').Activity[]} [getActivities]
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
    /** @type {string | null} id of the step the runner is waiting for */
    expectedStepId: null,
    round: 0,
  };

  /** Activities already out of resources this round; cleared when it wraps. */
  let spent = new Set();
  let queueIndex = 0;
  let idleTicks = 0;

  /** Where the runner is in the current step list. See `runSequence`. */
  const cursor = { key: null, index: 0, misses: 0 };

  /** When the current rest ends; the loop reads nothing until then. */
  let restingUntil = 0;

  let pollTimer = null;
  let autoStopTimer = null;


  const TASKS = {
    [TaskId.SCRIPT]: { interval: INTERVAL_SCRIPT, getSteps: () => looseSteps(deps.getScriptSteps()) },
    [TaskId.SOLO]: { interval: INTERVAL_RUN_ALL, getSteps: soloSteps },
    [TaskId.RUN_ALL]: { interval: INTERVAL_RUN_ALL, getSteps: runAllRules },
  };

  /**
   * One activity on its own.
   *
   * This is what the hard-coded World Boss mode used to be, and it needs no
   * mode of its own: an activity the user tagged, run by itself, off the same
   * steps the queue would use.
   */
  function soloSteps() {
    return state.activity ? stepsForActivity(deps.getScriptSteps(), state.activity) : [];
  }

  function activities() {
    return (deps.getActivities ? deps.getActivities() : []).filter((a) => a.enabled);
  }

  /** The current activity's steps; the queue never sees the loose Script set. */
  function runAllRules() {
    const current = currentActivity();
    return current ? stepsForActivity(deps.getScriptSteps(), current.id) : [];
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
    cursor.key = null;

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
        report('activity', {
          label: queue[index].name,
          activityId: queue[index].id,
          why,
          round: state.round,
          // Who ran dry is the activity being left, never the one announced.
          ...(why === 'spent' && leaving ? { spentId: leaving.id, spentName: leaving.name } : {}),
        });
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
   * @param {'click'|'busy'|'task'|'idle'|'screen'|'resource'|'activity'|'hang'|'resync'|'notify'} kind
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
      lastMessage: state.lastMessage,
      screen: state.screen,
      screenName: state.screenName,
      activity: state.activity,
      activityName: state.activityName,
      expectedStepId: state.expectedStepId,
      round: state.round,
      restingMs: Math.max(0, restingUntil - realNow()),
      spent: [...spent],
      remainingMs: state.activeTask
        ? Math.max(0, AUTO_STOP_TIMEOUT - (realNow() - state.lastActionAt))
        : 0,
    };
  }

  /**
   * Walk a step's points and click the first colour match.
   * @returns {{ step: object, clicked: boolean } | null}
   */
  /**
   * Try one step against the frame on screen.
   *
   * @returns {{ step: object, point: object, clicked: boolean } | null}
   */
  /**
   * Is this step's colour on screen right now?
   *
   * Separate from clicking, because a `wait` step asks the same question and
   * must not answer it with a click.
   *
   * @returns {{ x: number, y: number } | null}
   */
  function matchStep(step, gl, screenId, buffer, scaleMode) {
    if (!isStepReady(step)) {
      return null;
    }
    // Gated out before any pixel is read, which pays back the screen check.
    if (!stepAllowedOn(step, screenId)) {
      return null;
    }

    for (const storedPoint of step.points) {
      const hit = matchPoint(
        gl,
        storedPoint,
        colorForPoint(step, storedPoint),
        buffer,
        scaleMode,
        step.tolerance
      );
      if (hit.matched) {
        return hit.point;
      }
    }
    return null;
  }

  /**
   * How many of a step's places still show their colour.
   *
   * @returns {number}
   */
  function countPlaces(step, gl, screenId, buffer, scaleMode) {
    if (!isStepReady(step) || !stepAllowedOn(step, screenId)) {
      return 0;
    }
    let seen = 0;
    for (const place of pointsByPlace(step)) {
      const matched = place.some(
        (storedPoint) =>
          matchPoint(
            gl,
            storedPoint,
            colorForPoint(step, storedPoint),
            buffer,
            scaleMode,
            step.tolerance
          ).matched
      );
      if (matched) {
        seen += 1;
      }
    }
    return seen;
  }

  function tryStep(step, canvas, gl, screenId, buffer, scaleMode) {
    const point = matchStep(step, gl, screenId, buffer, scaleMode);
    if (!point) {
      return null;
    }
    return { step, point, clicked: clickBufferPoint(canvas, point) };
  }

  /** First match wins. Order is priority, and nothing is remembered. */
  function runSteps(steps, canvas, gl, screenId) {
    const buffer = getBufferSize(canvas);
    const scaleMode = deps.getScaleMode();

    for (let index = 0; index < steps.length; index += 1) {
      const hit = tryStep(steps[index], canvas, gl, screenId, buffer, scaleMode);
      if (hit) {
        return { ...hit, index };
      }
    }
    return null;
  }

  /**
   * Walk a list in order, and find the way back when the game does not.
   *
   * A list the user wrote is a sequence — open PVP, pick an opponent, accept —
   * and first-match-wins cannot express it: two buttons on one screen would
   * leave the runner clicking the first one forever. So the runner keeps its
   * place and tries the expected step first.
   *
   * A game is not a script, though. A daily reward pops up, a battle ends on a
   * screen nobody planned for, a click does not land. When the expected step
   * has not matched for `RESYNC_AFTER_TICKS`, the runner stops trusting its
   * place and takes whatever fits the screen in front of it — that is what
   * keeps a strict sequence from becoming a deadlock.
   */
  function runSequence(steps, canvas, gl, screenId) {
    const key = sequenceKey();
    if (key === null || steps.length === 0) {
      return runSteps(steps, canvas, gl, screenId);
    }

    if (cursor.key !== key) {
      cursor.key = key;
      cursor.index = 0;
      cursor.misses = 0;
    }

    const buffer = getBufferSize(canvas);
    const scaleMode = deps.getScaleMode();

    // Several steps can be settled in one tick — a gate that has opened, an
    // optional step with nothing to do — so the cursor walks until it reaches
    // one that has to wait or one that clicks.
    for (let hops = 0; hops < steps.length; hops += 1) {
      const expected = steps[cursor.index % steps.length];
      state.expectedStepId = expected ? expected.id : null;
      const point = matchStep(expected, gl, screenId, buffer, scaleMode);

      if (expected.kind === StepKind.WAIT) {
        // Counted, not spotted: "wait for a third player" is a count of empty
        // seats, and which seats they are is the game's business, not ours.
        const stillThere = countPlaces(expected, gl, screenId, buffer, scaleMode);
        if (stillThere > (expected.maxMatches || 0)) {
          cursor.misses = 0;
          setMessage(
            `${expected.label || expected.id}: waiting (${stillThere} left)`
          );
          return null;
        }
        cursor.index = (cursor.index + 1) % steps.length;
        continue;
      }

      if (point) {
        cursor.index = (cursor.index + 1) % steps.length;
        cursor.misses = 0;
        return { step: expected, point, clicked: clickBufferPoint(canvas, point) };
      }

      // Optional: there was nothing to do here, which is not the same as being
      // stuck — the ticked-already checkbox is the whole reason this exists.
      if (expected.optional) {
        cursor.index = (cursor.index + 1) % steps.length;
        continue;
      }

      cursor.misses += 1;
      break;
    }

    if (cursor.misses < RESYNC_AFTER_TICKS) {
      // Still waiting for the expected step: taking a later one out of turn is
      // exactly the out-of-order clicking the cursor exists to prevent.
      return null;
    }

    const scan = runSteps(steps, canvas, gl, screenId);
    if (!scan) {
      return null;
    }

    report('resync', { label: scan.step.label || scan.step.id });
    cursor.index = (scan.index + 1) % steps.length;
    cursor.misses = 0;
    return scan;
  }

  /**
   * Which list the cursor is currently walking, or null for the built-ins —
   * those are a handful of unordered reflexes, not a sequence.
   */
  function sequenceKey() {
    if (state.activeTask === TaskId.RUN_ALL || state.activeTask === TaskId.SOLO) {
      return state.activity;
    }
    if (state.activeTask === TaskId.SCRIPT) {
      return 'script';
    }
    return null;
  }

  /**
   * Where the game is, once per tick.
   *
   * @returns {import('../bot/screen.js').Screen | null}
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
      // Only on the change: a drop popup sits there for several ticks, and one
      // sighting should not become a dozen alerts.
      if (screen && screen.notify) {
        report('notify', { label: screen.name || screen.id, screenId: id });
      }
    }

    return screen;
  }

  function tick() {
    if (!state.activeTask) {
      return;
    }
    // Resting reads nothing on purpose: the fight this step started is still
    // running, and the frame has nothing new to say until it ends.
    if (restingUntil > realNow()) {
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
    const hit = runSequence(task.getSteps(), target.canvas, target.gl, state.screen);

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
      const rest = Number(hit.step.restSec) || 0;
      if (rest > 0) {
        restingUntil = realNow() + rest * 1000;
        setMessage(`${hit.step.label || hit.step.id}: resting ${rest}s`);
      }
    }

    report(hit.clicked ? 'click' : 'busy', {
      stepId: hit.step.id,
      label: hit.step.label || hit.step.id,
      point: hit.point,
    });
    setMessage(`${hit.step.label || hit.step.id} → ${hit.clicked ? 'click' : 'busy'}`);
  }

  function clearInterval_(id) {
    if (id !== null && id !== undefined) {
      realClearInterval(id);
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
  /**
   * @param {string} taskId
   * @param {string} [activityId] required by TaskId.SOLO; ignored otherwise
   */
  function start(taskId, activityId = null) {
    if (!TASKS[taskId]) {
      throw new Error(`unknown task: ${taskId}`);
    }
    if (state.activeTask) {
      stop();
    }

    state.activeTask = taskId;
    state.lastActionAt = realNow();
    restingUntil = 0;

    // Starting Run-All begins a clean round, at the top of the queue.
    spent = new Set();
    queueIndex = 0;
    idleTicks = 0;
    cursor.key = null;
    state.expectedStepId = null;
    state.round = taskId === TaskId.RUN_ALL ? 1 : 0;

    if (taskId === TaskId.SOLO) {
      const solo = (deps.getActivities ? deps.getActivities() : []).find(
        (activity) => activity.id === activityId
      );
      setActivity(solo || null);
    } else {
      setActivity(taskId === TaskId.RUN_ALL ? currentActivity() : null);
    }

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
    restingUntil = 0;
    state.screen = null;
    state.screenName = null;
    state.expectedStepId = null;
    cursor.key = null;
    setActivity(null);

    clearInterval_(pollTimer);
    clearInterval_(autoStopTimer);
    pollTimer = autoStopTimer = null;

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
