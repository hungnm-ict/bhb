import { getRenderTarget } from './canvas.js';
import { getBufferSize } from './coords.js';
import { scoreScreen } from '../bot/screen.js';
import { realSetInterval, realClearInterval } from './timers.js';
import { AUTO_SWITCH_POLL_MS } from './constants.js';

/**
 * Auto-switch the Run target from the screen on show.
 *
 * Only while no task is running: the Run button and its hotkey decide
 * Stop-vs-Run by comparing the Run target against what the engine is
 * doing, so changing the target out from under a running task would turn
 * the user's own Stop control into "start something else" instead.
 *
 * Edge-triggered: a Screen that keeps matching across many ticks changes
 * the Run target exactly once, the tick it started matching. Forcing it
 * back every tick while the screen just sits there would fight a user who
 * picked something else by hand in the meantime.
 *
 * A single tick with no match, or an ambiguous one, does not by itself
 * forget the last match: a toast, a transition frame, or the game
 * briefly rendering two tagged screens at once must not be enough to
 * re-arm the trigger and fight a manual pick made while the real screen
 * never left. Only a run of consecutive misses counts as the screen
 * genuinely gone.
 *
 * @param {object} deps
 * @param {() => import('../bot/screen.js').Screen[]} deps.getScreens
 * @param {() => { id: string }[]} deps.getActivities
 * @param {() => { restingMs: number, activeTask: string | null }} deps.getEngineState
 * @param {() => string | null} deps.getRunTarget
 * @param {(target: string) => void} deps.setRunTarget
 * @param {() => string} deps.getScaleMode
 * @returns {{ stop: () => void }}
 */
export function createAutoSwitch(deps) {
  const MISSES_TO_FORGET = 3;

  /** The trigger Screen that matched last tick, or null. */
  let lastMatchedId = null;
  let misses = 0;

  function tick() {
    const state = deps.getEngineState();

    // A running task owns the Run target's meaning until it stops; and
    // mid-fight is not a moment to go looking for a different screen
    // anyway, so this also covers the engine's own blind-rest window.
    if (state.activeTask || (state.restingMs || 0) > 0) {
      return;
    }

    const target = getRenderTarget();
    if (!target) {
      return;
    }

    const activityIds = new Set(deps.getActivities().map((activity) => activity.id));
    const candidates = deps
      .getScreens()
      .filter((screen) => screen.triggerActivity && activityIds.has(screen.triggerActivity));

    const buffer = getBufferSize(target.canvas);
    const scaleMode = deps.getScaleMode();
    const matched = candidates.filter(
      (screen) => scoreScreen(target.gl, screen, buffer, scaleMode).matched
    );

    // Anything other than exactly one match is treated as no match: zero
    // is nothing to act on, and two or more is the same ambiguity the
    // Screens tab's own clash warning already exists to point out.
    if (matched.length !== 1) {
      misses += 1;
      if (misses >= MISSES_TO_FORGET) {
        lastMatchedId = null;
      }
      return;
    }
    misses = 0;

    const screen = matched[0];
    if (screen.id === lastMatchedId) {
      return;
    }
    lastMatchedId = screen.id;

    if (deps.getRunTarget() !== screen.triggerActivity) {
      deps.setRunTarget(screen.triggerActivity);
    }
  }

  const timer = realSetInterval(tick, AUTO_SWITCH_POLL_MS);

  return {
    stop() {
      realClearInterval(timer);
    },
  };
}
