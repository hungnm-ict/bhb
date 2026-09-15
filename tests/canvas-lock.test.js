/**
 * The lock exists so two machines read the same pixels off the same button.
 *
 * Its history is the useful part: scaling the box to fit a small window, and
 * holding `canvas.width` against the game, both looked like improvements and
 * both broke it — the first silently, the second in garbled pixels. These tests
 * pin the plain behaviour that works.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach } from 'vitest';
import { lockCanvasSize, unlockCanvasSize, isCanvasLocked, LOCK_SIZE } from '../src/core/canvas-lock.js';

function gameCanvas() {
  document.body.replaceChildren();
  const box = document.createElement('div');
  const canvas = document.createElement('canvas');
  canvas.width = 917;
  canvas.height = 484;
  box.append(canvas);
  document.body.append(box);
  return { canvas, box };
}

afterEach(() => {
  unlockCanvasSize();
});

describe('locking the canvas size', () => {
  it('pins one size, so every step set is captured against the same pixels', () => {
    expect(LOCK_SIZE).toEqual({ width: 640, height: 400 });
  });

  it('sets the box the game measures itself against', () => {
    const { canvas, box } = gameCanvas();
    lockCanvasSize();

    expect(canvas.style.width).toBe('640px');
    expect(canvas.style.height).toBe('400px');
    expect(box.style.width).toBe('640px');
  });

  it('leaves the framebuffer to the game, which is what keeps it rendering', () => {
    const { canvas } = gameCanvas();
    lockCanvasSize();

    // Holding this against the game garbled the picture: it lays out at the
    // size it believes it has and draws into a buffer of another.
    canvas.width = 640;
    expect(canvas.width).toBe(640);
  });

  it('never transforms the box — a transform is counted by the game\'s own measurement', () => {
    const { canvas, box } = gameCanvas();
    lockCanvasSize();

    expect(canvas.style.transform).toBe('');
    expect(box.style.transform).toBe('');
  });

  it('restores the styles it found, leaving no trace', () => {
    const { canvas, box } = gameCanvas();
    const before = { canvas: canvas.style.cssText, box: box.style.cssText };

    lockCanvasSize();
    unlockCanvasSize();

    expect(canvas.style.cssText).toBe(before.canvas);
    expect(box.style.cssText).toBe(before.box);
    expect(isCanvasLocked()).toBe(false);
  });
});
