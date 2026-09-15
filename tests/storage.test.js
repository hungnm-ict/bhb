/**
 * Storage is the one place a user's work can be lost, so the migration is
 * pinned: a v2 profile must come back with every step it went in with.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadProfiles,
  saveProfiles,
  importProfiles,
  createProfile,
  duplicateProfile,
  renameProfile,
  deleteProfile,
  setActiveProfile,
  getActiveProfile,
} from '../src/core/storage.js';
import { STORAGE_KEY_PROFILES } from '../src/core/constants.js';
import { DEFAULT_ACTIVITIES } from '../src/bot/activity.js';

const V2 = {
  version: 2,
  activeProfileId: 'main',
  profiles: [
    {
      id: 'main',
      name: 'Main',
      // v2 called them rules, and that spelling is what has to keep loading.
      rules: [{ id: 'r1', label: 'rerun', points: [{ x: 4, y: 5, bw: 800, bh: 600 }], hex: '#ff0000', tolerance: 10, enabled: true }],
    },
  ],
};

beforeEach(() => {
  localStorage.clear();
});

describe('migration to the current schema', () => {
  it('keeps a v2 profile\'s steps and adds the new lists', () => {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(V2));

    const state = loadProfiles();
    expect(state.version).toBe(5);
    expect(state.activeProfileId).toBe('main');
    expect(state.profiles[0].steps).toEqual(V2.profiles[0].rules);
    expect(state.profiles[0].screens).toEqual([]);
    expect(state.profiles[0].activities.map((a) => a.id)).toEqual(
      DEFAULT_ACTIVITIES.map((a) => a.id)
    );
  });

  it('migrates an imported v2 export the same way', () => {
    const state = importProfiles(JSON.stringify(V2));
    expect(state.version).toBe(5);
    expect(state.profiles[0].steps).toHaveLength(1);
    expect(state.profiles[0].screens).toEqual([]);
    expect(state.profiles[0].activities).toHaveLength(DEFAULT_ACTIVITIES.length);
  });

  it('keeps a queue the user has already reordered', () => {
    const v3 = {
      version: 3,
      activeProfileId: 'main',
      profiles: [
        {
          id: 'main',
          name: 'Main',
          rules: [],
          screens: [],
          activities: [{ id: 'raid', name: 'Raid', enabled: false }],
        },
      ],
    };
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(v3));

    const state = loadProfiles();
    expect(state.profiles[0].activities).toEqual(v3.profiles[0].activities);
  });

  it('round-trips screens through save and load', () => {
    const state = loadProfiles();
    state.profiles[0].screens.push({ id: 's1', name: 'loot', anchors: [], minRatio: 0.75, tolerance: 12, stopsTask: true });
    saveProfiles(state);

    const reloaded = loadProfiles();
    expect(reloaded.profiles[0].screens[0]).toMatchObject({ id: 's1', stopsTask: true });
  });
});

describe('profiles', () => {
  it('creates, renames and switches', () => {
    const state = loadProfiles();
    const created = createProfile(state, 'NFT');

    expect(state.profiles).toHaveLength(2);
    expect(getActiveProfile(state).name).toBe('NFT');

    renameProfile(state, created.id, 'CLONE');
    expect(getActiveProfile(state).name).toBe('CLONE');

    setActiveProfile(state, state.profiles[0].id);
    expect(getActiveProfile(state).id).toBe(state.profiles[0].id);
    expect(setActiveProfile(state, 'nope')).toBe(false);
  });

  it('duplicates the active profile without sharing its steps', () => {
    const state = loadProfiles();
    getActiveProfile(state).steps.push({ id: 'r1', label: 'one', points: [], hex: null, tolerance: 10, enabled: true });

    const copy = duplicateProfile(state, 'Copy');
    copy.steps[0].label = 'changed';

    expect(state.profiles[0].steps[0].label, 'the original is untouched').toBe('one');
    expect(copy.activities).toHaveLength(DEFAULT_ACTIVITIES.length);
  });

  it('refuses to delete the last profile, because no profiles has no meaning', () => {
    const state = loadProfiles();
    expect(deleteProfile(state, state.profiles[0].id)).toBe(false);
    expect(state.profiles).toHaveLength(1);
  });

  it('moves the active profile along when the active one is deleted', () => {
    const state = loadProfiles();
    const first = state.profiles[0].id;
    const second = createProfile(state, 'Second');

    expect(deleteProfile(state, second.id)).toBe(true);
    expect(state.activeProfileId).toBe(first);
  });
});
