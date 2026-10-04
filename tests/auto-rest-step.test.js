/**
 * The pure arithmetic behind a learned rest duration: fold one measured
 * fight into a running estimate, pad it, cap it, and know when to throw a
 * measurement away rather than let it corrupt the average.
 */
import { describe, it, expect } from 'vitest';
import { createStep, computeAutoRest, REST_CEILING_SEC } from '../src/bot/step.js';
import { AUTO_STOP_TIMEOUT } from '../src/core/constants.js';

describe('createStep: the auto-rest fields', () => {
  it('defaults every new field off, so an existing profile is unaffected', () => {
    const step = createStep();
    expect(step.restAuto).toBe(false);
    expect(step.endsTimer).toBe(false);
    expect(step.restObserved).toBe(0);
    expect(step.restSpeedTo).toBe(0);
    expect(step.restAutoBlind).toBe(false);
  });
});

describe('REST_CEILING_SEC', () => {
  it('sits ten seconds under the auto-stop, in seconds', () => {
    expect(REST_CEILING_SEC).toBe(Math.round(AUTO_STOP_TIMEOUT / 1000) - 10);
  });
});

describe('computeAutoRest', () => {
  const fresh = { restObserved: 0, restSpeedTo: 0 };

  it('takes the first measurement as-is, padded by 15%', () => {
    const result = computeAutoRest(fresh, 40, 0);
    expect(result.restObserved).toBe(40);
    expect(result.restSec).toBe(46); // round(40 * 1.15)
    expect(result.restSpeedTo).toBe(0);
  });

  it('blends a second measurement 30% new, 70% history', () => {
    const afterFirst = { restObserved: 40, restSpeedTo: 0 };
    const result = computeAutoRest(afterFirst, 50, 0);
    expect(result.restObserved).toBeCloseTo(40 * 0.7 + 50 * 0.3, 5); // 43
    expect(result.restSec).toBe(Math.round(43 * 1.15)); // 49
  });

  it('discards a measurement past the ceiling, leaving nothing to apply', () => {
    expect(computeAutoRest(fresh, REST_CEILING_SEC + 1, 0)).toBeNull();
  });

  it('accepts a measurement exactly at the ceiling', () => {
    expect(computeAutoRest(fresh, REST_CEILING_SEC, 0)).not.toBeNull();
  });

  it('starts over instead of blending when speedTo has changed', () => {
    const atOldSpeed = { restObserved: 40, restSpeedTo: 1 };
    const result = computeAutoRest(atOldSpeed, 8, 10);
    // A 1x fight timed at 40s is not a sample of a 10x fight timed at 8s.
    expect(result.restObserved).toBe(8);
    expect(result.restSpeedTo).toBe(10);
  });

  it('keeps blending normally once speedTo matches again', () => {
    const atSameSpeed = { restObserved: 40, restSpeedTo: 10 };
    const result = computeAutoRest(atSameSpeed, 50, 10);
    expect(result.restObserved).toBeCloseTo(43, 5);
  });
});
