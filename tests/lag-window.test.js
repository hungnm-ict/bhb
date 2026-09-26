/**
 * The hours this game's server is known to struggle in.
 *
 * Every day, the same clock times, and the last quarter of each is the worst
 * of it. Knowing costs nothing and is worth a great deal: asking a browser
 * for fifteen frames per real one is how a slow hour becomes a dead one.
 */
import { describe, it, expect } from 'vitest';
import { isInLagWindow, normaliseLagWindows, DEFAULT_LAG_WINDOWS } from '../src/core/lag.js';

/** A local-time clock reading, as the browser would give it. */
function at(hours, minutes) {
  const when = new Date(2026, 8, 26, hours, minutes, 0);
  return when;
}

describe('isInLagWindow', () => {
  const windows = [{ from: '06:00', to: '07:00' }, { from: '22:00', to: '23:00' }];

  it('is inside from the first minute to the last', () => {
    expect(isInLagWindow(at(6, 0), windows)).toBe(true);
    expect(isInLagWindow(at(6, 59), windows)).toBe(true);
  });

  it('is outside before and after', () => {
    expect(isInLagWindow(at(5, 59), windows)).toBe(false);
    expect(isInLagWindow(at(7, 0), windows)).toBe(false);
  });

  it('reads every window in the list, not only the first', () => {
    expect(isInLagWindow(at(22, 30), windows)).toBe(true);
  });

  it('handles a window that runs past midnight', () => {
    const late = [{ from: '23:30', to: '00:30' }];
    expect(isInLagWindow(at(23, 45), late)).toBe(true);
    expect(isInLagWindow(at(0, 15), late)).toBe(true);
    expect(isInLagWindow(at(1, 0), late)).toBe(false);
  });

  it('is false with no windows at all', () => {
    expect(isInLagWindow(at(6, 30), [])).toBe(false);
    expect(isInLagWindow(at(6, 30), null)).toBe(false);
  });
});

describe('normaliseLagWindows', () => {
  it('ships the three this game is known for', () => {
    expect(DEFAULT_LAG_WINDOWS).toHaveLength(3);
    expect(normaliseLagWindows(undefined)).toEqual(DEFAULT_LAG_WINDOWS);
  });

  it('keeps an empty list, because empty is a choice', () => {
    expect(normaliseLagWindows([])).toEqual([]);
  });

  it('throws out a window it cannot read', () => {
    const kept = normaliseLagWindows([
      { from: '06:00', to: '07:00' },
      { from: 'lunchtime', to: '07:00' },
      { from: '25:00', to: '07:00' },
      null,
    ]);
    expect(kept).toEqual([{ from: '06:00', to: '07:00' }]);
  });

  it('pads a time written the short way', () => {
    expect(normaliseLagWindows([{ from: '6:5', to: '7:00' }])).toEqual([
      { from: '06:05', to: '07:00' },
    ]);
  });
});
