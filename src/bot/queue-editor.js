import { sortToDefaultOrder } from './activity.js';
import { getCanvas } from '../core/canvas.js';
import { clientToBuffer, getBufferSize } from '../core/coords.js';

/**
 * Enabling and reordering the Run-All queue.
 *
 * Order is the queue order, so moving a row is the whole feature.
 *
 * @param {object} deps
 * @param {() => import('./activity.js').Activity[]} deps.getActivities
 * @param {() => void} deps.persist
 */
export function createQueueEditor(deps) {
  function setEnabled(activityId, enabled) {
    const activity = deps.getActivities().find((entry) => entry.id === activityId);
    if (!activity) {
      return;
    }
    activity.enabled = enabled;
    deps.persist();
  }

  /**
   * Where this activity's own entry icon sits, for the click-switch to watch.
   *
   * Stored as a plain rectangle, never a pixel: nothing here is ever read
   * off the framebuffer, only compared against where a real click landed.
   *
   * @param {string} activityId
   * @param {{ left: number, top: number, width: number, height: number } | null} clientRect
   *   client-space, as `startDragSelect` hands it back; null clears the zone
   */
  function setClickZone(activityId, clientRect) {
    const activity = deps.getActivities().find((entry) => entry.id === activityId);
    if (!activity) {
      return;
    }
    if (!clientRect) {
      activity.clickZone = null;
      deps.persist();
      return;
    }

    const canvas = getCanvas();
    if (!canvas) {
      return;
    }
    // Client space has its origin top-left, buffer space bottom-left, so the
    // rectangle's bottom edge is what becomes its origin.
    const origin = clientToBuffer(canvas, clientRect.left, clientRect.top + clientRect.height);
    const far = clientToBuffer(canvas, clientRect.left + clientRect.width, clientRect.top);
    const buffer = getBufferSize(canvas);

    activity.clickZone = {
      x: origin.x,
      y: origin.y,
      w: Math.max(1, far.x - origin.x),
      h: Math.max(1, far.y - origin.y),
      bw: buffer.width,
      bh: buffer.height,
    };
    deps.persist();
  }

  function move(activityId, delta) {
    const activities = deps.getActivities();
    const from = activities.findIndex((entry) => entry.id === activityId);
    const to = from + delta;
    if (from === -1 || to < 0 || to >= activities.length) {
      return;
    }
    const [activity] = activities.splice(from, 1);
    activities.splice(to, 0, activity);
    deps.persist();
  }

  /**
   * Catch a profile up with the order a session runs in.
   *
   * A stored order wins over the default, so a profile made before the default
   * changed keeps the old one until it is asked. The array is refilled rather
   * than replaced because the profile owns it.
   */
  function restoreOrder() {
    const activities = deps.getActivities();
    activities.splice(0, activities.length, ...sortToDefaultOrder([...activities]));
    deps.persist();
  }

  return { setEnabled, setClickZone, move, restoreOrder };
}
