/**
 * Coming back down from a boost.
 *
 * While boosted, the loop rides a real frame scheduled from the tail of a
 * burst — a path that never goes back through the patched
 * `requestAnimationFrame`. Dropping to 1× has to hand the loop back to the
 * ordinary path, or the game simply stops.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

let clock = 0;
let scheduled = [];

vi.mock('../src/core/timers.js', () => ({
  realNow: () => clock,
  realPerformanceNow: () => clock,
  realSetTimeout: () => 0,
  realClearTimeout: () => {},
  realSetInterval: () => 0,
  realClearInterval: () => {},
  realRequestAnimationFrame: (callback) => {
    scheduled.push(callback);
    return scheduled.length;
  },
}));

const { installSpeedHack, setSpeed, pumpFrame } = await import('../src/core/speed.js');

beforeEach(() => {
  clock = 0;
  scheduled = [];
  setSpeed(1);
  installSpeedHack();
});

/** One real frame: deliver whatever the browser is holding. */
function tickFrame() {
  clock += 16;
  const due = scheduled;
  scheduled = [];
  for (const callback of due) {
    callback();
  }
}

/** A game loop that re-registers itself every frame, as Unity's does. */
function startLoop() {
  const loop = vi.fn(() => window.requestAnimationFrame(loop));
  window.requestAnimationFrame(loop);
  return loop;
}

describe('dropping back to 1x', () => {
  it('keeps the loop running after a boost ends', () => {
    const loop = startLoop();

    setSpeed(10);
    for (let i = 0; i < 5; i += 1) {
      tickFrame();
    }
    const whileBoosted = loop.mock.calls.length;
    expect(whileBoosted, 'the boost ran the loop').toBeGreaterThan(5);

    setSpeed(1);
    for (let i = 0; i < 5; i += 1) {
      tickFrame();
    }

    expect(
      loop.mock.calls.length,
      'the loop must keep being called once the boost ends'
    ).toBeGreaterThan(whileBoosted);
  });

  it('leaves a frame outstanding so a stall can still be driven by hand', () => {
    startLoop();

    setSpeed(10);
    for (let i = 0; i < 3; i += 1) {
      tickFrame();
    }
    setSpeed(1);
    tickFrame();

    // Nothing delivered for a while: the hand-driven frame is the safety net,
    // and it can only fire if the loop left something outstanding.
    clock += 1000;
    expect(pumpFrame(), 'a stalled loop must still be recoverable').toBe(true);
  });

  it('runs the loop at 1x after going up and back down twice', () => {
    const loop = startLoop();

    for (const speed of [20, 1, 15, 1]) {
      setSpeed(speed);
      for (let i = 0; i < 3; i += 1) {
        tickFrame();
      }
    }

    const before = loop.mock.calls.length;
    tickFrame();
    tickFrame();
    expect(loop.mock.calls.length, 'still alive after two round trips').toBeGreaterThan(before);
  });
});
