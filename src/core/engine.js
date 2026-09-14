import { getRenderTarget } from './canvas.js';
import { readPixel } from './pixel.js';
import { hexToRgb, colorMatches } from './color.js';
import { clickBufferPoint } from './input.js';
import { resolvePoint, getBufferSize } from './coords.js';
import { isRuleReady, colorForPoint } from '../rules/model.js';
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
 */

export function createEngine(deps) {
  const emitter = createEmitter();

  const state = {
    /** @type {string | null} */
    activeTask: null,
    phase: Phase.HUNTING,
    lastActionAt: 0,
    lastMessage: '',
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
   * @param {'click'|'busy'|'task'|'idle'} kind
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
      remainingMs: state.activeTask
        ? Math.max(0, AUTO_STOP_TIMEOUT - (realNow() - state.lastActionAt))
        : 0,
    };
  }

  /**
   * Walk a rule's points and click the first colour match.
   * @returns {{ rule: object, clicked: boolean } | null}
   */
  function evaluateRules(rules, canvas, gl) {
    const buffer = getBufferSize(canvas);
    const scaleMode = deps.getScaleMode();

    for (const rule of rules) {
      if (!isRuleReady(rule)) {
        continue;
      }

      for (const storedPoint of rule.points) {
        const resolved = resolvePoint(storedPoint, buffer, scaleMode);
        const pixel = readPixel(gl, resolved.x, resolved.y);
        if (!pixel) {
          continue;
        }

        const expected = hexToRgb(colorForPoint(rule, storedPoint));
        if (!colorMatches(pixel, expected, rule.tolerance)) {
          continue;
        }

        return { rule, point: resolved, clicked: clickBufferPoint(canvas, resolved) };
      }
    }

    return null;
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

    const task = TASKS[state.activeTask];
    const hit = evaluateRules(task.getRules(), target.canvas, target.gl);

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
