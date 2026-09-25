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

/** Escape is off unless a profile asks for it; these tests ask. */
function build(steps, { escape = true } = {}) {
  return createEngine({
    getScriptSteps: () => steps,
    getScaleMode: () => 'scale',
    shouldTryEscape: () => escape,
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
  it('is not tried at all unless the profile asked for it', () => {
    // Nothing matching for a while is what a long fight looks like, and the
    // key this presses is the one that leaves a dungeon.
    lit = new Set();
    const engine = build([stepAt(100, 'one')], { escape: false });

    engine.start(TaskId.SCRIPT);
    for (let tick = 0; tick < 30; tick += 1) {
      advance(PANIC_GAP_MS);
      engine.tick();
    }
    expect(keys).toEqual([]);
    engine.stop();
  });

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

describe('a blocking step waits its turn', () => {
  /** A count over a region that never changes, so it only ever holds. */
  function countStep(label) {
    return createStep({
      label,
      kind: StepKind.COUNT,
      countTo: 7,
      countCap: 120,
      tolerance: 4,
      points: [
        { x: 500, y: 300, w: 20, h: 8, bw: 800, bh: 600, samples: [{ dx: 0.5, dy: 0.5, hex: '#000000' }] },
      ],
    });
  }

  it('does not start counting on a screen the sequence has not reached', () => {
    // What v0.30.0 did to a real profile: the cursor sat on a step whose
    // button had not appeared, the forward scan swept past it into the count,
    // and the count held the whole sequence for its cap on the wrong screen.
    lit = new Set();
    const engine = build([stepAt(100, 'enter'), countStep('waves'), stepAt(300, 'leave')]);

    engine.start(TaskId.SCRIPT);
    advance(1000);
    engine.tick();

    expect(engine.getState().lastMessage, 'the count is not its turn').not.toContain('0/7');
    engine.stop();
  });

  it('counts once everything before it is done', () => {
    lit = new Set([100]);
    const engine = build([stepAt(100, 'enter'), countStep('waves'), stepAt(300, 'leave')]);

    engine.start(TaskId.SCRIPT);
    expect(clicks).toEqual([100]);

    lit = new Set();
    advance(1000);
    engine.tick();
    expect(engine.getState().lastMessage).toContain('0/7');
    engine.stop();
  });

  it('does not reach past a blocking step for a later click either', () => {
    // The mirror danger: skipping the count to click the step that quits.
    lit = new Set([300]);
    const engine = build([stepAt(100, 'enter'), countStep('waves'), stepAt(300, 'leave')]);

    engine.start(TaskId.SCRIPT);
    advance(1000);
    engine.tick();

    expect(clicks, 'quitting before the waves are counted loses the reward').toEqual([]);
    engine.stop();
  });
});

describe('a blocking step is a checkpoint', () => {
  function countStep(label) {
    return createStep({
      label,
      kind: StepKind.COUNT,
      countTo: 7,
      countCap: 120,
      tolerance: 4,
      points: [
        { x: 500, y: 300, w: 20, h: 8, bw: 800, bh: 600, samples: [{ dx: 0.5, dy: 0.5, hex: '#000000' }] },
      ],
    });
  }

  it('never goes back past one, however well a step before it matches', () => {
    // The loop this closes: the bot turns auto off, the quit button does not
    // match, and going back finds the turn-auto-on step — which matches only
    // because auto was just turned off. It undoes its own work, forever.
    const autoOn = stepAt(100, 'auto on');
    const quit = stepAt(300, 'quit');
    const engine = build([autoOn, countStep('waves'), stepAt(200, 'auto off'), quit]);

    // Walk to the far side of the count: auto on, then the count gives up.
    lit = new Set([100]);
    engine.start(TaskId.SCRIPT);
    expect(clicks).toEqual([100]);

    // The count's clock starts when the cursor reaches it, so this is two
    // hops: one to arrive, one to find the cap long past.
    lit = new Set();
    advance(1000);
    engine.tick();
    advance(130_000);
    engine.tick();

    // Auto off clicks; now only the step before the count is on screen.
    lit = new Set([200]);
    advance(1000);
    engine.tick();
    clicks.length = 0;

    lit = new Set([100]);
    for (let tick = 0; tick < 20; tick += 1) {
      advance(1000);
      engine.tick();
    }

    expect(clicks, 'a wave already counted is not to be counted again').toEqual([]);
    engine.stop();
  });

  it('still goes back freely when no checkpoint has been passed', () => {
    lit = new Set([100]);
    const engine = build([stepAt(100, 'one'), stepAt(200, 'two')]);
    engine.start(TaskId.SCRIPT);
    clicks.length = 0;

    waitOutBackward(engine);
    expect(clicks).toEqual([100]);
    engine.stop();
  });
});
