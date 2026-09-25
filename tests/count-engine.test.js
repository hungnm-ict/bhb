/**
 * Counting in the engine.
 *
 * A count step is the first thing the runner waits on that is neither a
 * colour nor a clock, so what is tested here is the arithmetic: one settled
 * change is one wave, an animation on its way to settling is none, and a
 * region that never moves does not hold the bot forever.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/core/input.js', () => ({
  clickBufferPoint: () => true,
  dispatchKey: () => {},
  setClickObserver: () => {},
}));

/** What every pixel of the watched region reads as, this tick. */
let shade = 10;

/** Multiplies the canvas size, for the resize-mid-count case. */
let bufferScale = 1;

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
    canvas: { width: 800 * bufferScale, height: 500 * bufferScale },
    gl: {
      RGBA: 0,
      UNSIGNED_BYTE: 0,
      readPixels(_x, _y, _w, _h, _format, _type, out) {
        out.fill(shade);
      },
    },
  }),
  getCanvas: () => ({ width: 800 * bufferScale, height: 500 * bufferScale }),
  installCanvasPatch: () => {},
}));

const { createEngine, TaskId } = await import('../src/core/engine.js');
const { createStep, StepKind } = await import('../src/bot/step.js');
const { COUNT_DEBOUNCE_MS } = await import('../src/core/constants.js');

const REGION_POINT = {
  x: 10,
  y: 10,
  w: 20,
  h: 8,
  bw: 800,
  bh: 500,
  samples: [{ dx: 0.5, dy: 0.5, hex: '#0a0a0a' }],
};

function countStep(overrides = {}) {
  return createStep({
    label: 'waves',
    kind: StepKind.COUNT,
    tolerance: 4,
    countTo: 1,
    points: [REGION_POINT],
    ...overrides,
  });
}

function build(steps) {
  return createEngine({
    getScriptSteps: () => steps,
    getScaleMode: () => 'scale',
  });
}

beforeEach(() => {
  shade = 10;
  bufferScale = 1;
  now = 1_000_000;
});

describe('counting in the engine', () => {
  it('counts the moment the region leaves stillness', () => {
    const engine = build([countStep({ countTo: 1 })]);

    // start() ticks once itself: that read is the stillness to leave.
    engine.start(TaskId.SCRIPT);
    expect(engine.getState().lastMessage).toContain('0/1');

    shade = 40;
    advance(300);
    engine.tick();
    expect(engine.getState().lastMessage).toContain('1/1');
    engine.stop();
  });

  it('counts a number arriving over several frames as one wave', () => {
    const engine = build([countStep({ countTo: 2 })]);
    engine.start(TaskId.SCRIPT);

    // Still moving is still the same wave: only the first frame counts.
    for (const frame of [30, 50, 70]) {
      shade = frame;
      advance(300);
      engine.tick();
    }
    expect(engine.getState().lastMessage).toContain('1/2');
    engine.stop();
  });

  it('never counts a picture that does not change', () => {
    const engine = build([countStep({ countTo: 2 })]);
    engine.start(TaskId.SCRIPT);

    for (let tick = 0; tick < 10; tick += 1) {
      engine.tick();
    }
    expect(engine.getState().lastMessage).toContain('0/2');
    engine.stop();
  });

  it('passes straight through when there is nothing to count', () => {
    const engine = build([countStep({ countTo: 0 })]);
    engine.start(TaskId.SCRIPT);
    expect(engine.getState().lastMessage).not.toContain('0/0');
    engine.stop();
  });

  it('is not ready, and so not counted, without a region', () => {
    const engine = build([countStep({ countTo: 3, points: [{ x: 1, y: 2, bw: 800, bh: 500 }] })]);
    engine.start(TaskId.SCRIPT);
    expect(engine.getState().lastMessage).not.toContain('0/3');
    engine.stop();
  });

  it('gives up at the cap instead of parking the bot', () => {
    const engine = build([countStep({ countTo: 5, countCap: 30 })]);
    engine.start(TaskId.SCRIPT);
    expect(engine.getState().lastMessage).toContain('0/5');

    advance(31_000);
    engine.tick();
    expect(engine.getState().lastMessage).toContain('gave up');
    engine.stop();
  });

  it('counting keeps the auto-stop clock alive', () => {
    const engine = build([countStep({ countTo: 9, countCap: 170 })]);
    engine.start(TaskId.SCRIPT);

    advance(100_000);
    shade = 90;
    engine.tick();
    expect(engine.getState().lastMessage).toContain('1/9');

    // Three minutes past the start, but only a moment past the counted wave.
    advance(120_000);
    engine.checkIdle();
    expect(engine.getState().activeTask).toBe(TaskId.SCRIPT);
    engine.stop();
  });

  it('starts a second lap from zero', () => {
    // Optional, so the cursor hops past it and wraps rather than waiting.
    const engine = build([countStep({ countTo: 1 }), createStep({ label: 'after', optional: true })]);
    engine.start(TaskId.SCRIPT);

    shade = 60;
    advance(300);
    engine.tick();
    expect(engine.getState().lastMessage).toContain('1/1');

    // Past the count, round the list, and back: the tally resets, and the
    // first read of the new visit is the stillness the next wave leaves.
    advance(300);
    engine.tick();
    expect(engine.getState().lastMessage).toContain('0/1');
    engine.stop();
  });
});

describe('counting survives the things a session does to it', () => {
  it('starts a fresh tally after a stop', () => {
    const engine = build([countStep({ countTo: 7 })]);
    engine.start(TaskId.SCRIPT);

    shade = 50;
    engine.tick();
    advance(1000);
    engine.tick();
    expect(engine.getState().lastMessage).toContain('1/7');

    engine.stop();
    // Long enough that a carried-over `since` would cap the next run at once.
    advance(400_000);
    engine.start(TaskId.SCRIPT);
    expect(engine.getState().lastMessage).toContain('0/7');
    engine.stop();
  });

  it('is never clicked by a resync', () => {
    // A blocking first step, so the cursor gives up on it and free-scans.
    const blocked = createStep({
      label: 'never',
      hex: '#ff0000',
      tolerance: 0,
      points: [{ x: 400, y: 250, bw: 800, bh: 500 }],
    });
    const engine = build([blocked, countStep({ countTo: 7 })]);
    engine.start(TaskId.SCRIPT);

    advance(20_000);
    engine.tick();
    expect(engine.getState().lastMessage).not.toContain('→ click');
    engine.stop();
  });

  it('absorbs a frame that pauses briefly on its way in', () => {
    const engine = build([countStep({ countTo: 7 })]);
    engine.start(TaskId.SCRIPT);

    // One wave arriving through an intermediate frame, inside the debounce.
    shade = 25;
    advance(60);
    engine.tick();
    advance(60);
    engine.tick();
    shade = 40;
    advance(60);
    engine.tick();

    expect(engine.getState().lastMessage).toContain('1/7');
    engine.stop();
  });

  it('does not invent a wave when the canvas is resized', () => {
    const engine = build([countStep({ countTo: 7 })]);
    engine.start(TaskId.SCRIPT);

    // Same picture throughout; only the rectangle's size changes under it.
    bufferScale = 2;
    advance(1000);
    engine.tick();
    advance(1000);
    engine.tick();
    advance(1000);
    engine.tick();

    expect(engine.getState().lastMessage).toContain('0/7');
    engine.stop();
  });

  it('says so when it has no box to watch', () => {
    const engine = build([countStep({ countTo: 7, points: [{ x: 1, y: 2, bw: 800, bh: 500 }] })]);
    engine.start(TaskId.SCRIPT);
    expect(engine.getState().lastMessage).toContain('no box');
    engine.stop();
  });
});

describe('the cap measures progress, not patience', () => {
  it('keeps waiting while waves are still arriving', () => {
    const engine = build([countStep({ countTo: 9, countCap: 30 })]);
    engine.start(TaskId.SCRIPT);

    // A wave every 20s for two minutes: slower than the cap, but working.
    for (let wave = 1; wave <= 6; wave += 1) {
      shade = 10 + wave * 20;
      advance(20_000);
      engine.tick();
      advance(300);
      engine.tick();
    }

    expect(engine.getState().lastMessage).toContain('6/9');
    expect(engine.getState().lastMessage).not.toContain('gave up');
    engine.stop();
  });

  it('gives up when nothing has arrived for the whole cap', () => {
    const engine = build([countStep({ countTo: 9, countCap: 30 })]);
    engine.start(TaskId.SCRIPT);

    shade = 60;
    advance(1000);
    engine.tick();
    advance(300);
    engine.tick();
    expect(engine.getState().lastMessage).toContain('1/9');

    advance(31_000);
    engine.tick();
    expect(engine.getState().lastMessage).toContain('gave up');
    engine.stop();
  });
});

describe('counting keeps up with a fast battle', () => {
  it('catches a wave that lasts only two polls', () => {
    // Asked for more than will arrive, so the tally is still there to read:
    // reaching the target ends the count and starts the next lap at zero.
    const engine = build([countStep({ countTo: 9 })]);
    engine.start(TaskId.SCRIPT);

    // Five waves, each one steady for a single extra poll before the next.
    for (let wave = 1; wave <= 5; wave += 1) {
      shade = 10 + wave * 25;
      advance(300);
      engine.tick();
      advance(300);
      engine.tick();
    }

    expect(engine.getState().lastMessage).toContain('5/9');
    engine.stop();
  });

  it('still counts a number that animates in as one wave', () => {
    const engine = build([countStep({ countTo: 3 })]);
    engine.start(TaskId.SCRIPT);

    // One wave, arriving through three moving frames, then at rest.
    for (const frame of [30, 50, 70]) {
      shade = frame;
      advance(300);
      engine.tick();
    }
    advance(300);
    engine.tick();
    advance(300);
    engine.tick();

    expect(engine.getState().lastMessage).toContain('1/3');
    engine.stop();
  });

  it('counts nothing at all in a region that never stops moving', () => {
    const engine = build([countStep({ countTo: 3 })]);
    engine.start(TaskId.SCRIPT);

    for (let tick = 0; tick < 12; tick += 1) {
      shade = 10 + tick * 15;
      advance(300);
      engine.tick();
    }

    // The first frame of movement is a wave; nothing after it is, because the
    // region never comes to rest for another one to start from.
    expect(engine.getState().lastMessage).toContain('1/3');
    engine.stop();
  });
});
