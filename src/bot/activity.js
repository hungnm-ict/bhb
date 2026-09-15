/**
 * The Run-All queue.
 *
 * An activity owns nothing — it is a name that steps point at. Splitting the
 * step list eight ways would fork the table, the storage and the export, and
 * would make moving a step between activities a re-capture. A tag keeps one
 * of each and turns "move this to GVG" into a dropdown.
 *
 * @typedef {object} Activity
 * @property {string} id
 * @property {string} name
 * @property {boolean} enabled
 */

/** The roadmap's order, which is the order the game rewards. */
export const DEFAULT_ACTIVITIES = Object.freeze([
  { id: 'pvp', name: 'PVP', enabled: true },
  { id: 'gvg', name: 'GVG', enabled: true },
  { id: 'invasion', name: 'Invasion', enabled: true },
  { id: 'expedition', name: 'Expedition', enabled: true },
  { id: 'trials', name: 'Trials / Gauntlet', enabled: true },
  { id: 'worldboss', name: 'World Boss', enabled: true },
  { id: 'raid', name: 'Raid', enabled: true },
  { id: 'dungeon', name: 'Dungeon', enabled: true },
]);

/** @returns {Activity[]} a fresh, mutable copy — the default list is frozen. */
export function createDefaultActivities() {
  return DEFAULT_ACTIVITIES.map((activity) => ({ ...activity }));
}

/**
 * @param {import('./step.js').Step[]} steps
 * @param {string} activityId
 */
export function stepsForActivity(steps, activityId) {
  return steps.filter((step) => step.activity === activityId);
}

/** Steps with no activity are the loose Script set they have always been. */
export function looseSteps(steps) {
  return steps.filter((step) => !step.activity);
}
