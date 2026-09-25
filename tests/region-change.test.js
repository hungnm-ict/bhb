/**
 * Counting waves asks a question the fingerprint cannot answer: did these
 * exact pixels change? A sixteen-sample grid can cross one redrawn digit
 * once or not at all, so this reads the whole rectangle.
 */
import { describe, it, expect } from 'vitest';
import { regionsDiffer, DEFAULT_CHANGE_RATIO } from '../src/core/region.js';

/** A w×h region filled with one colour, with `litPixels` pixels set white. */
function region(w, h, litPixels = 0) {
  const data = new Uint8Array(w * h * 4);
  for (let index = 0; index < w * h; index += 1) {
    const lit = index < litPixels;
    data[index * 4] = lit ? 255 : 20;
    data[index * 4 + 1] = lit ? 255 : 20;
    data[index * 4 + 2] = lit ? 255 : 20;
    data[index * 4 + 3] = 255;
  }
  return { x: 0, y: 0, w, h, data };
}

describe('regionsDiffer', () => {
  it('reads two identical readings as the same', () => {
    expect(regionsDiffer(region(20, 20), region(20, 20), 10)).toBe(false);
  });

  it('sees a handful of pixels change', () => {
    // 20 of 400 pixels is 5%, over the 2% floor — one redrawn digit's worth.
    expect(regionsDiffer(region(20, 20), region(20, 20, 20), 10)).toBe(true);
  });

  it('ignores a change smaller than the ratio', () => {
    expect(regionsDiffer(region(20, 20), region(20, 20, 4), 10)).toBe(false);
  });

  it('ignores a shade inside the tolerance', () => {
    const left = region(4, 4);
    const right = region(4, 4);
    for (let index = 0; index < right.data.length; index += 4) {
      right.data[index] += 5;
    }
    expect(regionsDiffer(left, right, 10)).toBe(false);
    expect(regionsDiffer(left, right, 2)).toBe(true);
  });

  it('treats a missing reading as a difference', () => {
    expect(regionsDiffer(null, region(4, 4), 10)).toBe(true);
    expect(regionsDiffer(region(4, 4), null, 10)).toBe(true);
  });

  it('treats a resized reading as a difference without reading past either', () => {
    expect(regionsDiffer(region(4, 4), region(8, 8), 10)).toBe(true);
  });

  it('exposes the ratio it defaults to', () => {
    expect(DEFAULT_CHANGE_RATIO).toBe(0.02);
  });
});
