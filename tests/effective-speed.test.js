/**
 * What the boost actually delivers.
 *
 * The slider is a request. What arrives is capped by how long one game frame
 * takes, so 20x on a heavy screen can be 2x in practice — and nothing on
 * screen said so. Game frames over browser frames is that number.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

let clock = 0;
let scheduled = [];
/** How long one call of the game's frame callback costs, in ms. */
let frameCost = 0;

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

const { installSpeedHack, setSpeed, setFrameMultiplier, getFrameRates } = await import(
  '../src/core/speed.js'
);

beforeEach(() => {
  // The clock never rewinds: the counting window is module state, and a clock
  // that restarted would leave it waiting for a second that never comes.
  scheduled = [];
  frameCost = 0;
  setSpeed(1);
  setFrameMultiplier(true);
  installSpeedHack();
  // The counting window is module state and the fake clock restarts at zero,
  // so roll it once to start this test's window here.
  clock += 2000;
  getFrameRates();
});

function startLoop() {
  const loop = vi.fn(() => {
    clock += frameCost;
    window.requestAnimationFrame(loop);
  });
  window.requestAnimationFrame(loop);
  return loop;
}

/** One real frame at 60fps, minus whatever the burst already spent. */
function tickFrame() {
  const startedAt = clock;
  const due = scheduled;
  scheduled = [];
  for (const callback of due) {
    callback();
  }
  clock = Math.max(clock, startedAt + 16);
}

function runFor(frames) {
  for (let i = 0; i < frames; i += 1) {
    tickFrame();
  }
  clock += 1000;
  return getFrameRates();
}

describe('the speed actually achieved', () => {
  it('is reported alongside the raw counts', () => {
    const rates = getFrameRates();
    expect(rates).toHaveProperty('effective');
  });

  it('is 1 when nothing is boosted', () => {
    setSpeed(1);
    startLoop();
    const rates = runFor(10);
    expect(rates.effective).toBeCloseTo(1, 1);
  });

  it('reaches the requested speed when frames are cheap', () => {
    frameCost = 0;
    setSpeed(10);
    startLoop();
    const rates = runFor(10);
    expect(rates.effective).toBeGreaterThan(5);
  });

  it('falls well short of the request when a frame is expensive', () => {
    // 40ms a frame: the budget cannot buy ten of them inside one real frame.
    frameCost = 40;
    setSpeed(20);
    startLoop();
    const rates = runFor(10);

    expect(rates.effective, 'the slider said twenty').toBeLessThan(4);
    expect(rates.effective).toBeGreaterThan(0);
  });

  it('is 1 with the multiplier off, whatever the slider says', () => {
    setFrameMultiplier(false);
    setSpeed(20);
    startLoop();
    const rates = runFor(10);
    expect(rates.effective).toBeCloseTo(1, 1);
  });
});

describe('the frame budget', () => {
  it('spends less on an expensive screen than on a cheap one', () => {
    frameCost = 40;
    setSpeed(20);
    startLoop();

    const startedAt = clock;
    for (let i = 0; i < 5; i += 1) {
      tickFrame();
    }
    const expensive = clock - startedAt;

    expect(expensive / 5, 'per real frame, well under a budget plus a frame').toBeLessThan(60);
  });

  it('stops before a frame it cannot afford, rather than after', () => {
    // One game frame costs 40ms against a 15ms budget. Running it and asking
    // afterwards spends 40ms every time; asking first spends one and stops.
    frameCost = 40;
    setSpeed(20);
    const loop = startLoop();

    const startedAt = clock;
    tickFrame();
    const spent = clock - startedAt;

    expect(loop).toHaveBeenCalledTimes(1);
    expect(spent, 'one frame, not two or three').toBeLessThan(45);
  });
});
