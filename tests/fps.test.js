/**
 * The frame counters behind the FPS readout.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

let clock = 0;

vi.mock('../src/core/timers.js', () => ({
  realNow: () => clock,
  realPerformanceNow: () => clock,
  realSetTimeout: (...args) => setTimeout(...args),
  realClearTimeout: (...args) => clearTimeout(...args),
  realSetInterval: (...args) => setInterval(...args),
  realClearInterval: (...args) => clearInterval(...args),
  realRequestAnimationFrame: (callback) => {
    frames.push(callback);
    return frames.length;
  },
}));

let frames = [];

const { installSpeedHack, setSpeed, getFrameRates } = await import('../src/core/speed.js');

/** One browser frame: the game asks for a frame, the browser delivers it. */
function deliverFrame(loop) {
  window.requestAnimationFrame(loop);
  const callback = frames.pop();
  callback(clock);
}

describe('frame rates', () => {
  beforeEach(() => {
    // The clock only ever goes forward: the window that rolls these counters
    // is module state, and rewinding time would freeze it mid-window.
    clock += 5000;
    frames = [];
    installSpeedHack();
    setSpeed(1);
    // Roll the counters onto a window that starts here, so the jump above is
    // not counted as a second of no frames.
    getFrameRates();
  });

  it('counts one game frame per browser frame at 1×', () => {
    const loop = () => {};
    for (let i = 0; i < 30; i += 1) {
      clock += 16;
      deliverFrame(loop);
    }
    // The window only rolls once a second of real time has passed.
    clock += 1000 - 30 * 16;

    const { real, game } = getFrameRates();
    expect(real).toBe(30);
    expect(game).toBe(30);
    expect(game).toBe(real);
  });

  it('counts the extra game frames the speed hack runs', () => {
    setSpeed(5);
    // The burst re-registers, which is what lets it run more than once.
    const loop = () => window.requestAnimationFrame(loop);
    for (let i = 0; i < 10; i += 1) {
      clock += 16;
      deliverFrame(loop);
    }
    clock += 1000 - 10 * 16;

    const { real, game } = getFrameRates();
    expect(real).toBe(10);
    expect(game, 'five game frames per browser frame, minus the budget cap').toBeGreaterThan(real);
  });
});
