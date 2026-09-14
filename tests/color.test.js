import { describe, it, expect } from 'vitest';
import { rgbToHex, hexToRgb, colorMatches } from '../src/core/color.js';

describe('hex conversion', () => {
  it('pads single-digit channels', () => {
    expect(rgbToHex({ r: 10, g: 98, b: 208 })).toBe('#0a62d0');
  });

  it('round-trips a colour', () => {
    expect(hexToRgb(rgbToHex({ r: 166, g: 211, b: 57 }))).toEqual({
      r: 166,
      g: 211,
      b: 57,
    });
  });

  it('accepts a hex string with or without the hash', () => {
    expect(hexToRgb('a6d339')).toEqual(hexToRgb('#a6d339'));
  });
});

describe('colorMatches', () => {
  const target = { r: 100, g: 100, b: 100 };

  it('accepts a colour inside the tolerance on every channel', () => {
    expect(colorMatches({ r: 110, g: 90, b: 100 }, target, 15)).toBe(true);
  });

  it('rejects when a single channel exceeds the tolerance', () => {
    expect(colorMatches({ r: 100, g: 100, b: 120 }, target, 15)).toBe(false);
  });

  it('is exact at zero tolerance', () => {
    expect(colorMatches({ r: 100, g: 100, b: 100 }, target, 0)).toBe(true);
    expect(colorMatches({ r: 101, g: 100, b: 100 }, target, 0)).toBe(false);
  });
});
