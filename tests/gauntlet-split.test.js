/**
 * Trials and Gauntlet were one slot called "Trials / Gauntlet".
 *
 * They are two places with two entrances, so a step set for one is a step set
 * that has to be told which. Splitting them cannot cost anyone the sequence
 * they already captured, so the old slot keeps its steps and the new one
 * starts as a copy of them.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { loadProfiles, saveProfiles } from '../src/core/storage.js';
import { DEFAULT_ACTIVITIES } from '../src/bot/activity.js';

/** A profile as a build before the split would have written it. */
function oldState() {
  return {
    version: 5,
    activeProfileId: 'p1',
    profiles: [
      {
        id: 'p1',
        name: 'Main',
        steps: [
          { id: 's1', label: 'enter', activity: 'trials', hex: '#ff0000', points: [{ x: 1, y: 2 }] },
          { id: 's2', label: 'start', activity: 'trials', hex: '#00ff00', points: [{ x: 3, y: 4 }] },
          { id: 's3', label: 'pvp', activity: 'pvp', hex: '#0000ff', points: [{ x: 5, y: 6 }] },
        ],
        screens: [],
        activities: [
          { id: 'trials', name: 'Trials / Gauntlet', enabled: true },
          { id: 'pvp', name: 'PVP', enabled: true },
        ],
      },
    ],
  };
}

function loadFrom(state) {
  window.localStorage.clear();
  saveProfiles(state);
  return loadProfiles().profiles[0];
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('the defaults', () => {
  it('offer Trials and Gauntlet as two slots', () => {
    const ids = DEFAULT_ACTIVITIES.map((activity) => activity.id);
    expect(ids).toContain('trials');
    expect(ids).toContain('gauntlet');
  });
});

describe('a profile written before the split', () => {
  it('keeps every Trials step where it was', () => {
    const profile = loadFrom(oldState());
    const trials = profile.steps.filter((step) => step.activity === 'trials');

    expect(trials.map((step) => step.label)).toEqual(['enter', 'start']);
  });

  it('starts Gauntlet as a copy, with ids of its own', () => {
    const profile = loadFrom(oldState());
    const gauntlet = profile.steps.filter((step) => step.activity === 'gauntlet');

    expect(gauntlet.map((step) => step.label)).toEqual(['enter', 'start']);
    expect(gauntlet[0].id).not.toBe('s1');
    expect(gauntlet[0].hex).toBe('#ff0000');
  });

  it('drops Gauntlet from the name the old slot carried', () => {
    const profile = loadFrom(oldState());
    const trials = profile.activities.find((activity) => activity.id === 'trials');

    expect(trials.name).toBe('Trials');
  });

  it('leaves a name the user typed alone', () => {
    const state = oldState();
    state.profiles[0].activities[0].name = 'Đấu trường';

    const profile = loadFrom(state);
    expect(profile.activities.find((one) => one.id === 'trials').name).toBe('Đấu trường');
  });

  it('leaves Gauntlet switched off, because its steps are a guess', () => {
    const profile = loadFrom(oldState());
    const gauntlet = profile.activities.find((activity) => activity.id === 'gauntlet');

    expect(gauntlet.enabled).toBe(false);
  });

  it('touches no other activity', () => {
    const profile = loadFrom(oldState());
    expect(profile.steps.filter((step) => step.activity === 'pvp')).toHaveLength(1);
  });
});

describe('loading twice', () => {
  it('does not copy the steps again', () => {
    saveProfiles(oldState());
    loadProfiles();
    const second = loadProfiles().profiles[0];

    expect(second.steps.filter((step) => step.activity === 'gauntlet')).toHaveLength(2);
  });
});
