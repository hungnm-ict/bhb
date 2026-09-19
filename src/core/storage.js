import {
  STORAGE_KEY_PROFILES,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_LEGACY_RULES,
  DEFAULT_COLOR_TOLERANCE,
} from './constants.js';
import { createStep } from '../bot/step.js';
import { ScaleMode } from './coords.js';
import { createDefaultActivities, DEFAULT_ACTIVITIES } from '../bot/activity.js';
import { normaliseNotifyConfig } from './notify.js';
import { normaliseProbes } from './probe.js';

/**
 * Persistence for step profiles and settings.
 *
 * Every read is defensive: `localStorage` can throw outright (private mode,
 * blocked site data) and its contents are user-editable via import, so a
 * malformed blob must degrade to defaults rather than take the bot down.
 *
 * @typedef {import('../bot/step.js').Step} Step
 * @typedef {import('../bot/screen.js').Screen} Screen
 * @typedef {import('../bot/activity.js').Activity} Activity
 * @typedef {{ id: string, name: string, steps: Step[], screens: Screen[], activities: Activity[] }} Profile
 * @typedef {{ version: 4, activeProfileId: string, profiles: Profile[] }} ProfileState
 *
 * Migrations only ever add a list or rename one: v3 added `screens`, v4 added
 * `activities`, and v5 renamed `rules` to `steps` along with the concept. An
 * export from any earlier version still loads with everything it had.
 */

const SCHEMA_VERSION = 5;

/** @returns {ProfileState} */
function createDefaultState() {
  return {
    version: SCHEMA_VERSION,
    activeProfileId: 'default',
    profiles: [
      {
        id: 'default',
        name: 'Default',
        steps: [],
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
 * Pull steps across from upstream's bh-scripts, once.
 *
 * Those steps carry no capture size, so they cannot be scaled — they load as
 * legacy points and the overlay marks them for re-capture.
 *
 * @returns {Step[]}
 */
function importLegacySteps() {
  const legacy = readJson(STORAGE_KEY_LEGACY_RULES);
  if (!Array.isArray(legacy)) {
    return [];
  }

  return legacy
    .filter((entry) => entry && typeof entry.x === 'number')
    .map((entry) =>
      createStep({
        label: 'imported',
        points: [{ x: entry.x, y: entry.y }],
        hex: entry.hex ?? null,
        tolerance: entry.tol ?? DEFAULT_COLOR_TOLERANCE,
        enabled: entry.enabled !== false,
      })
    );
}

/**
 * Keep the user's list and order, and add anything new since they saved it.
 *
 * A profile stores its own activity list, so a default added later — World Boss
 * split into solo and team — would never reach anyone who had already used the
 * bot. A new entry lands beside the default it belongs next to rather than at
 * the end, because "World Boss (team)" nine rows below "World Boss" is a list
 * nobody would have written on purpose.
 */
function mergeActivities(stored) {
  if (!Array.isArray(stored) || stored.length === 0) {
    return createDefaultActivities();
  }

  const merged = [...stored];
  const has = (id) => merged.some((activity) => activity && activity.id === id);

  DEFAULT_ACTIVITIES.forEach((activity, index) => {
    if (has(activity.id)) {
      return;
    }
    // Walk back through the defaults for the nearest one the user still has;
    // that is this entry's neighbour, wherever they moved it to.
    let at = merged.length;
    for (let before = index - 1; before >= 0; before -= 1) {
      const anchor = merged.findIndex((entry) => entry && entry.id === DEFAULT_ACTIVITIES[before].id);
      if (anchor !== -1) {
        at = anchor + 1;
        break;
      }
    }
    merged.splice(at, 0, { ...activity, enabled: false });
  });

  return merged;
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
      // v4 and earlier called them rules; the same objects, under the old name.
      steps: Array.isArray(profile.steps)
        ? profile.steps
        : Array.isArray(profile.rules)
          ? profile.rules
          : [],
      screens: Array.isArray(profile.screens) ? profile.screens : [],
      activities: mergeActivities(profile.activities),
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
  const imported = importLegacySteps();
  if (imported.length > 0) {
    state.profiles[0].steps = imported;
    console.info(`[BHB] imported ${imported.length} step(s) from bh-scripts`);
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

/** @returns {string} */
function createProfileId() {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Profile management.
 *
 * A profile holds everything that makes a configuration — steps, screens and
 * the activity queue — so a character slot or a second account is a profile
 * and needs no concept of its own.
 *
 * @param {ProfileState} state
 * @param {string} name
 * @returns {Profile} the new profile, already active
 */
export function createProfile(state, name) {
  const profile = {
    id: createProfileId(),
    name: name || `Profile ${state.profiles.length + 1}`,
    steps: [],
    screens: [],
    activities: createDefaultActivities(),
  };
  state.profiles.push(profile);
  state.activeProfileId = profile.id;
  return profile;
}

/** A copy of the active profile, including its steps. */
export function duplicateProfile(state, name) {
  const source = getActiveProfile(state);
  const copy = JSON.parse(JSON.stringify(source));
  copy.id = createProfileId();
  copy.name = name || `${source.name} copy`;
  state.profiles.push(copy);
  state.activeProfileId = copy.id;
  return copy;
}

export function renameProfile(state, profileId, name) {
  const profile = state.profiles.find((entry) => entry.id === profileId);
  if (!profile || !name) {
    return false;
  }
  profile.name = name;
  return true;
}

/**
 * A state with no profiles has no meaning, and every read would have to defend
 * against it, so deleting the last one is refused rather than handled.
 *
 * @returns {boolean} whether anything was deleted
 */
export function deleteProfile(state, profileId) {
  if (state.profiles.length <= 1) {
    return false;
  }
  const index = state.profiles.findIndex((entry) => entry.id === profileId);
  if (index === -1) {
    return false;
  }
  state.profiles.splice(index, 1);
  if (state.activeProfileId === profileId) {
    state.activeProfileId = state.profiles[0].id;
  }
  return true;
}

export function setActiveProfile(state, profileId) {
  if (!state.profiles.some((entry) => entry.id === profileId)) {
    return false;
  }
  state.activeProfileId = profileId;
  return true;
}

/** Off by default: pinning costs sharpness, and most users never share steps. */
function normaliseCanvasLock(stored) {
  return { enabled: Boolean(stored && stored.enabled === true) };
}

/**
 * @returns {{ scaleMode: string, language: string, closeAfterRound: boolean,
 *   watchdog: boolean, sizeBadge: boolean, keepAlive: boolean,
 *   notify: import('./notify.js').NotifyConfig,
 *   probes: import('./probe.js').Probe[] }}
 */
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
    watchdog: stored.watchdog === true,
    sizeBadge: stored.sizeBadge !== false,
    fpsBadge: stored.fpsBadge !== false,
    // Drift belongs to a boost, not to the account: carrying hours of it into
    // another character is what conjures a daily reset out of nothing.
    clockSafety: stored.clockSafety !== false,
    keepAlive: stored.keepAlive !== false,
    notify: normaliseNotifyConfig(stored.notify),
    canvasLock: normaliseCanvasLock(stored.canvasLock),
    probes: normaliseProbes(stored.probes),
    // What the Run key starts: the loose Script set, one activity's id, or
    // the whole queue. Kept because it is the one thing a session repeats.
    runTarget: typeof stored.runTarget === 'string' ? stored.runTarget : 'script',
    // Which settings section is expanded; it is usually the same one twice.
    openSection: typeof stored.openSection === 'string' ? stored.openSection : null,
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
  if (state.profiles.every((p) => p.steps.length === 0) && !parsed.profiles) {
    throw new Error('not a BHB profile export');
  }
  return state;
}
