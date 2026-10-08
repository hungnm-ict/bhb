import { getCanvas, getGl } from './canvas.js';
import { clientToBuffer, getBufferSize } from './coords.js';
import { detectScreen } from '../bot/screen.js';
import { HOME_ACTIVITY_ID } from '../bot/activity.js';

/**
 * Switch the Run target the moment a real click lands on a mapped icon.
 *
 * No pixel ever gets read: this is a coordinate check against where the
 * user's own click landed, against zones they drew by hand over the game's
 * own entry icons (Raid, PVP, ...). It costs nothing on an idle tick and
 * cannot corrupt a frame the way reading the framebuffer on a poll can.
 *
 * This fires whether or not a task is running: clicking a mapped icon while
 * the bot is mid-run switches the live target too, not just the next one.
 * It still backs off during a rest, where the game itself is mid-transition
 * and a click landing on the canvas is not a deliberate pick.
 *
 * `isTrusted` is what tells a real click apart from the bot's own synthetic
 * pointer sequence, which lands on the same canvas: a script-constructed
 * event is never trusted, by spec, with no way to fake it.
 *
 * Split from the DOM wiring on purpose: `isTrusted` is unforgeable by spec,
 * so a test cannot dispatch a trusted event to exercise this through
 * `addEventListener` at all. `handleClick` takes a plain object shaped like
 * the parts of an event this cares about instead.
 *
 * A zone is drawn over an entry icon that only exists on the game's home
 * screen (Raid, PVP, Boss, ...), but the click coordinates themselves mean
 * nothing off that screen: a dungeon's own "next tier" arrow can sit on the
 * exact pixels a zone was drawn on, and a bare coordinate check cannot tell
 * the two apart. Any screen marked `isHome` gates this: once one exists, a
 * zone only switches the Run target while that screen is the one actually on
 * show. No screen marked `isHome` means no gate — unchanged for anyone who
 * has not set one up.
 *
 * The Home zone is the one exception to that gate: it exists precisely to be
 * clicked from somewhere other than home — the Confirm button that lands
 * after an account switch, say — so requiring home to already be on show
 * would make it unusable. Landing on it also stops the active task and drops
 * speed back to 1x: a screen that just swapped accounts is not one to keep
 * clicking fast on.
 *
 * @param {{ isTrusted: boolean, target: EventTarget, clientX: number, clientY: number }} event
 * @param {object} deps
 * @param {() => import('../bot/activity.js').Activity[]} deps.getActivities
 * @param {() => { restingMs: number, activeTask: string | null }} deps.getEngineState
 * @param {(target: string) => void} deps.setRunTarget
 * @param {() => import('../bot/screen.js').Screen[]} [deps.getScreens]
 * @param {() => string} [deps.getScaleMode]
 * @param {() => void} [deps.stopTask]
 * @param {(speed: number) => void} [deps.setSpeed]
 */
export function handleClick(event, deps) {
  if (!event.isTrusted) {
    return;
  }

  const state = deps.getEngineState();
  if ((state.restingMs || 0) > 0) {
    return;
  }

  const canvas = getCanvas();
  // Only a click that actually landed on the game itself counts — not one
  // on the panel sitting over it, even at the same screen position.
  if (!canvas || event.target !== canvas) {
    return;
  }

  const point = clientToBuffer(canvas, event.clientX, event.clientY);
  const buffer = getBufferSize(canvas);
  const screens = deps.getScreens ? deps.getScreens() : [];
  const homeGated = screens.some((screen) => screen.isHome);
  let onHomeScreen;

  for (const activity of deps.getActivities()) {
    if (!activity.clickZone || !insideZone(scaleZone(activity.clickZone, buffer), point)) {
      continue;
    }

    if (activity.id !== HOME_ACTIVITY_ID && homeGated) {
      if (onHomeScreen === undefined) {
        onHomeScreen = isOnHomeScreen(canvas, screens, deps);
      }
      if (!onHomeScreen) {
        continue;
      }
    }

    if (activity.id === HOME_ACTIVITY_ID) {
      deps.stopTask?.();
      deps.setSpeed?.(1);
    }
    deps.setRunTarget(activity.id);
    return;
  }
}

function isOnHomeScreen(canvas, screens, deps) {
  const gl = getGl(canvas);
  if (!gl) {
    return false;
  }
  const mode = deps.getScaleMode ? deps.getScaleMode() : 'scale';
  const screen = detectScreen(gl, screens, getBufferSize(canvas), mode);
  return Boolean(screen && screen.isHome);
}

function scaleZone(zone, buffer) {
  if (!zone.bw || !zone.bh) {
    return zone;
  }
  const sx = buffer.width / zone.bw;
  const sy = buffer.height / zone.bh;
  return { x: zone.x * sx, y: zone.y * sy, w: zone.w * sx, h: zone.h * sy };
}

function insideZone(zone, point) {
  return (
    point.x >= zone.x &&
    point.x <= zone.x + zone.w &&
    point.y >= zone.y &&
    point.y <= zone.y + zone.h
  );
}

/**
 * @param {object} deps same shape `handleClick` takes
 * @returns {{ stop: () => void }}
 */
export function createClickSwitch(deps) {
  const onClick = (event) => handleClick(event, deps);

  // Capturing, same reasoning `cursor.js` already settled on: a game that
  // stops propagation on the way up must not be able to blind this.
  window.addEventListener('click', onClick, true);

  return {
    stop() {
      window.removeEventListener('click', onClick, true);
    },
  };
}
