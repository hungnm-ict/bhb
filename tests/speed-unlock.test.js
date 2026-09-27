/**
 * The two stops past 10x.
 *
 * They are what makes an hour of farming into twenty minutes, and also what
 * asks a browser for twenty frames per real one — which on most machines
 * delivers nothing like twenty and is how a slow hour becomes a dead one.
 * Off unless asked for.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSpeed,
  setSpeed,
  setSpeedUnlocked,
  getSpeedStops,
  snapSpeed,
  stepSpeed,
} from '../src/core/speed.js';

beforeEach(() => {
  setSpeedUnlocked(false);
  setSpeed(1);
});

describe('the speed stops', () => {
  it('stop at 10x while locked', () => {
    expect(getSpeedStops()).toEqual([0.1, 0.5, 1, 2, 5, 10]);
  });

  it('reach 20x once unlocked', () => {
    setSpeedUnlocked(true);
    expect(getSpeedStops()).toEqual([0.1, 0.5, 1, 2, 5, 10, 15, 20]);
  });

  it('snap a number past the cap down to it while locked', () => {
    expect(snapSpeed(18)).toBe(10);
    setSpeedUnlocked(true);
    expect(snapSpeed(18)).toBe(20);
  });

  it('cannot be stepped past the cap while locked', () => {
    expect(stepSpeed(10, 1)).toBe(10);
    setSpeedUnlocked(true);
    expect(stepSpeed(10, 1)).toBe(15);
  });
});

describe('locking while already above the cap', () => {
  it('brings the speed down rather than leaving it out of reach', () => {
    setSpeedUnlocked(true);
    setSpeed(20);
    expect(getSpeed()).toBe(20);

    setSpeedUnlocked(false);
    expect(getSpeed(), 'a speed the slider cannot show is a speed nobody can undo').toBe(10);
  });

  it('leaves a speed inside the range alone', () => {
    setSpeedUnlocked(true);
    setSpeed(5);
    setSpeedUnlocked(false);
    expect(getSpeed()).toBe(5);
  });
});
