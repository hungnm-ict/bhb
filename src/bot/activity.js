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
 * Dungeon and Raid lead: they are the two every session runs regardless, so
 * they are what a fresh queue should reach first rather than last. World Boss
 * still opens on a timer somebody else set and can still be missed sitting
 * behind them — that trade is accepted on purpose for the default, and
 * anyone it costs drags it back above with the queue's own reordering. The
 * rest descend by what an hour spent on them is worth. Only the default —
 * the queue is reorderable, and a profile that has been reordered keeps its
 * own order.
 */
export const DEFAULT_ACTIVITIES = Object.freeze([
  { id: 'dungeon', name: 'Dungeon', enabled: true },
  { id: 'raid', name: 'Raid', enabled: true },
  // Solo and team are two different sequences, not one with a setting: the
  // team lobby has a party to wait for and a Private box to get right.
  { id: 'worldboss', name: 'World Boss (solo)', enabled: true },
  { id: 'worldbossteam', name: 'World Boss (team)', enabled: false },
  { id: 'pvp', name: 'PVP', enabled: true },
  // Two places with two entrances; one slot could only ever farm one of them.
  { id: 'trials', name: 'Trials', enabled: true },
  { id: 'gauntlet', name: 'Gauntlet', enabled: true },
  { id: 'invasion', name: 'Invasion', enabled: true },
  { id: 'expedition', name: 'Expedition', enabled: true },
  { id: 'gvg', name: 'GVG', enabled: true },
  // Not a farm activity: the safe/idle target a zone click lands on to get
  // the bot out of the way (see HOME_ACTIVITY_ID in click-switch.js).
  // Disabled by default so Run-All's rotation, which filters on `enabled`,
  // never picks it as a turn.
  { id: 'home', name: 'Home', enabled: false },
]);

/** The sentinel Run target a "go home and stay put" zone click switches to. */
export const HOME_ACTIVITY_ID = 'home';

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
  trials: 'TRI',
  gauntlet: 'GAUN',
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

/** How much of the newest round's length survives into the running estimate. */
const ROUND_EMA_WEIGHT = 0.3;

/**
 * Fold one completed round into an activity's learned duration.
 *
 * Only a round that actually ran its course is worth folding in: one cut
 * short because Run-All gave up and moved on idle says how long the bot
 * waited, not how long the activity takes, so the caller only measures a
 * round that ended because its resource ran out.
 *
 * @param {{ avgRoundObserved?: number, avgRoundSpeed?: number }} activity the
 *   two fields this reads off the activity that was timed
 * @param {number} elapsedSec this round's measured length
 * @param {number} speed the game-speed multiplier running at the time
 * @returns {{ avgRoundObserved: number, avgRoundSpeed: number } | null} null
 *   for a round too short to mean anything, such as one started moments
 *   before the resource ran out on the previous pass through the queue
 */
export function computeAvgRound(activity, elapsedSec, speed) {
  if (elapsedSec < 1) {
    return null;
  }
  // A round timed at one speed says nothing about another: start fresh
  // rather than average two different things together.
  const observed =
    activity.avgRoundSpeed !== speed || !activity.avgRoundObserved
      ? elapsedSec
      : activity.avgRoundObserved * (1 - ROUND_EMA_WEIGHT) + elapsedSec * ROUND_EMA_WEIGHT;
  return { avgRoundObserved: observed, avgRoundSpeed: speed };
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
