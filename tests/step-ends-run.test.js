/**
 * The button that means "that is all you get today".
 *
 * A screen could already say a resource was spent; a step could not. Capturing
 * a whole screen to express "the Play button went grey" is more work than the
 * fact deserves, so the step that clicks it can carry the meaning instead.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const clicks = [];

vi.mock('../src/core/input.js', () => ({
  clickBufferPoint: (_canvas, point) => {
    clicks.push(point.x);
    return true;
  },
  setClickObserver: () => {},
}));

let lit = new Set();
let now = 1_000_000;

vi.mock('../src/core/timers.js', () => ({
  realNow: () => now,
  realPerformanceNow: () => 0,
  realSetTimeout: () => 0,
  realClearTimeout: () => {},
  realSetInterval: () => 0,
  realClearInterval: () => {},
  realRequestAnimationFrame: () => 0,
}));

vi.mock('../src/core/canvas.js', () => ({
  getRenderTarget: () => ({
    canvas: { width: 800, height: 600 },
    gl: {
      RGBA: 0,
      UNSIGNED_BYTE: 0,
      readPixels(x, y, w, h, _format, _type, out) {
        for (let row = 0; row < h; row += 1) {
          for (let col = 0; col < w; col += 1) {
            const on = lit.has(x + col);
            const offset = (row * w + col) * 4;
            out[offset] = on ? 255 : 0;
            out[offset + 1] = 0;
            out[offset + 2] = on ? 0 : 255;
            out[offset + 3] = 255;
          }
        }
      },
    },
  }),
  getCanvas: () => ({ width: 800, height: 600 }),
  installCanvasPatch: () => {},
}));

const { createEngine, TaskId } = await import('../src/core/engine.js');
const { createStep } = await import('../src/bot/step.js');

function stepAt(x, label, overrides = {}) {
  return createStep({
    label,
    hex: '#ff0000',
    tolerance: 0,
    points: [{ x, y: 300, bw: 800, bh: 600 }],
    ...overrides,
  });
}

beforeEach(() => {
  clicks.length = 0;
  lit = new Set();
  now = 1_000_000;
});

describe('a step that ends the run', () => {
  it('clicks first, then stops', () => {
    lit = new Set([100]);
    const engine = createEngine({
      getScriptSteps: () => [stepAt(100, 'no more keys', { endsRun: true })],
      getScaleMode: () => 'scale',
    });

    engine.start(TaskId.SCRIPT);

    expect(clicks, 'the button is still worth pressing').toEqual([100]);
    expect(engine.getState().activeTask, 'and then the run is over').toBeNull();
  });

  it('says why it stopped', () => {
    lit = new Set([100]);
    const entries = [];
    const engine = createEngine({
      getScriptSteps: () => [stepAt(100, 'no more keys', { endsRun: true })],
      getScaleMode: () => 'scale',
    });
    engine.on('action', (entry) => entries.push(entry));

    engine.start(TaskId.SCRIPT);

    const resource = entries.find((entry) => entry.kind === 'resource');
    expect(resource, 'the log has to name the step that called it').toBeTruthy();
    expect(resource.label).toBe('no more keys');
  });

  it('leaves an ordinary step alone', () => {
    lit = new Set([100]);
    const engine = createEngine({
      getScriptSteps: () => [stepAt(100, 'just a button')],
      getScaleMode: () => 'scale',
    });

    engine.start(TaskId.SCRIPT);

    expect(engine.getState().activeTask).toBe(TaskId.SCRIPT);
    engine.stop();
  });

  it('steps aside when the button is not there', () => {
    // The whole point: the out-of-resources button is only on screen when the
    // resource is out. A step that waited for it would stall every lap.
    lit = new Set([200]);
    const engine = createEngine({
      getScriptSteps: () => [
        stepAt(100, 'no more keys', { endsRun: true }),
        stepAt(200, 'play again'),
      ],
      getScaleMode: () => 'scale',
    });

    engine.start(TaskId.SCRIPT);

    expect(clicks, 'the run carries on past it').toEqual([200]);
    expect(engine.getState().activeTask).toBe(TaskId.SCRIPT);
    engine.stop();
  });

  it('still ends the run the lap the button does appear', () => {
    lit = new Set([100, 200]);
    const engine = createEngine({
      getScriptSteps: () => [
        stepAt(100, 'no more keys', { endsRun: true }),
        stepAt(200, 'play again'),
      ],
      getScaleMode: () => 'scale',
    });

    engine.start(TaskId.SCRIPT);

    expect(clicks).toEqual([100]);
    expect(engine.getState().activeTask).toBeNull();
  });

  it('does not fire on a step that matched nothing', () => {
    lit = new Set();
    const engine = createEngine({
      getScriptSteps: () => [stepAt(100, 'no more keys', { endsRun: true })],
      getScaleMode: () => 'scale',
    });

    engine.start(TaskId.SCRIPT);

    expect(clicks).toEqual([]);
    expect(engine.getState().activeTask, 'nothing was clicked, so nothing is spent').toBe(
      TaskId.SCRIPT
    );
    engine.stop();
  });

  it('moves the queue on instead of stopping it, under Run-All', () => {
    // Out of Dungeon keys is not out of everything: the queue is the whole
    // point, and a screen saying the same thing already behaves this way.
    lit = new Set([100]);
    const engine = createEngine({
      getScriptSteps: () => [
        stepAt(100, 'no more keys', { endsRun: true, activity: 'dungeon' }),
        stepAt(200, 'fight', { activity: 'raid' }),
      ],
      getActivities: () => [
        { id: 'dungeon', name: 'Dungeon', enabled: true },
        { id: 'raid', name: 'Raid', enabled: true },
      ],
      getScaleMode: () => 'scale',
    });

    engine.start(TaskId.RUN_ALL);

    expect(engine.getState().activeTask, 'still running').toBe(TaskId.RUN_ALL);
    expect(engine.getState().activity, 'but on the next activity').toBe('raid');
    engine.stop();
  });
});
