/**
 * The lock exists so two machines read the same pixels off the same button, so
 * what matters here is that the fit never changes the pinned size — only how
 * much of the screen it is drawn across.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { fitScale, lockCanvasSize, unlockCanvasSize, LOCK_SIZE } from '../src/core/canvas-lock.js';

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

describe('holding the framebuffer', () => {
  function gameCanvas() {
    document.body.replaceChildren();
    const box = document.createElement('div');
    const canvas = document.createElement('canvas');
    canvas.width = 917;
    canvas.height = 484;
    box.append(canvas);
    document.body.append(box);
    return canvas;
  }

  it('pins the drawing buffer to the locked size', () => {
    const canvas = gameCanvas();
    lockCanvasSize();

    expect(canvas.width).toBe(LOCK_SIZE.width);
    expect(canvas.height).toBe(LOCK_SIZE.height);
    unlockCanvasSize();
  });

  it('refuses the size the game asks for while locked', () => {
    const canvas = gameCanvas();
    lockCanvasSize();

    // What Unity does on every layout change — and what, before this, left the
    // buffer at the size of the shrunken box instead of the pinned one.
    canvas.width = 330;
    canvas.height = 206;

    expect(canvas.width).toBe(LOCK_SIZE.width);
    expect(canvas.height).toBe(LOCK_SIZE.height);
    unlockCanvasSize();
  });

  it('hands the size back when unlocked', () => {
    const canvas = gameCanvas();
    lockCanvasSize();
    unlockCanvasSize();

    canvas.width = 917;
    expect(canvas.width).toBe(917);
  });

  it('restores the styles it found, leaving no trace', () => {
    const canvas = gameCanvas();
    const before = canvas.style.cssText;

    lockCanvasSize();
    unlockCanvasSize();

    expect(canvas.style.cssText).toBe(before);
  });
});
