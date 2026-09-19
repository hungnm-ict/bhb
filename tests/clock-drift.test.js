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

const { installSpeedHack, setSpeed, getClockDrift, resetClock } = await import('../src/core/speed.js');

describe('the game clock', () => {
  beforeEach(() => {
    installSpeedHack();
    setSpeed(1);
    Date.now();
    resetClock();
  });

  it('runs ahead while boosted', () => {
    setSpeed(10);
    Date.now();
    clock += 60_000; // one real minute at 10×
    Date.now();

    expect(getClockDrift()).toBe(540_000); // ten minutes lived, nine of them owed
  });

  it('is put back where it belongs on demand', () => {
    setSpeed(10);
    Date.now();
    clock += 60_000;
    Date.now();

    resetClock();

    expect(getClockDrift()).toBe(0);
    expect(Date.now()).toBe(clock);
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
