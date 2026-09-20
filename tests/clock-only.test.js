/**
 * Speed without extra frames.
 *
 * Multiplying frames is what costs the frame rate: the game's callback paints
 * as well as thinks, so every extra call is another full render. Cheat Engine
 * on a native build never pays that — it lies about the clock alone. This is
 * the same bargain, offered as a switch, because whether a Unity build honours
 * a stretched delta is something only the game can answer.
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

const { installSpeedHack, setSpeed, setFrameMultiplier, getFrameMultiplier } = await import(
  '../src/core/speed.js'
);

beforeEach(() => {
  clock = 0;
  scheduled = [];
  setSpeed(1);
  setFrameMultiplier(true);
  installSpeedHack();
});

function tickFrame() {
  clock += 16;
  const due = scheduled;
  scheduled = [];
  for (const callback of due) {
    callback();
  }
}

function startLoop() {
  const loop = vi.fn(() => window.requestAnimationFrame(loop));
  window.requestAnimationFrame(loop);
  return loop;
}

describe('the frame multiplier switch', () => {
  it('is on by default, which is the behaviour that shipped', () => {
    expect(getFrameMultiplier()).toBe(true);
  });

  it('runs the loop once per real frame when it is off', () => {
    setFrameMultiplier(false);
    setSpeed(10);
    const loop = startLoop();

    for (let i = 0; i < 4; i += 1) {
      tickFrame();
    }

    expect(loop, 'one call per frame, exactly as at 1x').toHaveBeenCalledTimes(4);
  });

  it('still runs the loop many times per frame when it is on', () => {
    setFrameMultiplier(true);
    setSpeed(10);
    const loop = startLoop();

    for (let i = 0; i < 4; i += 1) {
      tickFrame();
    }

    expect(loop.mock.calls.length).toBeGreaterThan(4);
  });

  it('keeps stretching the clock with the multiplier off', () => {
    // The whole point: the game is told an hour went by without being asked to
    // draw an hour's worth of frames.
    setFrameMultiplier(false);
    setSpeed(10);
    startLoop();

    Date.now();
    clock += 1000;
    const seen = Date.now();

    expect(seen, 'ten seconds of game time for one real second').toBeGreaterThanOrEqual(10_000);
  });

  it('can be turned back on without stranding the loop', () => {
    setFrameMultiplier(false);
    setSpeed(10);
    const loop = startLoop();
    tickFrame();
    tickFrame();

    setFrameMultiplier(true);
    const before = loop.mock.calls.length;
    tickFrame();
    tickFrame();

    expect(loop.mock.calls.length).toBeGreaterThan(before + 2);
  });
});
