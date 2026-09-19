import { getRenderTarget } from '../core/canvas.js';
import { detectScreen } from './screen.js';
import { getBufferSize } from '../core/coords.js';
import { scoreSteps } from './dry-run.js';
import { realSetTimeout, realClearTimeout } from '../core/timers.js';
import { DRY_RUN_STEP_MS } from '../core/constants.js';

/**
 * Walking the step list for the user to watch.
 *
 * Every step is scored up front, against one frame — a rehearsal that re-read
 * the screen at each step would be scoring a moving target and could not be
 * compared with itself. The walk afterwards is presentation: it lights the
 * steps in order at a pace an eye can follow.
 *
 * Nothing here clicks. That is the point: the bot running is already a key
 * away, and what this answers instead is which steps would fire and in what
 * order.
 *
 * @param {object} deps
 * @param {() => import('./step.js').Step[]} deps.getSteps
 * @param {() => import('./screen.js').Screen[]} deps.getScreens
 * @param {() => string} deps.getScaleMode
 * @param {(run: { index: number, scores: Record<string, string>,
 *   misses: Record<string, { drift: number, seen: string }> } | null) => void} deps.onTick
 */
export function createDryRunner(deps) {
  let timer = null;

  function clear() {
    if (timer !== null) {
      realClearTimeout(timer);
      timer = null;
    }
  }

  function isRunning() {
    return timer !== null;
  }

  /** @returns {boolean} whether a run started */
  function start() {
    clear();

    const steps = deps.getSteps();
    const target = getRenderTarget();
    if (steps.length === 0 || !target) {
      deps.onTick(null);
      return false;
    }

    const screen = detectScreen(
      target.gl,
      deps.getScreens(),
      getBufferSize(target.canvas),
      deps.getScaleMode()
    );
    const scored = scoreSteps(steps, target, deps.getScaleMode(), screen ? screen.id : null);

    const scores = {};
    /** How close a miss came, kept apart so a verdict stays one plain word. */
    const misses = {};
    for (const entry of scored) {
      scores[entry.stepId] = entry.verdict;
      if (entry.drift !== undefined) {
        misses[entry.stepId] = { drift: entry.drift, seen: entry.seen };
      }
    }

    let index = 0;
    const advance = () => {
      if (index >= steps.length) {
        stop();
        return;
      }
      deps.onTick({ index, scores, misses });
      index += 1;
      timer = realSetTimeout(advance, DRY_RUN_STEP_MS);
    };

    advance();
    return true;
  }

  function stop() {
    clear();
    deps.onTick(null);
  }

  return { start, stop, isRunning };
}
