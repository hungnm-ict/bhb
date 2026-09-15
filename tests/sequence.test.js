/**
 * The step cursor. Order has to be real when the game cooperates, and has to
 * be abandoned when it does not.
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

/** Which buffer columns are currently showing the colour steps look for. */
let lit = new Set();

/**
 * The tests drive `tick` by hand, so the engine's own polling must not run —
 * a live interval also keeps the test worker alive after the file is done.
 */
vi.mock('../src/core/timers.js', () => ({
  realNow: () => 1_000_000,
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
const { RESYNC_AFTER_TICKS } = await import('../src/core/constants.js');

/** A step that clicks column `x` when column `x` is lit. */
function stepAt(x, label) {
  return createStep({
    label,
    hex: '#ff0000',
    tolerance: 0,
    points: [{ x, y: 300, bw: 800, bh: 600 }],
  });
}

function build(steps) {
  return createEngine({
    getScriptSteps: () => steps,
    getRerunSteps: () => [],
    getWorldBossSteps: () => [],
    getScaleMode: () => 'scale',
  });
}

beforeEach(() => {
  clicks.length = 0;
  lit = new Set();
});

describe('step cursor', () => {
  it('clicks two steps on one screen in order, which first-match could not', () => {
    // Both buttons are on screen at once. Without a cursor the runner would
    // click the first one every tick and never reach the second.
    lit = new Set([100, 200]);
    const engine = build([stepAt(100, 'pick team'), stepAt(200, 'start')]);

    engine.start(TaskId.SCRIPT);
    engine.tick();

    expect(clicks).toEqual([100, 200]);
    engine.stop();
  });

  it('wraps back to the first step after the last', () => {
    lit = new Set([100, 200]);
    const engine = build([stepAt(100, 'one'), stepAt(200, 'two')]);

    // start() ticks once itself, so this is three ticks: one, two, one again.
    engine.start(TaskId.SCRIPT);
    engine.tick();
    engine.tick();

    expect(clicks).toEqual([100, 200, 100]);
    engine.stop();
  });

  it('waits for the step it expects instead of jumping ahead', () => {
    // Only the second step's button is lit: a first-match runner would click it
    // immediately, out of turn.
    lit = new Set([200]);
    const engine = build([stepAt(100, 'one'), stepAt(200, 'two')]);

    engine.start(TaskId.SCRIPT);
    for (let i = 0; i < RESYNC_AFTER_TICKS - 2; i += 1) {
      engine.tick();
    }
    expect(clicks, 'still waiting its turn').toEqual([]);
    engine.stop();
  });

  it('gives up its place when the expected step never comes', () => {
    lit = new Set([200]);
    const engine = build([stepAt(100, 'one'), stepAt(200, 'two')]);
    const entries = [];
    engine.on('action', (entry) => entries.push(entry));

    engine.start(TaskId.SCRIPT);
    for (let i = 0; i < RESYNC_AFTER_TICKS + 1; i += 1) {
      engine.tick();
    }

    expect(clicks, 'resynced onto the step that is actually on screen').toContain(200);
    expect(entries.some((entry) => entry.kind === 'resync')).toBe(true);
    engine.stop();
  });

  it('picks its place back up after a resync rather than starting over', () => {
    lit = new Set([200, 300]);
    const engine = build([stepAt(100, 'one'), stepAt(200, 'two'), stepAt(300, 'three')]);

    engine.start(TaskId.SCRIPT);
    for (let i = 0; i < RESYNC_AFTER_TICKS + 1; i += 1) {
      engine.tick();
    }

    // Resync lands on step two, so the next click is step three, not step one.
    expect(clicks[clicks.indexOf(200) + 1]).toBe(300);
    engine.stop();
  });

  it('leaves the built-in tasks on first-match, since they are not a sequence', () => {
    lit = new Set([100, 200]);
    const engine = createEngine({
      getScriptSteps: () => [],
      getRerunSteps: () => [],
      getWorldBossSteps: () => [stepAt(100, 'one'), stepAt(200, 'two')],
      getScaleMode: () => 'scale',
    });

    engine.start(TaskId.WORLD_BOSS);
    engine.tick();

    expect(clicks, 'one click per tick, always the first match').toEqual([100, 100]);
    engine.stop();
  });
});
