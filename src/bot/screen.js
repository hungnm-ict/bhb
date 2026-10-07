import { matchFingerprint, DEFAULT_MIN_RATIO } from '../core/region.js';
import { slotsForBoss } from './worldboss.js';
import { DEFAULT_COLOR_TOLERANCE } from '../core/constants.js';

/**
 * Where the game is.
 *
 * A colour only means something in context: the shade that says "Yes" on the
 * raid dialog says something else on the loot screen, and a bot that cannot
 * tell them apart clicks both. A screen is a name for a set of anchors that
 * are all on screen together.
 *
 * Running out of energy, tickets or badges is not a separate mechanism — it is
 * a screen with `stopsTask`, which is what replaces waiting out the blind
 * five-minute idle timeout.
 *
 * @typedef {import('../core/region.js').Fingerprint} Fingerprint
 * @typedef {object} Screen
 * @property {string} id
 * @property {string} name
 * @property {Fingerprint[]} anchors
 * @property {number} minRatio
 * @property {number} tolerance
 * @property {boolean} stopsTask
 * @property {boolean} notify announce it to Discord/Telegram when it appears
 * @property {boolean} isHome whether this screen is the one entry-icon zones
 *   (Raid, PVP, Boss, ...) were drawn on — a zone click only switches the Run
 *   target while this screen is the one actually on show, so a button that
 *   happens to share the same pixels on a different screen (a dungeon's own
 *   "next tier" arrow, say) cannot be misread as the zone drawn there
 * @property {boolean} isParty whether this screen shows a party list
 * @property {string | null} bossId which World Boss, which is what says how
 *   many seats the list has
 * @property {number} listTop buffer y of the top edge of the first row
 * @property {number} pitch buffer pixels between one row and the next
 * @property {number} listBh framebuffer height the two above were measured at
 */

export function createScreenId() {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** @param {Partial<Screen>} [overrides] @returns {Screen} */
export function createScreen(overrides = {}) {
  return {
    id: createScreenId(),
    name: '',
    anchors: [],
    minRatio: DEFAULT_MIN_RATIO,
    tolerance: DEFAULT_COLOR_TOLERANCE,
    stopsTask: false,
    notify: false,
    isHome: false,
    isParty: false,
    bossId: null,
    listTop: 0,
    pitch: 0,
    listBh: 0,
    ...overrides,
  };
}

/** A screen with no anchors matches nothing; it would otherwise match always. */
export function isScreenReady(screen) {
  return Boolean(screen && screen.anchors && screen.anchors.length > 0);
}

/**
 * Score one screen. Every anchor has to be present.
 *
 * @returns {{ matched: boolean, ratio: number }} ratio is the weakest anchor's
 */
export function scoreScreen(gl, screen, buffer, mode) {
  if (!isScreenReady(screen)) {
    return { matched: false, ratio: 0 };
  }

  let weakest = 1;
  for (const anchor of screen.anchors) {
    const result = matchFingerprint(gl, anchor, buffer, mode, screen.tolerance, screen.minRatio);
    weakest = Math.min(weakest, result.ratio);
    if (!result.matched) {
      return { matched: false, ratio: weakest };
    }
  }
  return { matched: true, ratio: weakest };
}

/**
 * The party geometry a screen describes, or null when it describes none.
 *
 * Null is the answer for every screen that is not a party list, and it is
 * what makes a slotted point behave as the plain rectangle it was before:
 * one row is one row.
 *
 * @param {Screen | null | undefined} screen
 * @returns {import('../core/region.js').Slotting | null}
 */
export function slottingFor(screen) {
  if (!screen || !screen.isParty || !screen.pitch) {
    return null;
  }
  return {
    listTop: screen.listTop,
    pitch: screen.pitch,
    bh: screen.listBh,
    slots: slotsForBoss(screen.bossId),
  };
}

/**
 * The first screen whose anchors all match. List order is priority, as it is
 * for steps.
 *
 * @returns {Screen | null} null when the bot does not recognise where it is
 */
export function detectScreen(gl, screens, buffer, mode) {
  for (const screen of screens || []) {
    if (scoreScreen(gl, screen, buffer, mode).matched) {
      return screen;
    }
  }
  return null;
}

/**
 * A step with no `screens` fires anywhere — which is every step written before
 * this existed.
 *
 * @param {{ screens?: string[] }} step
 * @param {string | null} screenId
 */
export function stepAllowedOn(step, screenId) {
  if (!step.screens || step.screens.length === 0) {
    return true;
  }
  return screenId !== null && step.screens.includes(screenId);
}
