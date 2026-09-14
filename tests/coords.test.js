import { describe, it, expect } from 'vitest';
import { resolvePoint, isLegacyPoint, ScaleMode } from '../src/core/coords.js';

describe('resolvePoint', () => {
  it('rescales a point when the framebuffer differs from capture', () => {
    const point = { x: 410, y: 62, bw: 800, bh: 600 };
    expect(resolvePoint(point, { width: 1600, height: 1200 })).toEqual({
      x: 820,
      y: 124,
    });
  });

  it('is an identity when the framebuffer is unchanged', () => {
    const point = { x: 410, y: 62, bw: 800, bh: 600 };
    expect(resolvePoint(point, { width: 800, height: 600 })).toEqual({
      x: 410,
      y: 62,
    });
  });

  it('handles axes that scale independently', () => {
    const point = { x: 100, y: 100, bw: 800, bh: 600 };
    expect(resolvePoint(point, { width: 400, height: 1200 })).toEqual({
      x: 50,
      y: 200,
    });
  });

  it('leaves a point untouched when told to use absolute mode', () => {
    const point = { x: 410, y: 62, bw: 800, bh: 600 };
    expect(
      resolvePoint(point, { width: 1600, height: 1200 }, ScaleMode.ABSOLUTE)
    ).toEqual({ x: 410, y: 62 });
  });

  it('cannot scale a legacy point, so passes it through unchanged', () => {
    const point = { x: 410, y: 62 };
    expect(resolvePoint(point, { width: 1600, height: 1200 })).toEqual({
      x: 410,
      y: 62,
    });
  });
});

describe('isLegacyPoint', () => {
  it('flags points captured before the buffer size was recorded', () => {
    expect(isLegacyPoint({ x: 1, y: 2 })).toBe(true);
    expect(isLegacyPoint({ x: 1, y: 2, bw: 800, bh: 600 })).toBe(false);
  });
});
