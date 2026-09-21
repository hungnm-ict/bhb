/**
 * The frame multiplier has to keep the game's rAF loop alive. A real loop
 * re-registers itself from inside its own callback, and Unity hands rAF a
 * fresh closure every frame.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('speed hack frame multiplier', () => {
  let queue;

  beforeEach(async () => {
    vi.resetModules();
    queue = [];
    window.requestAnimationFrame = (cb) => queue.push(cb);
    performance.now = () => 0;
    const speed = await import('../src/core/speed.js');
    speed.installSpeedHack();
    speed.setSpeed(5);
  });

  /** Drain exactly one real frame. */
  function realFrame() {
    const due = queue.splice(0, queue.length);
    for (const cb of due) {
      cb(0);
    }
  }

  it('keeps a self-rescheduling loop alive and runs it 5x', () => {
    let ticks = 0;
    const loop = () => {
      ticks += 1;
      window.requestAnimationFrame(loop); // same identity every frame
    };
    window.requestAnimationFrame(loop);

    realFrame(); // warm-up frame
    realFrame();
    expect(queue.length, 'loop died: nothing scheduled for the next frame').toBeGreaterThan(0);
    realFrame();
    expect(ticks, 'callback should run ~speed times per real frame').toBeGreaterThan(5);
  });

  it('speeds up a loop that re-registers a fresh closure each frame', () => {
    let ticks = 0;
    const schedule = () => {
      window.requestAnimationFrame(() => {   // new closure every frame
        ticks += 1;
        schedule();
      });
    };
    schedule();

    realFrame();
    realFrame();
    realFrame();
    expect(ticks, 'fresh-closure loop never speeds up').toBeGreaterThan(5);
  });
});

describe('speed range', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('snaps to the nearest stop and clamps to [0.1, 20]', async () => {
    const speed = await import('../src/core/speed.js');

    speed.setSpeed(0.4);
    expect(speed.getSpeed()).toBe(0.5);

    speed.setSpeed(6);
    expect(speed.getSpeed()).toBe(5);

    speed.setSpeed(-5);
    expect(speed.getSpeed()).toBe(0.1);

    speed.setSpeed(999);
    expect(speed.getSpeed()).toBe(20);

    expect(speed.formatSpeed(20)).toBe('20');
    expect(speed.formatSpeed(0.5)).toBe('0.5');
  });
});
