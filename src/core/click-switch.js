import { getCanvas } from './canvas.js';
import { clientToBuffer, getBufferSize } from './coords.js';

/**
 * Switch the Run target the moment a real click lands on a mapped icon.
 *
 * No pixel ever gets read: this is a coordinate check against where the
 * user's own click landed, against zones they drew by hand over the game's
 * own entry icons (Raid, PVP, ...). It costs nothing on an idle tick and
 * cannot corrupt a frame the way reading the framebuffer on a poll can.
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
 * @param {{ isTrusted: boolean, target: EventTarget, clientX: number, clientY: number }} event
 * @param {object} deps
 * @param {() => import('../bot/activity.js').Activity[]} deps.getActivities
 * @param {() => { restingMs: number, activeTask: string | null }} deps.getEngineState
 * @param {(target: string) => void} deps.setRunTarget
 */
export function handleClick(event, deps) {
  if (!event.isTrusted) {
    return;
  }

  const state = deps.getEngineState();
  if (state.activeTask || (state.restingMs || 0) > 0) {
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

  for (const activity of deps.getActivities()) {
    if (activity.clickZone && insideZone(scaleZone(activity.clickZone, buffer), point)) {
      deps.setRunTarget(activity.id);
      return;
    }
  }
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
