/**
 * The World Bosses, and how many seats each party has.
 *
 * Party size is a property of the boss, not of the room, so it is knowledge
 * the bot can carry rather than a number the user has to look up and type.
 * A screen says which boss is on show; this table says how many rows its
 * party list has.
 *
 * Tiers are here because they are the other fact that distinguishes one boss
 * from another, and a screen named for the wrong boss is easiest to spot by
 * the tier it is being run at.
 *
 * @typedef {object} WorldBoss
 * @property {string} id
 * @property {string} name as the game's title bar spells it
 * @property {number} slots seats in the party, the room's owner included
 * @property {number[]} tiers tiers the boss can be run at; 3 covers T3 to T9
 */

/** @type {readonly WorldBoss[]} */
export const WORLD_BOSSES = Object.freeze([
  { id: 'orlag', name: 'Orlag Clan', slots: 5, tiers: [3, 10, 11, 12] },
  { id: 'nether', name: 'Netherworld', slots: 3, tiers: [3, 10, 11, 12, 13] },
  { id: 'melvin', name: 'Melvin Factory', slots: 4, tiers: [10, 11] },
  { id: 'exterm', name: '3XT3RM1N4T10N', slots: 3, tiers: [10, 11] },
  { id: 'brimstone', name: 'Brimstone Syndicate', slots: 3, tiers: [11, 12] },
  { id: 'titans', name: 'Titans Attack!', slots: 3, tiers: [11, 12, 13, 14, 15, 16] },
  { id: 'abyss', name: 'The Ignited Abyss', slots: 3, tiers: [13, 14, 15, 16, 17, 18] },
  { id: 'nordic', name: 'Nordic Dream', slots: 4, tiers: [16, 17, 18, 19, 20, 21] },
  { id: 'beef', name: 'Notorious Beef', slots: 4, tiers: [18, 19, 20, 21] },
  { id: 'goodall', name: 'Project: Goodall', slots: 4, tiers: [7, 14, 21] },
]);

/**
 * How many seats a boss's party has.
 *
 * An unknown id is one seat, not a guess: a party of one behaves exactly as
 * the single rectangle every point was before slots existed.
 *
 * @param {string | null | undefined} bossId
 * @returns {number}
 */
export function slotsForBoss(bossId) {
  const boss = WORLD_BOSSES.find((candidate) => candidate.id === bossId);
  return boss ? boss.slots : 1;
}

/** @param {string | null | undefined} bossId @returns {WorldBoss | null} */
export function findBoss(bossId) {
  return WORLD_BOSSES.find((candidate) => candidate.id === bossId) || null;
}
