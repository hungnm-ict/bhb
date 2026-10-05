import { sortToDefaultOrder } from './activity.js';
import { getCanvas } from '../core/canvas.js';
import { clientToBuffer, getBufferSize } from '../core/coords.js';
import { t } from '../i18n/index.js';

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

  function recordAvgRound(activityId, { avgRoundObserved, avgRoundSpeed }) {
    const activity = deps.getActivities().find((entry) => entry.id === activityId);
    if (!activity) {
      return;
    }
    activity.avgRoundObserved = avgRoundObserved;
    activity.avgRoundSpeed = avgRoundSpeed;
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

  /** Every activity's click zone, as JSON — moving them to another install. */
  function exportZones() {
    return JSON.stringify(
      deps
        .getActivities()
        .filter((activity) => activity.clickZone)
        .map((activity) => ({ id: activity.id, clickZone: activity.clickZone }))
    );
  }

  /**
   * Apply a batch of zones exported from another install.
   *
   * Matched by activity id, not position: `raid` and `pvp` are the same
   * ids everywhere, so a zone drawn once on one install can set the same
   * activity's zone on another without the icons even sitting at the
   * same spot on each account's screen. An id this install has no
   * activity for is skipped, not an error — a newer export may carry
   * an activity this profile never added.
   *
   * @param {string} json as `exportZones` wrote it
   * @returns {number} how many zones were applied
   * @throws {Error} on anything that is not a JSON array of `{ id, clickZone }`
   */
  function importZones(json) {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error(t('queue.importNotAnArray'));
    }

    const activities = deps.getActivities();
    let applied = 0;
    for (const entry of parsed) {
      const activity = activities.find((candidate) => candidate.id === entry.id);
      if (activity && entry.clickZone) {
        activity.clickZone = entry.clickZone;
        applied += 1;
      }
    }
    deps.persist();
    return applied;
  }

  return { setEnabled, setClickZone, exportZones, importZones, move, restoreOrder, recordAvgRound };
}
