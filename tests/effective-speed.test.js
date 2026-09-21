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

const {
  installSpeedHack,
  setSpeed,
  setFrameMultiplier,
  setFrameBudget,
  getFrameBudget,
  reportFrameRate,
  getFrameRates,
} = await import('../src/core/speed.js');

beforeEach(() => {
  // The clock never rewinds: the counting window is module state, and a clock
  // that restarted would leave it waiting for a second that never comes.
  scheduled = [];
  frameCost = 0;
  setSpeed(1);
  setFrameMultiplier(true);
  setFrameBudget(15);
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

describe('the share of a frame a run may take', () => {
  it('defaults to what shipped', () => {
    expect(getFrameBudget()).toBe(15);
  });

  it('refuses a budget that would eat the whole frame, or none of it', () => {
    setFrameBudget(500);
    expect(getFrameBudget()).toBeLessThanOrEqual(25);
    setFrameBudget(0);
    expect(getFrameBudget()).toBeGreaterThanOrEqual(3);
    setFrameBudget('nonsense');
    expect(getFrameBudget()).toBeGreaterThanOrEqual(3);
  });

  it('spends less of each frame when it is given less', () => {
    // Three instances on one machine each want a slice; the point of the dial
    // is that the slices can be made to add up to one frame instead of three.
    frameCost = 2;
    setSpeed(20);
    setFrameBudget(4);
    const loop = startLoop();

    tickFrame();

    expect(
      loop.mock.calls.length,
      'a small budget buys a few cheap frames, not twenty'
    ).toBeLessThan(6);
  });

  it('buys more frames when it is given more', () => {
    frameCost = 2;
    setSpeed(20);
    setFrameBudget(20);
    const loop = startLoop();

    tickFrame();

    expect(loop.mock.calls.length).toBeGreaterThan(4);
  });
});

describe('finding its own share of the machine', () => {
  it('gives ground when frames are scarce', () => {
    // Three instances on one machine: each sees its own frame rate fall and
    // backs off, so they settle into a share without knowing about each other.
    setSpeed(20);
    const before = getFrameBudget();

    reportFrameRate({ real: 12, game: 20 });

    expect(getFrameBudget()).toBeLessThan(before);
  });

  it('takes more back when the machine is idle again', () => {
    setSpeed(20);
    setFrameBudget(6);

    reportFrameRate({ real: 58, game: 120 });

    expect(getFrameBudget()).toBeGreaterThan(6);
  });

  it('holds still inside the band, rather than hunting', () => {
    setSpeed(20);
    setFrameBudget(10);

    reportFrameRate({ real: 35, game: 70 });

    expect(getFrameBudget()).toBe(10);
  });

  it('never gives away so much that a frame cannot run', () => {
    setSpeed(20);
    for (let i = 0; i < 40; i += 1) {
      reportFrameRate({ real: 3, game: 3 });
    }
    expect(getFrameBudget()).toBeGreaterThanOrEqual(3);
  });

  it('leaves the budget alone when nothing is boosted', () => {
    setSpeed(1);
    setFrameBudget(12);

    reportFrameRate({ real: 5, game: 5 });

    expect(getFrameBudget(), 'at 1x the budget buys nothing either way').toBe(12);
  });
});
