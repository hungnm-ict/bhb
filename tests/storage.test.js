/**
 * Storage is the one place a user's work can be lost, so the migration is
 * pinned: a v2 profile must come back with every rule it went in with.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { loadProfiles, saveProfiles, importProfiles } from '../src/core/storage.js';
import { STORAGE_KEY_PROFILES } from '../src/core/constants.js';

const V2 = {
  version: 2,
  activeProfileId: 'main',
  profiles: [
    {
      id: 'main',
      name: 'Main',
      rules: [{ id: 'r1', label: 'rerun', points: [{ x: 4, y: 5, bw: 800, bh: 600 }], hex: '#ff0000', tolerance: 10, enabled: true }],
    },
  ],
};

beforeEach(() => {
  localStorage.clear();
});

describe('v2 → v3 migration', () => {
  it('keeps the rules and adds an empty screen list', () => {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(V2));

    const state = loadProfiles();
    expect(state.version).toBe(3);
    expect(state.activeProfileId).toBe('main');
    expect(state.profiles[0].rules).toEqual(V2.profiles[0].rules);
    expect(state.profiles[0].screens).toEqual([]);
  });

  it('migrates an imported v2 export the same way', () => {
    const state = importProfiles(JSON.stringify(V2));
    expect(state.version).toBe(3);
    expect(state.profiles[0].rules).toHaveLength(1);
    expect(state.profiles[0].screens).toEqual([]);
  });

  it('round-trips screens through save and load', () => {
    const state = loadProfiles();
    state.profiles[0].screens.push({ id: 's1', name: 'loot', anchors: [], minRatio: 0.75, tolerance: 12, stopsTask: true });
    saveProfiles(state);

    const reloaded = loadProfiles();
    expect(reloaded.profiles[0].screens[0]).toMatchObject({ id: 's1', stopsTask: true });
  });
});
