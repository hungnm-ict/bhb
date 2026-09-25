/**
 * When a window is covered edge to edge the browser stops delivering animation
 * frames, and the game stops with them. These pin the hand-driven frame: it
 * must fire when frames stop, and must stay out of the way when they do not.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

let clock = 0;
/** Frames the browser has accepted but not yet delivered. */
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

const { installSpeedHack, pumpFrame, setSpeed } = await import('../src/core/speed.js');
const { STALL_MS } = await import('../src/core/speed.js');

beforeEach(() => {
  clock = 0;
  scheduled = [];
  installSpeedHack();
  setSpeed(1);
});

/** Deliver every frame the browser is holding. */
function deliverFrames() {
  const due = scheduled;
  scheduled = [];
  for (const callback of due) {
    callback();
  }
}

describe('hand-driven frames', () => {
  it('does nothing while the browser is still delivering frames', () => {
    const loop = vi.fn(() => window.requestAnimationFrame(loop));
    window.requestAnimationFrame(loop);

    clock += 16;
    deliverFrames();
    expect(loop).toHaveBeenCalledTimes(1);

    clock += 16;
    expect(pumpFrame(), 'a frame arrived 16ms ago; nothing is stalled').toBe(false);
    expect(loop).toHaveBeenCalledTimes(1);
  });

  it('runs the outstanding frame once the browser stops sending them', () => {
    const loop = vi.fn(() => window.requestAnimationFrame(loop));
    window.requestAnimationFrame(loop);

    // The window is covered: the frame was accepted but never delivered.
    clock += 1000;
    expect(pumpFrame()).toBe(true);
    expect(loop).toHaveBeenCalledTimes(1);

    // The loop re-registered from inside itself, so it keeps being driven.
    clock += 1000;
    expect(pumpFrame()).toBe(true);
    expect(loop).toHaveBeenCalledTimes(2);
  });

  it('drives nothing when the game has no frame outstanding', () => {
    clock += 5000;
    expect(pumpFrame(), 'no loop is running; there is nothing to drive').toBe(false);
  });

  it('keeps driving a boosted loop, which books its frames from inside a burst', () => {
    // The burst path used to book its own frame directly, leaving nothing for
    // the pump to find — so a minimised window froze the game at any speed
    // above 1×, the speed it is actually left running at.
    setSpeed(5);
    const loop = vi.fn(() => window.requestAnimationFrame(loop));
    window.requestAnimationFrame(loop);

    clock += 16;
    deliverFrames();
    const afterFirstFrame = loop.mock.calls.length;
    expect(afterFirstFrame, 'a burst runs the loop several times').toBeGreaterThan(1);

    // The window is minimised now: nothing is delivered from here on.
    clock += 1000;
    expect(pumpFrame(), 'the burst left a frame for the pump to drive').toBe(true);
    expect(loop.mock.calls.length).toBeGreaterThan(afterFirstFrame);

    const afterPump = loop.mock.calls.length;
    clock += 1000;
    expect(pumpFrame()).toBe(true);
    expect(loop.mock.calls.length, 'and the chain keeps going').toBeGreaterThan(afterPump);
  });

  it('runs at the pump\'s own cadence once it is carrying the loop', () => {
    // Driving a frame by hand counts as one arriving, so waiting out the stall
    // again each time capped a minimised game at four frames a second.
    const loop = vi.fn(() => window.requestAnimationFrame(loop));
    window.requestAnimationFrame(loop);

    clock += 1000;
    expect(pumpFrame()).toBe(true);

    clock += 16;
    expect(pumpFrame(), 'no real frame came back, so it keeps carrying').toBe(true);
    expect(loop).toHaveBeenCalledTimes(2);
  });

  it('stands down as soon as real frames come back', () => {
    const loop = vi.fn(() => window.requestAnimationFrame(loop));
    window.requestAnimationFrame(loop);

    clock += 1000;
    pumpFrame();

    // The window is uncovered: the browser delivers the frame the loop asked
    // for, and the hand-driven path has nothing left to do.
    clock += 16;
    deliverFrames();
    expect(loop).toHaveBeenCalledTimes(2);
    expect(pumpFrame()).toBe(false);
  });
});
