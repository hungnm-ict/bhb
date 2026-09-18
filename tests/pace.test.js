import { describe, it, expect } from 'vitest';
import { nextPace, FIRST_PACE } from '../src/core/pace.js';
import { SCRIPT_PACE_LADDER } from '../src/core/constants.js';

describe('nextPace', () => {
  it('starts a run at the fastest rung', () => {
    expect(FIRST_PACE).toBe(300);
    expect(SCRIPT_PACE_LADDER[0]).toBe(FIRST_PACE);
  });

  it('backs off one rung at a time when nothing matches', () => {
    expect(nextPace(300, false)).toBe(600);
    expect(nextPace(600, false)).toBe(1200);
    expect(nextPace(1200, false)).toBe(2000);
    expect(nextPace(2000, false)).toBe(3000);
  });

  it('stays on the slowest rung once it gets there', () => {
    expect(nextPace(3000, false)).toBe(3000);
  });

  it('drops back to the fastest rung on a click', () => {
    expect(nextPace(3000, true)).toBe(300);
    expect(nextPace(1200, true)).toBe(300);
    expect(nextPace(300, true)).toBe(300);
  });

  it('rejoins the ladder from a pace that is not on it', () => {
    // A stale value from an older build must not strand the loop off-ladder.
    expect(nextPace(999, false)).toBe(1200);
    expect(nextPace(5000, false)).toBe(3000);
  });

  it('treats a missing or zero pace as the fastest rung already spent', () => {
    expect(nextPace(0, false)).toBe(600);
    expect(nextPace(undefined, false)).toBe(600);
    expect(nextPace(null, true)).toBe(300);
  });
});
