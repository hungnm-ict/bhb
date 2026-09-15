/**
 * The lock exists so two machines read the same pixels off the same button, so
 * what matters here is that the fit never changes the pinned size — only how
 * much of the screen it is drawn across.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { fitScale, LOCK_SIZE } from '../src/core/canvas-lock.js';

const PINNED = LOCK_SIZE;

describe('fitting a pinned size into a window', () => {
  it('leaves it alone when the window is big enough', () => {
    expect(fitScale(PINNED, { width: 1600, height: 900 })).toBe(1);
  });

  it('pins one size, so every step set is captured against the same pixels', () => {
    expect(LOCK_SIZE).toEqual({ width: 640, height: 400 });
  });

  it('never magnifies, however much room there is', () => {
    expect(fitScale(PINNED, { width: 5000, height: 5000 })).toBe(1);
  });

  it('shrinks by the tighter of the two axes, so nothing is cropped', () => {
    // Wide but short: height decides.
    expect(fitScale(PINNED, { width: 1600, height: 200 })).toBe(0.5);
    // Narrow but tall: width decides.
    expect(fitScale(PINNED, { width: 320, height: 900 })).toBe(0.5);
  });

  it('keeps the aspect ratio, which is the whole point of one scale factor', () => {
    const scale = fitScale(PINNED, { width: 600, height: 300 });
    const shown = { width: PINNED.width * scale, height: PINNED.height * scale };
    expect(shown.width / shown.height).toBeCloseTo(PINNED.width / PINNED.height, 5);
  });

  it('stops shrinking before the game becomes a postage stamp', () => {
    expect(fitScale(PINNED, { width: 40, height: 20 })).toBe(0.2);
  });


});
