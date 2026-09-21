import { describe, it, expect } from 'vitest';
import {
  activityCode,
  createDefaultActivities,
  sortToDefaultOrder,
} from '../src/bot/activity.js';

describe('activityCode', () => {
  it('gives each built-in activity a badge that fits the HUD', () => {
    const codes = createDefaultActivities().map((activity) => activityCode(activity));
    expect(codes).toEqual(['WB-S', 'WB-T', 'DUN', 'RAID', 'PVP', 'TG', 'INV', 'EXP', 'GVG']);
  });

  it('keeps the two World Boss modes apart', () => {
    expect(activityCode({ id: 'worldboss', name: 'World Boss (solo)' })).toBe('WB-S');
    expect(activityCode({ id: 'worldbossteam', name: 'World Boss (team)' })).toBe('WB-T');
  });

  it('never returns a code long enough to stretch the HUD', () => {
    for (const activity of createDefaultActivities()) {
      expect(activityCode(activity).length).toBeLessThanOrEqual(4);
    }
  });

  it('falls back to the name for an activity it does not know', () => {
    // Renaming an activity must not blank its badge.
    expect(activityCode({ id: 'fishing', name: 'Fishing' })).toBe('FIS');
    expect(activityCode({ id: 'x', name: 'blue moon' })).toBe('BLU');
  });

  it('skips punctuation and spaces when deriving a fallback', () => {
    expect(activityCode({ id: 'x', name: '  a-b c  ' })).toBe('ABC');
  });

  it('survives an activity with no usable name', () => {
    expect(activityCode({ id: 'x', name: '' })).toBe('?');
    expect(activityCode({ id: 'x' })).toBe('?');
    expect(activityCode(null)).toBe('?');
  });
});

describe('restoring the default order', () => {
  it('puts a profile back in the order the roadmap runs', () => {
    const stored = [
      { id: 'pvp', name: 'PVP', enabled: true },
      { id: 'dungeon', name: 'Dungeon', enabled: true },
      { id: 'worldboss', name: 'World Boss (solo)', enabled: true },
    ];

    expect(sortToDefaultOrder(stored).map((one) => one.id)).toEqual([
      'worldboss',
      'dungeon',
      'pvp',
    ]);
  });

  it('keeps each activity switched the way the user left it', () => {
    const stored = [
      { id: 'pvp', name: 'PVP', enabled: false },
      { id: 'worldboss', name: 'World Boss (solo)', enabled: true },
    ];

    const sorted = sortToDefaultOrder(stored);
    expect(sorted.find((one) => one.id === 'pvp').enabled).toBe(false);
  });

  it('keeps a renamed activity under its own name', () => {
    const stored = [{ id: 'dungeon', name: 'Hang ngục', enabled: true }];
    expect(sortToDefaultOrder(stored)[0].name).toBe('Hang ngục');
  });

  it('leaves an activity it does not know at the end, in the order it was', () => {
    const stored = [
      { id: 'mine', name: 'Fishing', enabled: true },
      { id: 'pvp', name: 'PVP', enabled: true },
      { id: 'other', name: 'Trading', enabled: true },
    ];

    expect(sortToDefaultOrder(stored).map((one) => one.id)).toEqual(['pvp', 'mine', 'other']);
  });

  it('changes nothing when the order is already right', () => {
    const already = createDefaultActivities();
    expect(sortToDefaultOrder(already).map((one) => one.id)).toEqual(
      already.map((one) => one.id)
    );
  });
});
