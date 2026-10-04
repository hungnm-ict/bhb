import { getRenderTarget } from './canvas.js';
import { getBufferSize } from './coords.js';
import { scoreScreen } from '../bot/screen.js';
import { realSetInterval, realClearInterval } from './timers.js';
import { AUTO_SWITCH_POLL_MS } from './constants.js';

/**
 * Auto-switch the Run target from the screen on show.
 *
 * Independent of the engine's own task scheduler on purpose: it runs
 * whether or not a task is active, because the whole point is to notice a
 * screen the user opened instead of starting anything. It never presses
 * Run, only ever changes which activity the dropdown is sitting on.
 *
 * Edge-triggered: a Screen that keeps matching across many ticks changes
 * the Run target exactly once, the tick it started matching. Forcing it
 * back every tick while the screen just sits there would fight a user who
 * picked something else by hand in the meantime.
 *
 * @param {object} deps
 * @param {() => import('../bot/screen.js').Screen[]} deps.getScreens
 * @param {() => { id: string }[]} deps.getActivities
 * @param {() => { restingMs: number }} deps.getEngineState
 * @param {() => string | null} deps.getRunTarget
 * @param {(target: string) => void} deps.setRunTarget
 * @param {() => string} deps.getScaleMode
 * @returns {{ stop: () => void }}
 */
export function createAutoSwitch(deps) {
  /** The trigger Screen that matched last tick, or null. */
  let lastMatchedId = null;

  function tick() {
    // Mid-fight is not a moment to go looking for a different screen, and
    // the engine already is not reading anything itself while resting.
    if ((deps.getEngineState().restingMs || 0) > 0) {
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
      lastMatchedId = null;
      return;
    }

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
