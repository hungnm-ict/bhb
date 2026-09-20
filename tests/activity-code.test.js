import { describe, it, expect } from 'vitest';
import { activityCode, createDefaultActivities } from '../src/bot/activity.js';

describe('activityCode', () => {
  it('gives each built-in activity a badge that fits the HUD', () => {
    const codes = createDefaultActivities().map((activity) => activityCode(activity));
    expect(codes).toEqual(['PVP', 'GVG', 'INV', 'EXP', 'TG', 'WB-S', 'WB-T', 'RAID', 'DUN']);
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
