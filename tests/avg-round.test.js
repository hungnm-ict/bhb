/**
 * The pure arithmetic behind an activity's learned round length: fold one
 * completed round into a running estimate, and know when to throw a
 * measurement away rather than let it corrupt the average.
 */
import { describe, it, expect } from 'vitest';
import { computeAvgRound } from '../src/bot/activity.js';

describe('computeAvgRound', () => {
  const fresh = { avgRoundObserved: 0, avgRoundSpeed: 0 };

  it('takes the first measurement as-is', () => {
    const result = computeAvgRound(fresh, 70, 1);
    expect(result.avgRoundObserved).toBe(70);
    expect(result.avgRoundSpeed).toBe(1);
  });

  it('blends a second measurement 30% new, 70% history', () => {
    const afterFirst = { avgRoundObserved: 70, avgRoundSpeed: 1 };
    const result = computeAvgRound(afterFirst, 100, 1);
    expect(result.avgRoundObserved).toBeCloseTo(70 * 0.7 + 100 * 0.3, 5); // 79
  });

  it('discards a round shorter than a second, leaving nothing to apply', () => {
    expect(computeAvgRound(fresh, 0.5, 1)).toBeNull();
  });

  it('starts over instead of blending when the speed multiplier has changed', () => {
    const atOldSpeed = { avgRoundObserved: 70, avgRoundSpeed: 1 };
    const result = computeAvgRound(atOldSpeed, 7, 10);
    // A 1x round timed at 70s is not a sample of a 10x round timed at 7s.
    expect(result.avgRoundObserved).toBe(7);
    expect(result.avgRoundSpeed).toBe(10);
  });

  it('keeps blending normally once the speed matches again', () => {
    const atSameSpeed = { avgRoundObserved: 70, avgRoundSpeed: 10 };
    const result = computeAvgRound(atSameSpeed, 100, 10);
    expect(result.avgRoundObserved).toBeCloseTo(79, 5);
  });
});
