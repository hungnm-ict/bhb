/**
 * The speed hack moves the game's idea of now forward, and that drift is what
 * makes another account believe a new day started.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

let clock = 1_000_000;

vi.mock('../src/core/timers.js', () => ({
  realNow: () => clock,
  realPerformanceNow: () => clock,
  realSetTimeout: (...args) => setTimeout(...args),
  realClearTimeout: (...args) => clearTimeout(...args),
  realSetInterval: (...args) => setInterval(...args),
  realClearInterval: (...args) => clearInterval(...args),
  realRequestAnimationFrame: () => 1,
}));

const { installSpeedHack, setSpeed, getClockDrift } = await import('../src/core/speed.js');

describe('the game clock', () => {
  beforeEach(() => {
    installSpeedHack();
    setSpeed(1);
    Date.now();
  });

  it('runs ahead while boosted', () => {
    setSpeed(10);
    Date.now();
    clock += 60_000; // one real minute at 10×
    Date.now();

    expect(getClockDrift()).toBe(540_000); // ten minutes lived, nine of them owed
  });

  it('never runs backwards on its own', () => {
    setSpeed(5);
    Date.now();
    clock += 1000;
    const first = Date.now();
    clock += 1000;

    expect(Date.now()).toBeGreaterThan(first);
  });
});

describe('coming back down from a boost', () => {
  beforeEach(() => {
    installSpeedHack();
    setSpeed(1);
    Date.now();
  });

  it('never moves the game clock backwards', () => {
    // A backwards jump strands every timer the game holds: a cooldown due in
    // ten seconds is suddenly due in nine minutes, and the game sits there.
    // Whatever is done about drift, it cannot be done by rewinding mid-play.
    setSpeed(10);
    Date.now();
    clock += 60_000;
    const beforeDrop = Date.now();

    setSpeed(1);
    const afterDrop = Date.now();

    expect(afterDrop).toBeGreaterThanOrEqual(beforeDrop);
  });

  it('keeps the drift it earned rather than paying it back', () => {
    setSpeed(10);
    Date.now();
    clock += 60_000;
    Date.now();

    setSpeed(1);
    Date.now();

    expect(getClockDrift(), 'nine minutes owed, and owed they stay').toBe(540_000);
  });
});
