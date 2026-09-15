/**
 * Capture must read the resting colour without the user moving their mouse,
 * and must keep the hovered shade too.
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

/** Lit while the synthetic pointer is on the button, dark once it leaves. */
let pointerOnButton = true;
const gl = {};

vi.mock('../src/core/canvas.js', () => ({
  getRenderTarget: () => ({ canvas, gl }),
  getCanvas: () => canvas,
}));

vi.mock('../src/core/pixel.js', () => ({
  readPixel: () => (pointerOnButton ? { r: 203, g: 240, b: 103 } : { r: 166, g: 211, b: 57 }),
}));

vi.mock('../src/core/input.js', () => ({
  dispatchMoveTo: vi.fn((_canvas, x) => {
    pointerOnButton = x > 100; // the corner park is at a low x
  }),
}));

describe('step editor capture', () => {
  let steps;
  let editor;
  let report;

  beforeEach(async () => {
    vi.resetModules();
    pointerOnButton = true;
    steps = [];
    report = vi.fn();
    const { createStepEditor } = await import('../src/bot/step-editor.js');
    editor = createStepEditor({ getSteps: () => steps, persist: () => {}, report });

    // Put the cursor on a button at (400, 260) client space.
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 260 }));
  });

  it('stores the resting colour, not the hovered one', async () => {
    await editor.captureAtCursor();

    expect(steps).toHaveLength(1);
    expect(steps[0].hex).toBe('#a6d339');
  });

  it('keeps the hovered shade as a second point', async () => {
    await editor.captureAtCursor();

    expect(steps[0].points).toHaveLength(2);
    expect(steps[0].points[1].hex).toBe('#cbf067');
  });

  it('records the framebuffer size so the point can rescale', async () => {
    await editor.captureAtCursor();

    expect(steps[0].points[0]).toMatchObject({ bw: 800, bh: 520 });
  });

  it('puts the synthetic pointer back where the user left it', async () => {
    const { dispatchMoveTo } = await import('../src/core/input.js');
    await editor.captureAtCursor();

    const last = dispatchMoveTo.mock.calls.at(-1);
    expect(last[1]).toBe(400);
    expect(last[2]).toBe(260);
  });

  it('refuses a second capture while one is in flight', async () => {
    const first = editor.captureAtCursor();
    const second = await editor.captureAtCursor();

    await first;
    expect(second).toBe(null);
    expect(steps).toHaveLength(1);
  });
});
