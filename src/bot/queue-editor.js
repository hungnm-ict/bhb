import { sortToDefaultOrder } from './activity.js';
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

  return { setEnabled, move, restoreOrder };
}
