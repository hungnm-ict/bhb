import { describe, it, expect } from 'vitest';
import { LOCK_SIZES, LOCK_SIZE, normaliseLockSize } from '../src/core/canvas-lock.js';

describe('the sizes the canvas can be pinned to', () => {
  it('offers three, smallest first', () => {
    expect(LOCK_SIZES).toEqual([
      { width: 560, height: 350 },
      { width: 640, height: 400 },
      { width: 800, height: 500 },
    ]);
  });

  it('keeps every size on one aspect ratio', () => {
    // The whole point of pinning: a step captured at one size resolves onto
    // another by proportion, which only holds while the proportion holds.
    for (const size of LOCK_SIZES) {
      expect(size.width / size.height).toBeCloseTo(1.6, 5);
    }
  });

  it('still calls 640x400 the default', () => {
    expect(LOCK_SIZE).toEqual({ width: 640, height: 400 });
    expect(LOCK_SIZES).toContainEqual(LOCK_SIZE);
  });
});

describe('normaliseLockSize', () => {
  it('passes an offered size through', () => {
    expect(normaliseLockSize({ width: 800, height: 500 })).toEqual({ width: 800, height: 500 });
    expect(normaliseLockSize({ width: 560, height: 350 })).toEqual({ width: 560, height: 350 });
  });

  it('falls back to the default for anything not offered', () => {
    // Includes the sizes an older build wrote, which were never a menu.
    expect(normaliseLockSize({ width: 800, height: 520 })).toEqual(LOCK_SIZE);
    expect(normaliseLockSize({ width: 1024, height: 640 })).toEqual(LOCK_SIZE);
  });

  it('survives junk', () => {
    expect(normaliseLockSize(null)).toEqual(LOCK_SIZE);
    expect(normaliseLockSize({})).toEqual(LOCK_SIZE);
    expect(normaliseLockSize({ width: 'wide', height: null })).toEqual(LOCK_SIZE);
  });

  it('matches on both sides, not just the width', () => {
    expect(normaliseLockSize({ width: 640, height: 999 })).toEqual(LOCK_SIZE);
  });
});
