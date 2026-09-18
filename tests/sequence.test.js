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
let now = 1_000_000;

/** Move the shared fake clock, so a time-based threshold can be tested. */
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
const { createStep } = await import('../src/bot/step.js');
const { RESYNC_AFTER_MS } = await import('../src/core/constants.js');

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
    getScaleMode: () => 'scale',
  });
}

beforeEach(() => {
  clicks.length = 0;
  lit = new Set();
  now = 1_000_000;
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
    for (let i = 0; i < 12; i += 1) {
      advance(RESYNC_AFTER_MS / 20);
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
    advance(RESYNC_AFTER_MS + 1);
    engine.tick();

    expect(clicks, 'resynced onto the step that is actually on screen').toContain(200);
    expect(entries.some((entry) => entry.kind === 'resync')).toBe(true);
    engine.stop();
  });

  it('holds its place for the same wall-clock time however fast it polls', () => {
    // The bug this guards: the threshold used to count ticks, so making the
    // loop poll ten times faster made the runner give up ten times sooner —
    // and it resynced onto the step it had just clicked, whose button was
    // still on screen, clicking it over and over.
    lit = new Set([200]);
    const engine = build([stepAt(100, 'one'), stepAt(200, 'two')]);

    engine.start(TaskId.SCRIPT);
    for (let i = 0; i < 30; i += 1) {
      advance(RESYNC_AFTER_MS / 60);
      engine.tick();
    }

    expect(clicks, 'half the threshold of impatience is still patience').toEqual([]);
    engine.stop();
  });

  it('picks its place back up after a resync rather than starting over', () => {
    lit = new Set([200, 300]);
    const engine = build([stepAt(100, 'one'), stepAt(200, 'two'), stepAt(300, 'three')]);

    engine.start(TaskId.SCRIPT);
    advance(RESYNC_AFTER_MS + 1);
    engine.tick();
    engine.tick();

    // Resync lands on step two, so the next click is step three, not step one.
    expect(clicks[clicks.indexOf(200) + 1]).toBe(300);
    engine.stop();
  });

  it('runs a single activity as a sequence, like the queue would', () => {
    lit = new Set([100, 200]);
    const engine = createEngine({
      getScriptSteps: () => [
        { ...stepAt(100, 'one'), activity: 'raid' },
        { ...stepAt(200, 'two'), activity: 'raid' },
      ],
      getActivities: () => [{ id: 'raid', name: 'Raid', enabled: true }],
      getScaleMode: () => 'scale',
    });

    engine.start(TaskId.SOLO, 'raid');
    engine.tick();

    expect(clicks, 'in order, as the user wrote them').toEqual([100, 200]);
    expect(engine.getState().activity).toBe('raid');
    engine.stop();
  });
});

describe('waiting and optional steps', () => {
  /** The WB team lobby: an empty party slot still shows its INVITE button. */
  function waitAt(x, label) {
    return { ...stepAt(x, label), kind: 'wait' };
  }

  function optionalAt(x, label) {
    return { ...stepAt(x, label), optional: true };
  }

  it('holds at a wait step while its colour is still there', () => {
    // 100 = the empty slot, 200 = START. Nothing may click START yet.
    lit = new Set([100, 200]);
    const engine = build([waitAt(100, 'slot 3 empty'), stepAt(200, 'start')]);

    engine.start(TaskId.SCRIPT);
    engine.tick();
    engine.tick();

    expect(clicks, 'START is behind the wait').toEqual([]);
    engine.stop();
  });

  it('goes on the moment the wait clears, in the same tick', () => {
    lit = new Set([100, 200]);
    const engine = build([waitAt(100, 'slot 3 empty'), stepAt(200, 'start')]);
    engine.start(TaskId.SCRIPT);

    // A third player joins: the slot's button is gone.
    lit = new Set([200]);
    engine.tick();

    expect(clicks).toEqual([200]);
    engine.stop();
  });

  it('never lets a resync carry the runner past a deliberate wait', () => {
    lit = new Set([100, 200]);
    const engine = build([waitAt(100, 'slot 3 empty'), stepAt(200, 'start')]);
    engine.start(TaskId.SCRIPT);

    for (let tick = 0; tick < 6; tick += 1) {
      advance(RESYNC_AFTER_MS / 2);
      engine.tick();
    }

    expect(clicks, 'a wait is intended, not a step that is stuck').toEqual([]);
    engine.stop();
  });

  it('skips an optional step that is not there, without stalling the sequence', () => {
    // Private is already ticked, so its unticked colour is absent.
    lit = new Set([200]);
    const engine = build([optionalAt(100, 'tick private'), stepAt(200, 'start')]);

    engine.start(TaskId.SCRIPT);

    expect(clicks, 'straight on to START in the same tick').toEqual([200]);
    engine.stop();
  });

  it('still clicks an optional step when it is there', () => {
    lit = new Set([100, 200]);
    const engine = build([optionalAt(100, 'tick private'), stepAt(200, 'start')]);

    engine.start(TaskId.SCRIPT);
    engine.tick();

    expect(clicks).toEqual([100, 200]);
    engine.stop();
  });
});

describe('waiting on a count, not a seat', () => {
  /** Four invite buttons, one step: the party lobby as one condition. */
  function waitOnPlaces(xs, maxMatches) {
    return {
      ...stepAt(xs[0], 'empty seats'),
      kind: 'wait',
      maxMatches,
      points: xs.map((x) => ({ x, y: 300, bw: 800, bh: 600 })),
    };
  }

  it('lets the sequence through once few enough places still match', () => {
    // Seats 4 and 5 are taken; 2 and 3 are not. Three players are here.
    lit = new Set([100, 200, 900]);
    const engine = build([waitOnPlaces([100, 200, 300, 400], 2), stepAt(900, 'start')]);

    engine.start(TaskId.SCRIPT);

    expect(clicks, 'who sat where is the game\'s business').toEqual([900]);
    engine.stop();
  });

  it('keeps holding while too many still match', () => {
    lit = new Set([100, 200, 300, 900]);
    const engine = build([waitOnPlaces([100, 200, 300, 400], 2), stepAt(900, 'start')]);

    engine.start(TaskId.SCRIPT);
    engine.tick();

    expect(clicks, 'only two players so far').toEqual([]);
    engine.stop();
  });

  it('counts a place once, though a capture stores two colours for it', () => {
    // What a capture actually writes: the resting colour and the hovered one,
    // both at the same spot. Counted naively, one empty seat reads as two.
    const step = {
      ...stepAt(100, 'one seat'),
      kind: 'wait',
      maxMatches: 1,
      points: [
        { x: 100, y: 300, bw: 800, bh: 600 },
        { x: 100, y: 300, bw: 800, bh: 600, hex: '#ff0000' },
      ],
    };
    lit = new Set([100, 900]);
    const engine = build([step, stepAt(900, 'start')]);

    engine.start(TaskId.SCRIPT);

    expect(clicks, 'one place matching is one, not two').toEqual([900]);
    engine.stop();
  });
});
