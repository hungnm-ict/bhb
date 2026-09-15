import { describe, it, expect } from 'vitest';
import {
  captureFingerprint,
  matchFingerprint,
  matchPoint,
  readRegion,
} from '../src/core/region.js';

/**
 * A fake framebuffer: a function of buffer-space x/y to a colour, read through
 * a gl-shaped `readPixels`. Scaling the framebuffer scales the pattern with
 * it, which is what makes the resize test meaningful.
 */
function createGl(width, height, colorAt) {
  return {
    RGBA: 0,
    UNSIGNED_BYTE: 0,
    width,
    height,
    readPixels(x, y, w, h, _format, _type, out) {
      for (let row = 0; row < h; row += 1) {
        for (let col = 0; col < w; col += 1) {
          const { r, g, b } = colorAt((x + col) / width, (y + row) / height);
          const offset = (row * w + col) * 4;
          out[offset] = r;
          out[offset + 1] = g;
          out[offset + 2] = b;
          out[offset + 3] = 255;
        }
      }
    },
  };
}

/** Two halves, so samples inside one region disagree with each other. */
function twoTone(u) {
  return u < 0.5 ? { r: 200, g: 40, b: 40 } : { r: 40, g: 60, b: 220 };
}

const RECT = { x: 100, y: 200, w: 24, h: 24, bw: 800, bh: 600 };

describe('fingerprint', () => {
  it('matches itself perfectly', () => {
    const gl = createGl(800, 600, (u) => twoTone(u));
    const fp = captureFingerprint(gl, RECT);

    expect(fp.samples).toHaveLength(16);
    const result = matchFingerprint(gl, fp, { width: 800, height: 600 }, 'scale', 0);
    expect(result).toEqual({ matched: true, ratio: 1 });
  });

  it('still matches after the framebuffer is resized', () => {
    const captureGl = createGl(800, 600, (u) => twoTone(u));
    const fp = captureFingerprint(captureGl, RECT);

    const biggerGl = createGl(1600, 1200, (u) => twoTone(u));
    const result = matchFingerprint(biggerGl, fp, { width: 1600, height: 1200 }, 'scale', 0);
    expect(result.matched).toBe(true);
    expect(result.ratio).toBe(1);
  });

  it('drops the ratio by one sample per dirtied sample', () => {
    const gl = createGl(800, 600, (u) => twoTone(u));
    const fp = captureFingerprint(gl, RECT);

    fp.samples[0].hex = '#000000';
    fp.samples[1].hex = '#000000';

    const result = matchFingerprint(gl, fp, { width: 800, height: 600 }, 'scale', 0);
    expect(result.ratio).toBeCloseTo(14 / 16);
    expect(result.matched).toBe(true); // 0.875 still clears the 0.75 default

    fp.samples[2].hex = '#000000';
    fp.samples[3].hex = '#000000';
    fp.samples[4].hex = '#000000';
    expect(matchFingerprint(gl, fp, { width: 800, height: 600 }, 'scale', 0).matched).toBe(false);
  });

  it('reads the whole region in a single readPixels call', () => {
    const gl = createGl(800, 600, () => ({ r: 1, g: 2, b: 3 }));
    let calls = 0;
    const counted = { ...gl, readPixels: (...args) => { calls += 1; return gl.readPixels(...args); } };

    captureFingerprint(counted, RECT);
    expect(calls).toBe(1);
  });

  it('returns null when the context refuses the read', () => {
    const gl = { RGBA: 0, UNSIGNED_BYTE: 0, readPixels() { throw new Error('context lost'); } };
    expect(readRegion(gl, 0, 0, 4, 4)).toBeNull();
    expect(captureFingerprint(gl, RECT)).toBeNull();
  });
});

describe('matchPoint', () => {
  const buffer = { width: 800, height: 600 };

  it('reads a point without samples as a single pixel, as before', () => {
    const gl = createGl(800, 600, () => ({ r: 10, g: 20, b: 30 }));
    const point = { x: 100, y: 100, bw: 800, bh: 600 };

    expect(matchPoint(gl, point, '#0a141e', buffer, 'scale', 4).matched).toBe(true);
    expect(matchPoint(gl, point, '#ffffff', buffer, 'scale', 4).matched).toBe(false);
  });

  it('aims a region point at the middle of its region', () => {
    const gl = createGl(800, 600, (u) => twoTone(u));
    const fp = captureFingerprint(gl, RECT);

    const hit = matchPoint(gl, fp, null, buffer, 'scale', 0);
    expect(hit.matched).toBe(true);
    expect(hit.point).toEqual({ x: 112, y: 212 });
  });
});
