import {
  STORAGE_KEY_PROFILES,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_LEGACY_RULES,
  DEFAULT_COLOR_TOLERANCE,
} from './constants.js';
import { createRule } from '../rules/model.js';
import { ScaleMode } from './coords.js';
import { createDefaultActivities } from '../rules/activity.js';

/**
 * Persistence for rule profiles and settings.
 *
 * Every read is defensive: `localStorage` can throw outright (private mode,
 * blocked site data) and its contents are user-editable via import, so a
 * malformed blob must degrade to defaults rather than take the bot down.
 *
 * @typedef {import('../rules/model.js').Rule} Rule
 * @typedef {import('../rules/screen.js').Screen} Screen
 * @typedef {import('../rules/activity.js').Activity} Activity
 * @typedef {{ id: string, name: string, rules: Rule[], screens: Screen[], activities: Activity[] }} Profile
 * @typedef {{ version: 4, activeProfileId: string, profiles: Profile[] }} ProfileState
 *
 * Each migration only ever adds a list: v3 added `screens`, v4 adds
 * `activities`. An export from any earlier version still loads with every
 * rule it had.
 */

const SCHEMA_VERSION = 4;

/** @returns {ProfileState} */
function createDefaultState() {
  return {
    version: SCHEMA_VERSION,
    activeProfileId: 'default',
    profiles: [
      {
        id: 'default',
        name: 'Default',
        rules: [],
        screens: [],
        activities: createDefaultActivities(),
      },
    ],
  };
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn(`[BHB] could not read ${key}`, error);
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[BHB] could not write ${key}`, error);
    return false;
  }
}

/**
 * Pull rules across from upstream's bh-scripts, once.
 *
 * Those rules carry no capture size, so they cannot be scaled — they load as
 * legacy points and the overlay marks them for re-capture.
 *
 * @returns {Rule[]}
 */
function importLegacyRules() {
  const legacy = readJson(STORAGE_KEY_LEGACY_RULES);
  if (!Array.isArray(legacy)) {
    return [];
  }

  return legacy
    .filter((entry) => entry && typeof entry.x === 'number')
    .map((entry) =>
      createRule({
        label: 'imported',
        points: [{ x: entry.x, y: entry.y }],
        hex: entry.hex ?? null,
        tolerance: entry.tol ?? DEFAULT_COLOR_TOLERANCE,
        enabled: entry.enabled !== false,
      })
    );
}

/** @param {unknown} candidate @returns {ProfileState} */
function normaliseState(candidate) {
  if (
    !candidate ||
    typeof candidate !== 'object' ||
    !Array.isArray(candidate.profiles) ||
    candidate.profiles.length === 0
  ) {
    return createDefaultState();
  }

  const profiles = candidate.profiles
    .filter((profile) => profile && typeof profile.id === 'string')
    .map((profile) => ({
      id: profile.id,
      name: typeof profile.name === 'string' ? profile.name : profile.id,
      rules: Array.isArray(profile.rules) ? profile.rules : [],
      screens: Array.isArray(profile.screens) ? profile.screens : [],
      activities:
        Array.isArray(profile.activities) && profile.activities.length > 0
          ? profile.activities
          : createDefaultActivities(),
    }));

  if (profiles.length === 0) {
    return createDefaultState();
  }

  const active = profiles.some((p) => p.id === candidate.activeProfileId)
    ? candidate.activeProfileId
    : profiles[0].id;

  return { version: SCHEMA_VERSION, activeProfileId: active, profiles };
}

/** @returns {ProfileState} */
export function loadProfiles() {
  const stored = readJson(STORAGE_KEY_PROFILES);

  if (stored) {
    return normaliseState(stored);
  }

  const state = createDefaultState();
  const imported = importLegacyRules();
  if (imported.length > 0) {
    state.profiles[0].rules = imported;
    console.info(`[BHB] imported ${imported.length} rule(s) from bh-scripts`);
  }
  saveProfiles(state);
  return state;
}

/** @param {ProfileState} state */
export function saveProfiles(state) {
  return writeJson(STORAGE_KEY_PROFILES, state);
}

/**
 * @param {ProfileState} state
 * @returns {Profile}
 */
export function getActiveProfile(state) {
  return (
    state.profiles.find((p) => p.id === state.activeProfileId) ??
    state.profiles[0]
  );
}

/** @returns {{ scaleMode: string, language: string, closeAfterRound: boolean }} */
export function loadSettings() {
  const stored = readJson(STORAGE_KEY_SETTINGS) || {};
  return {
    scaleMode:
      stored.scaleMode === ScaleMode.ABSOLUTE
        ? ScaleMode.ABSOLUTE
        : ScaleMode.SCALE,
    language: stored.language === 'en' ? 'en' : 'vi',
    // A bot that closes the game unasked is a bot that loses a session.
    closeAfterRound: stored.closeAfterRound === true,
  };
}

export function saveSettings(settings) {
  return writeJson(STORAGE_KEY_SETTINGS, settings);
}

/** @param {ProfileState} state @returns {string} pretty JSON for sharing */
export function exportProfiles(state) {
  return JSON.stringify(state, null, 2);
}

/**
 * @param {string} json
 * @returns {ProfileState}
 * @throws {Error} when the text is not a usable profile export
 */
export function importProfiles(json) {
  const parsed = JSON.parse(json);
  const state = normaliseState(parsed);
  if (state.profiles.every((p) => p.rules.length === 0) && !parsed.profiles) {
    throw new Error('not a BHB profile export');
  }
  return state;
}
