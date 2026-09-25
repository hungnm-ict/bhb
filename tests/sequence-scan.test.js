/**
 * The scanning cursor.
 *
 * Going forward is proved by what is on screen: a button of the next screen
 * being there is how the runner knows the game moved on, so it moves on too,
 * at once. Going backward is proved by nothing but time, so it is made to
 * wait, and to hold still while it waits.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const clicks = [];
const keys = [];

vi.mock('../src/core/input.js', () => ({
  clickBufferPoint: (_canvas, point) => {
    clicks.push(point.x);
    return true;
  },
  dispatchKey: (_canvas, key) => {
    keys.push(key);
  },
  setClickObserver: () => {},
}));

/** Which buffer columns are showing the colour the steps look for. */
let lit = new Set();

let now = 1_000_000;

function advance(ms) {
  now += ms;
}

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
const { createStep, StepKind } = await import('../src/bot/step.js');
const {
  BACKWARD_QUIET_MS,
  BACKWARD_STABLE_MS,
  PANIC_AFTER_MS,
  PANIC_GAP_MS,
  PANIC_MAX_TRIES,
} = await import('../src/core/constants.js');

function stepAt(x, label, overrides = {}) {
  return createStep({
    label,
    hex: '#ff0000',
    tolerance: 0,
    points: [{ x, y: 300, bw: 800, bh: 600 }],
    ...overrides,
  });
}

function build(steps) {
  return createEngine({
    getScriptSteps: () => steps,
    getScaleMode: () => 'scale',
  });
}

/** Past both backward gates, with the candidate held still throughout. */
function waitOutBackward(engine) {
  advance(BACKWARD_QUIET_MS + 1);
  engine.tick();
  advance(BACKWARD_STABLE_MS + 1);
  engine.tick();
}

beforeEach(() => {
  clicks.length = 0;
  keys.length = 0;
  lit = new Set();
  now = 1_000_000;
});

describe('going forward', () => {
  it('takes a later step at once when the expected one is not there', () => {
    // The game jumped a screen: step two's button never appeared, step three's
    // is on screen now. Waiting for two would be waiting for nothing.
    lit = new Set([300]);
    const engine = build([stepAt(100, 'one'), stepAt(200, 'two'), stepAt(300, 'three')]);

    engine.start(TaskId.SCRIPT);
    expect(clicks).toEqual([300]);
    engine.stop();
  });

  it('still takes the earliest match, so order survives one screen', () => {
    lit = new Set([100, 200, 300]);
    const engine = build([stepAt(100, 'one'), stepAt(200, 'two'), stepAt(300, 'three')]);

    engine.start(TaskId.SCRIPT);
    engine.tick();
    engine.tick();
    expect(clicks).toEqual([100, 200, 300]);
    engine.stop();
  });

  it('never reaches past a wait step that is still holding', () => {
    // The wait's colour is there, so the sequence is pinned; step three's
    // button being on screen must not tempt it.
    lit = new Set([200, 300]);
    const engine = build([
      stepAt(100, 'one', { optional: true }),
      stepAt(200, 'gate', { kind: StepKind.WAIT }),
      stepAt(300, 'three'),
    ]);

    engine.start(TaskId.SCRIPT);
    for (let tick = 0; tick < 5; tick += 1) {
      advance(1000);
      engine.tick();
    }
    expect(clicks).toEqual([]);
    engine.stop();
  });
});

describe('going backward', () => {
  it('will not go back on a step that matched for only a moment', () => {
    lit = new Set([100]);
    const engine = build([stepAt(100, 'one'), stepAt(200, 'two')]);

    engine.start(TaskId.SCRIPT);
    expect(clicks).toEqual([100]);
    clicks.length = 0;

    // Step one is still lit — a screen mid-transition looks exactly like this.
    advance(BACKWARD_QUIET_MS + 1);
    engine.tick();
    expect(clicks, 'one sighting is not evidence').toEqual([]);
    engine.stop();
  });

  it('goes back once the old step has held still long enough', () => {
    lit = new Set([100]);
    const engine = build([stepAt(100, 'one'), stepAt(200, 'two')]);
    const entries = [];
    engine.on('action', (entry) => entries.push(entry));

    engine.start(TaskId.SCRIPT);
    clicks.length = 0;

    waitOutBackward(engine);
    expect(clicks).toEqual([100]);
    expect(entries.some((entry) => entry.kind === 'resync')).toBe(true);
    engine.stop();
  });

  it('will not go back while a count step is deliberately holding', () => {
    const counting = createStep({
      label: 'waves',
      kind: StepKind.COUNT,
      countTo: 9,
      tolerance: 4,
      points: [{ x: 500, y: 300, w: 20, h: 8, bw: 800, bh: 600, samples: [{ dx: 0.5, dy: 0.5, hex: '#000000' }] }],
    });
    lit = new Set([100]);
    const engine = build([stepAt(100, 'one'), counting, stepAt(300, 'three')]);

    engine.start(TaskId.SCRIPT);
    clicks.length = 0;

    for (let tick = 0; tick < 6; tick += 1) {
      advance(2000);
      engine.tick();
    }
    expect(clicks, 'counting is not being lost').toEqual([]);
    engine.stop();
  });
});

describe('the last resort', () => {
  it('tries Escape when nothing in the list matches for long enough', () => {
    lit = new Set();
    const engine = build([stepAt(100, 'one'), stepAt(200, 'two')]);

    engine.start(TaskId.SCRIPT);
    for (let tick = 0; tick < 6; tick += 1) {
      advance(PANIC_AFTER_MS / 2);
      engine.tick();
    }
    expect(keys).toContain('Escape');
    engine.stop();
  });

  it('gives up after a few tries rather than pressing it forever', () => {
    lit = new Set();
    const engine = build([stepAt(100, 'one')]);

    engine.start(TaskId.SCRIPT);
    for (let tick = 0; tick < 60; tick += 1) {
      advance(PANIC_GAP_MS);
      engine.tick();
    }
    expect(keys).toHaveLength(PANIC_MAX_TRIES);
    engine.stop();
  });

  it('never presses it while a count is holding', () => {
    const counting = createStep({
      label: 'waves',
      kind: StepKind.COUNT,
      countTo: 9,
      tolerance: 4,
      points: [{ x: 500, y: 300, w: 20, h: 8, bw: 800, bh: 600, samples: [{ dx: 0.5, dy: 0.5, hex: '#000000' }] }],
    });
    lit = new Set();
    const engine = build([counting, stepAt(300, 'three')]);

    // Inside the count's own cap: past it, giving up and being lost is right.
    engine.start(TaskId.SCRIPT);
    for (let tick = 0; tick < 20; tick += 1) {
      advance(PANIC_GAP_MS);
      engine.tick();
    }
    expect(keys, 'a count that is counting is not lost').toEqual([]);
    engine.stop();
  });

  it('forgets its tries once something matches again', () => {
    lit = new Set();
    const engine = build([stepAt(100, 'one')]);

    engine.start(TaskId.SCRIPT);
    for (let tick = 0; tick < 6; tick += 1) {
      advance(PANIC_AFTER_MS / 2);
      engine.tick();
    }
    expect(keys.length).toBeGreaterThan(0);

    lit = new Set([100]);
    advance(1000);
    engine.tick();
    expect(clicks).toEqual([100]);

    keys.length = 0;
    lit = new Set();
    advance(1000);
    engine.tick();
    expect(keys, 'the budget is spent per predicament, not per run').toEqual([]);
    engine.stop();
  });
});
