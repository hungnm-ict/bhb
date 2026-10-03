/**
 * A wait step gains a slotted place by dragging a box over one seat, and its
 * direction can be flipped to "hold until present" for a named team mate.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const canvas = {
  width: 800,
  height: 520,
  getBoundingClientRect: () => ({ left: 0, top: 0, right: 800, bottom: 520, width: 800, height: 520 }),
};

const gl = {
  RGBA: 0,
  UNSIGNED_BYTE: 0,
  readPixels: (_x, _y, w, h, _f, _t, out) => {
    for (let i = 0; i < w * h; i += 1) {
      out[i * 4] = 40;
      out[i * 4 + 1] = 50;
      out[i * 4 + 2] = 60;
      out[i * 4 + 3] = 255;
    }
  },
};

vi.mock('../src/core/canvas.js', () => ({
  getRenderTarget: () => ({ canvas, gl }),
  getCanvas: () => canvas,
}));

vi.mock('../src/core/input.js', () => ({
  dispatchMoveTo: () => {},
  dispatchClickAt: () => {},
}));

const { createStepEditor } = await import('../src/bot/step-editor.js');
const { createStep, StepKind, WaitFor } = await import('../src/bot/step.js');

describe('step editor: slotted places', () => {
  let steps;
  let editor;

  beforeEach(() => {
    steps = [createStep({ label: 'Friend here', kind: StepKind.WAIT })];
    editor = createStepEditor({ getSteps: () => steps, persist: () => {}, report: () => {} });
  });

  it('adds a region place tagged perSlot, leaving other places untouched', () => {
    editor.captureSlotRegion({ left: 50, top: 60, width: 40, height: 30 }, steps[0].id);
    expect(steps[0].points).toHaveLength(1);
    expect(steps[0].points[0].perSlot).toBe(true);
    expect(steps[0].points[0].samples.length).toBeGreaterThan(0);
  });

  it('appends rather than replaces, unlike a count region', () => {
    editor.captureSlotRegion({ left: 50, top: 60, width: 40, height: 30 }, steps[0].id);
    editor.captureSlotRegion({ left: 200, top: 60, width: 40, height: 30 }, steps[0].id);
    expect(steps[0].points).toHaveLength(2);
  });

  it('defaults a wait step to GONE, the original meaning', () => {
    expect(steps[0].waitFor).toBe(WaitFor.GONE);
  });

  it('flips a wait step to PRESENT and back', () => {
    editor.setWaitFor(steps[0].id, WaitFor.PRESENT);
    expect(steps[0].waitFor).toBe(WaitFor.PRESENT);
    editor.setWaitFor(steps[0].id, WaitFor.GONE);
    expect(steps[0].waitFor).toBe(WaitFor.GONE);
  });

  it('rejects an unknown direction rather than storing garbage', () => {
    editor.setWaitFor(steps[0].id, 'sideways');
    expect(steps[0].waitFor).toBe(WaitFor.GONE);
  });
});
