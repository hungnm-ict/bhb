import { describe, it, expect } from 'vitest';
import { captureFingerprint } from '../src/core/region.js';
import { createScreen, detectScreen, scoreScreen, stepAllowedOn } from '../src/bot/screen.js';

function createGl(width, height, colorAt) {
  return {
    RGBA: 0,
    UNSIGNED_BYTE: 0,
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

const BUFFER = { width: 800, height: 600 };
const RECT = { x: 10, y: 10, w: 16, h: 16, bw: 800, bh: 600 };

function screenSeeing(gl, overrides) {
  return createScreen({ anchors: [captureFingerprint(gl, RECT)], tolerance: 0, ...overrides });
}

describe('screen detection', () => {
  it('needs every anchor present', () => {
    const red = createGl(800, 600, () => ({ r: 255, g: 0, b: 0 }));
    const blue = createGl(800, 600, () => ({ r: 0, g: 0, b: 255 }));

    const screen = screenSeeing(red);
    screen.anchors.push(captureFingerprint(blue, { ...RECT, x: 200 }));

    // Both anchors were captured off different frames; neither frame has both.
    expect(scoreScreen(red, screen, BUFFER, 'scale').matched).toBe(false);
    expect(scoreScreen(blue, screen, BUFFER, 'scale').matched).toBe(false);
  });

  it('takes the first match, so list order is priority', () => {
    const gl = createGl(800, 600, () => ({ r: 255, g: 0, b: 0 }));
    const first = screenSeeing(gl, { name: 'first' });
    const second = screenSeeing(gl, { name: 'second' });

    expect(detectScreen(gl, [first, second], BUFFER, 'scale').name).toBe('first');
    expect(detectScreen(gl, [second, first], BUFFER, 'scale').name).toBe('second');
  });

  it('is unknown when nothing matches', () => {
    const red = createGl(800, 600, () => ({ r: 255, g: 0, b: 0 }));
    const blue = createGl(800, 600, () => ({ r: 0, g: 0, b: 255 }));

    expect(detectScreen(blue, [screenSeeing(red)], BUFFER, 'scale')).toBeNull();
    expect(detectScreen(red, [], BUFFER, 'scale')).toBeNull();
  });

  it('never matches a screen with no anchors', () => {
    const gl = createGl(800, 600, () => ({ r: 255, g: 0, b: 0 }));
    expect(detectScreen(gl, [createScreen({ name: 'empty' })], BUFFER, 'scale')).toBeNull();
  });
});

describe('step gating', () => {
  it('lets an ungated step fire anywhere', () => {
    expect(stepAllowedOn({}, null)).toBe(true);
    expect(stepAllowedOn({ screens: [] }, 's1')).toBe(true);
  });

  it('holds a gated step to its own screens', () => {
    const step = { screens: ['s1'] };
    expect(stepAllowedOn(step, 's1')).toBe(true);
    expect(stepAllowedOn(step, 's2')).toBe(false);
    expect(stepAllowedOn(step, null)).toBe(false);
  });
});
