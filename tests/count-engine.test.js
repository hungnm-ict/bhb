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
  setClickObserver: () => {},
}));

/** What every pixel of the watched region reads as, this tick. */
let shade = 10;

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
    canvas: { width: 800, height: 500 },
    gl: {
      RGBA: 0,
      UNSIGNED_BYTE: 0,
      readPixels(_x, _y, _w, _h, _format, _type, out) {
        out.fill(shade);
      },
    },
  }),
  getCanvas: () => ({ width: 800, height: 500 }),
  installCanvasPatch: () => {},
}));

const { createEngine, TaskId } = await import('../src/core/engine.js');
const { createStep, StepKind } = await import('../src/bot/step.js');

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
  now = 1_000_000;
});

describe('counting in the engine', () => {
  it('counts once the picture has settled somewhere new', () => {
    const engine = build([countStep({ countTo: 1 })]);

    // start() ticks once itself: that read only sets the mark.
    engine.start(TaskId.SCRIPT);
    expect(engine.getState().lastMessage).toContain('0/1');

    shade = 40;
    engine.tick();
    // Differs from the mark but has not settled yet.
    expect(engine.getState().lastMessage).toContain('0/1');

    engine.tick();
    expect(engine.getState().lastMessage).toContain('1/1');
    engine.stop();
  });

  it('counts an animation as one wave, not three', () => {
    const engine = build([countStep({ countTo: 2 })]);
    engine.start(TaskId.SCRIPT);

    for (const frame of [30, 50, 70]) {
      shade = frame;
      engine.tick();
    }
    expect(engine.getState().lastMessage).toContain('0/2');

    engine.tick();
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
    const engine = build([countStep({ countTo: 9 })]);
    engine.start(TaskId.SCRIPT);

    advance(120_000);
    shade = 90;
    engine.tick();
    engine.tick();
    expect(engine.getState().lastMessage).toContain('1/9');

    // Three minutes past the start, but only a moment past the counted wave.
    advance(100_000);
    engine.checkIdle();
    expect(engine.getState().activeTask).toBe(TaskId.SCRIPT);
    engine.stop();
  });

  it('starts a second lap from zero', () => {
    // Optional, so the cursor hops past it and wraps rather than waiting.
    const engine = build([countStep({ countTo: 1 }), createStep({ label: 'after', optional: true })]);
    engine.start(TaskId.SCRIPT);

    shade = 60;
    engine.tick();
    engine.tick();
    expect(engine.getState().lastMessage).toContain('1/1');

    // Past the count, round the list, and back: the tally resets.
    engine.tick();
    shade = 80;
    engine.tick();
    expect(engine.getState().lastMessage).toContain('0/1');
    engine.stop();
  });
});
