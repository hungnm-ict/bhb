/**
 * A count step's two numbers, and the rectangle it watches.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';

/** Buffer 800x500 shown one-to-one at the page's origin. */
const CANVAS = {
  width: 800,
  height: 500,
  getBoundingClientRect: () => ({
    left: 0,
    top: 0,
    right: 800,
    bottom: 500,
    width: 800,
    height: 500,
  }),
};

vi.mock('../src/core/canvas.js', () => ({
  getRenderTarget: () => ({
    canvas: CANVAS,
    gl: {
      RGBA: 0,
      UNSIGNED_BYTE: 0,
      readPixels(_x, _y, _w, _h, _format, _type, out) {
        out.fill(30);
      },
    },
  }),
  getCanvas: () => CANVAS,
  installCanvasPatch: () => {},
}));

const { createStepEditor } = await import('../src/bot/step-editor.js');
const { createStep, StepKind } = await import('../src/bot/step.js');

function editorWith(step) {
  const steps = [step];
  return createStepEditor({
    getSteps: () => steps,
    setSteps: (next) => {
      steps.splice(0, steps.length, ...next);
    },
    persist: () => {},
    report: () => {},
    getScaleMode: () => 'scale',
    getActivities: () => [],
  });
}

describe('the count step editor', () => {
  it('clamps the count and the cap', () => {
    const step = createStep({ kind: StepKind.COUNT });
    const editor = editorWith(step);

    editor.setCount(step.id, { countTo: '7', countCap: '90' });
    expect(step.countTo).toBe(7);
    expect(step.countCap).toBe(90);

    // The cap's ceiling is set by the auto-stop, not by a round number.
    editor.setCount(step.id, { countTo: -3, countCap: 99999 });
    expect(step.countTo).toBe(0);
    expect(step.countCap).toBe(170);
  });

  it('leaves the other number alone when only one is given', () => {
    const step = createStep({ kind: StepKind.COUNT, countTo: 7, countCap: 90 });
    const editor = editorWith(step);

    editor.setCount(step.id, { countTo: 3 });
    expect(step.countCap).toBe(90);
  });

  it('stores a dragged rectangle as the only region', () => {
    const step = createStep({ kind: StepKind.COUNT, points: [{ x: 1, y: 2 }] });
    const editor = editorWith(step);

    editor.captureRegion({ left: 100, top: 50, width: 60, height: 20 }, step.id);

    expect(step.points).toHaveLength(1);
    expect(Array.isArray(step.points[0].samples)).toBe(true);
    expect(step.points[0].w).toBeGreaterThan(0);
    expect(step.points[0].h).toBeGreaterThan(0);
  });

  it('keeps the count kind through the behaviour dropdown', () => {
    const step = createStep();
    const editor = editorWith(step);

    editor.setBehaviour(step.id, { kind: StepKind.COUNT, optional: false, endsRun: false });
    expect(step.kind).toBe(StepKind.COUNT);
  });
});

describe('the cap and the box size', () => {
  it('keeps the cap under the auto-stop, so the cap fires first', async () => {
    const { AUTO_STOP_TIMEOUT } = await import('../src/core/constants.js');
    const step = createStep({ kind: StepKind.COUNT });
    const editor = editorWith(step);

    expect(step.countCap * 1000).toBeLessThan(AUTO_STOP_TIMEOUT);

    editor.setCount(step.id, { countCap: 9999 });
    expect(step.countCap * 1000).toBeLessThan(AUTO_STOP_TIMEOUT);
  });

  it('warns when the dragged box is far bigger than what changes in it', () => {
    const said = [];
    const step = createStep({ kind: StepKind.COUNT });
    const steps = [step];
    const editor = createStepEditor({
      getSteps: () => steps,
      persist: () => {},
      report: (message) => said.push(message),
      getScaleMode: () => 'scale',
    });

    editor.captureRegion({ left: 100, top: 50, width: 400, height: 200 }, step.id);
    expect(said.join(' ')).toMatch(/nh·|small|tight|to|big/i);
    expect(step.points).toHaveLength(1);
  });

  it('says nothing about a tight box', () => {
    const said = [];
    const step = createStep({ kind: StepKind.COUNT });
    const steps = [step];
    const editor = createStepEditor({
      getSteps: () => steps,
      persist: () => {},
      report: (message) => said.push(message),
      getScaleMode: () => 'scale',
    });

    editor.captureRegion({ left: 100, top: 50, width: 60, height: 20 }, step.id);
    expect(said).toHaveLength(0);
  });
});
