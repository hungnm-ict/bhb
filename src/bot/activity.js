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

/**
 * The order a session actually runs in, best first.
 *
 * World Boss opens on a timer somebody else set, so it goes first or it is
 * missed; the rest descend by what an hour spent on them is worth. Only the
 * default — the queue is reorderable, and a profile that has been reordered
 * keeps its own order.
 */
export const DEFAULT_ACTIVITIES = Object.freeze([
  // Solo and team are two different sequences, not one with a setting: the
  // team lobby has a party to wait for and a Private box to get right.
  { id: 'worldboss', name: 'World Boss (solo)', enabled: true },
  { id: 'worldbossteam', name: 'World Boss (team)', enabled: false },
  { id: 'dungeon', name: 'Dungeon', enabled: true },
  { id: 'raid', name: 'Raid', enabled: true },
  { id: 'pvp', name: 'PVP', enabled: true },
  { id: 'trials', name: 'Trials / Gauntlet', enabled: true },
  { id: 'invasion', name: 'Invasion', enabled: true },
  { id: 'expedition', name: 'Expedition', enabled: true },
  { id: 'gvg', name: 'GVG', enabled: true },
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

/**
 * Badges for the HUD, where there is room for a word and not a name.
 *
 * Keyed by id rather than name so renaming an activity keeps its badge, and
 * so the two World Boss modes stay apart — the whole reason they are separate
 * activities is that they are separate sequences.
 */
const CODES = Object.freeze({
  pvp: 'PVP',
  gvg: 'GVG',
  invasion: 'INV',
  expedition: 'EXP',
  trials: 'TG',
  worldboss: 'WB-S',
  worldbossteam: 'WB-T',
  raid: 'RAID',
  dungeon: 'DUN',
});

/**
 * @param {{ id?: string, name?: string } | null} activity
 * @returns {string} at most four characters, never empty
 */
export function activityCode(activity) {
  if (!activity) {
    return '?';
  }
  const known = CODES[activity.id];
  if (known) {
    return known;
  }
  const letters = String(activity.name || '').replace(/[^\p{L}\p{N}]/gu, '');
  return letters ? letters.slice(0, 3).toUpperCase() : '?';
}

/**
 * Put a profile's activities back in the order a session runs.
 *
 * A stored order always wins over the default — that is what lets the queue be
 * reordered and stay reordered — so a profile made before the default changed
 * keeps the old one until it is asked to catch up. Switches and names are the
 * user's and are carried across untouched; anything not in the defaults keeps
 * its relative order at the end.
 *
 * @param {Activity[]} activities
 * @returns {Activity[]}
 */
export function sortToDefaultOrder(activities) {
  const rank = new Map(DEFAULT_ACTIVITIES.map((activity, index) => [activity.id, index]));
  const known = [];
  const unknown = [];

  for (const activity of activities) {
    (rank.has(activity.id) ? known : unknown).push(activity);
  }
  known.sort((left, right) => rank.get(left.id) - rank.get(right.id));

  return [...known, ...unknown];
}
