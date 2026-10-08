/**
 * A drag ends with the real cursor still sitting wherever it was released —
 * often right over whatever was just framed. If that spot is a button, the
 * game keeps it lit, and the anchor would read the hovered shade instead of
 * the resting one: the same risk step capture already solves.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const canvas = {
  width: 800,
  height: 520,
  getBoundingClientRect: () => ({ left: 0, top: 0, right: 800, bottom: 520, width: 800, height: 520 }),
  dispatchEvent: () => true,
};

/** Lit while the synthetic pointer sits on the button, dark once it leaves. */
let pointerOnButton = true;
/** How many reads a still-fading hover-exit has left before it settles. */
let fadeFramesLeft = 0;
const FADE_TOTAL_FRAMES = 5;

const gl = {
  RGBA: 0,
  UNSIGNED_BYTE: 0,
  readPixels(_x, _y, w, h, _format, _type, out) {
    let r;
    let g;
    let b;
    if (pointerOnButton) {
      [r, g, b] = [203, 240, 103];
    } else if (fadeFramesLeft > 0) {
      // A genuine tween, not a two-step jump: each read still differs from
      // the last, so a settle check cannot mistake mid-fade for arrived.
      const t = fadeFramesLeft / FADE_TOTAL_FRAMES;
      r = Math.round(10 + (203 - 10) * t);
      g = Math.round(20 + (240 - 20) * t);
      b = Math.round(30 + (103 - 30) * t);
      fadeFramesLeft -= 1;
    } else {
      [r, g, b] = [10, 20, 30];
    }
    for (let i = 0; i < w * h; i += 1) {
      out[i * 4] = r;
      out[i * 4 + 1] = g;
      out[i * 4 + 2] = b;
      out[i * 4 + 3] = 255;
    }
  },
};

vi.mock('../src/core/canvas.js', () => ({
  getRenderTarget: () => ({ canvas, gl }),
  getCanvas: () => canvas,
}));

vi.mock('../src/core/input.js', () => ({
  dispatchMoveTo: vi.fn((_canvas, x) => {
    pointerOnButton = x > 100; // the corner park is at a low x
  }),
  resetHover: vi.fn(() => {
    pointerOnButton = false;
  }),
}));

describe('screen editor capture: hover safety', () => {
  let screens;
  let editor;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    pointerOnButton = true;
    fadeFramesLeft = 0;
    screens = [];
    const { createScreenEditor } = await import('../src/bot/screen-editor.js');
    editor = createScreenEditor({ getScreens: () => screens, persist: () => {}, report: () => {} });
  });

  it('reads the resting colour when the cursor is parked over the drag', async () => {
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 260 }));

    const screen = await editor.captureAnchor({ left: 390, top: 250, width: 20, height: 20 });

    expect(screen.anchors[0].samples[0].hex).toBe('#0a141e');
  });

  it('waits out a hover-exit fade longer than a couple of frames', async () => {
    fadeFramesLeft = FADE_TOTAL_FRAMES;
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 260 }));

    const screen = await editor.captureAnchor({ left: 390, top: 250, width: 20, height: 20 });

    expect(screen.anchors[0].samples[0].hex).toBe('#0a141e');
  });

  it('puts the synthetic pointer back where the real one was', async () => {
    const { dispatchMoveTo } = await import('../src/core/input.js');
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 260 }));

    await editor.captureAnchor({ left: 390, top: 250, width: 20, height: 20 });

    const last = dispatchMoveTo.mock.calls.at(-1);
    expect(last[1]).toBe(400);
    expect(last[2]).toBe(260);
  });

  it('skips the dance when the cursor was never on the canvas at all', async () => {
    const { dispatchMoveTo, resetHover } = await import('../src/core/input.js');
    // No mousemove dispatched: getCursor() returns null.

    await editor.captureAnchor({ left: 390, top: 250, width: 20, height: 20 });

    expect(resetHover).not.toHaveBeenCalled();
    expect(dispatchMoveTo).not.toHaveBeenCalled();
  });

  it('skips the dance when the cursor is outside the canvas', async () => {
    const { resetHover } = await import('../src/core/input.js');
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 5000, clientY: 5000 }));

    await editor.captureAnchor({ left: 390, top: 250, width: 20, height: 20 });

    expect(resetHover).not.toHaveBeenCalled();
  });
});
