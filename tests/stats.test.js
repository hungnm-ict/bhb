/**
 * Stats are folded from the engine's own action events, so these tests speak
 * that language: a list of events in, a snapshot out.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createStats, formatDuration } from '../src/core/stats.js';
import { STORAGE_KEY_STATS } from '../src/core/constants.js';

/** A clock the test drives by hand, so durations are exact. */
function fakeClock(start = 1000) {
  let time = start;
  return {
    now: () => time,
    advance: (ms) => {
      time += ms;
    },
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('counting', () => {
  it('counts clicks, resyncs, hangs and flagged drops', () => {
    const stats = createStats({ persist: false });

    stats.record({ kind: 'click', label: 'accept' });
    stats.record({ kind: 'click', label: 'accept' });
    stats.record({ kind: 'busy', label: 'accept' });
    stats.record({ kind: 'resync', label: 'pvp' });
    stats.record({ kind: 'hang', label: 'runAll' });
    stats.record({ kind: 'notify', label: 'legendary' });

    const snapshot = stats.snapshot();
    expect(snapshot.clicks).toBe(2);
    expect(snapshot.resyncs).toBe(1);
    expect(snapshot.hangs).toBe(1);
    expect(snapshot.drops).toBe(1);
  });

  it('credits clicks to the activity Run-All announced', () => {
    const stats = createStats({ persist: false });

    stats.record({ kind: 'task', started: true, label: 'runAll' });
    stats.record({ kind: 'activity', activityId: 'pvp', label: 'PVP', why: 'idle' });
    stats.record({ kind: 'click', label: 'fight' });
    stats.record({ kind: 'activity', activityId: 'raid', label: 'Raid', why: 'idle' });
    stats.record({ kind: 'click', label: 'join' });
    stats.record({ kind: 'click', label: 'join' });

    const { activities } = stats.snapshot();
    expect(activities.pvp.clicks).toBe(1);
    expect(activities.raid.clicks).toBe(2);
    expect(activities.pvp.visits).toBe(1);
  });

  it('blames the activity being left for running out, not the next one', () => {
    const stats = createStats({ persist: false });

    stats.record({ kind: 'activity', activityId: 'pvp', label: 'PVP', why: 'idle' });
    stats.record({
      kind: 'activity',
      activityId: 'raid',
      label: 'Raid',
      why: 'spent',
      spentId: 'pvp',
      spentName: 'PVP',
    });

    const { activities } = stats.snapshot();
    expect(activities.pvp.spent).toBe(1);
    expect(activities.raid.spent).toBe(0);
  });

  it('keeps the highest round reached', () => {
    const stats = createStats({ persist: false });

    stats.record({ kind: 'activity', activityId: 'pvp', label: 'PVP', round: 3 });
    stats.record({ kind: 'activity', activityId: 'raid', label: 'Raid', round: 2 });

    expect(stats.snapshot().rounds).toBe(3);
  });

  it('stops clicks counting against an activity once the task stops', () => {
    const stats = createStats({ persist: false });

    stats.record({ kind: 'task', started: true, label: 'runAll' });
    stats.record({ kind: 'activity', activityId: 'pvp', label: 'PVP' });
    stats.record({ kind: 'task', started: false, label: 'runAll' });
    stats.record({ kind: 'click', label: 'stray' });

    const snapshot = stats.snapshot();
    expect(snapshot.clicks).toBe(1);
    expect(snapshot.activities.pvp.clicks).toBe(0);
  });
});

describe('running time', () => {
  it('sums the stretches a task was switched on', () => {
    const clock = fakeClock();
    const stats = createStats({ persist: false, now: clock.now });

    stats.record({ kind: 'task', started: true, at: clock.now() });
    clock.advance(30000);
    stats.record({ kind: 'task', started: false, at: clock.now() });
    clock.advance(60000);

    expect(stats.snapshot().runningMs).toBe(30000);
  });

  it('includes the stretch still running', () => {
    const clock = fakeClock();
    const stats = createStats({ persist: false, now: clock.now });

    stats.record({ kind: 'task', started: true, at: clock.now() });
    clock.advance(45000);

    expect(stats.snapshot().runningMs).toBe(45000);
  });
});

describe('persistence', () => {
  it('survives a reload, which is what the watchdog does to the page', () => {
    const first = createStats();
    first.record({ kind: 'click', label: 'accept' });
    first.record({ kind: 'click', label: 'accept' });

    expect(createStats().snapshot().clicks).toBe(2);
  });

  it('starts clean when the stored blob is nonsense', () => {
    localStorage.setItem(STORAGE_KEY_STATS, '{"clicks":"lots"');

    expect(createStats().snapshot().clicks).toBe(0);
  });

  it('reset clears the counters and restarts the clock', () => {
    const clock = fakeClock();
    const stats = createStats({ now: clock.now });

    stats.record({ kind: 'click', label: 'accept' });
    clock.advance(5000);
    stats.reset();

    const snapshot = stats.snapshot();
    expect(snapshot.clicks).toBe(0);
    expect(snapshot.startedAt).toBe(clock.now());
    expect(createStats({ now: clock.now }).snapshot().clicks).toBe(0);
  });

  it('keeps timing a task that was running when the counters were reset', () => {
    const clock = fakeClock();
    const stats = createStats({ persist: false, now: clock.now });

    stats.record({ kind: 'task', started: true, at: clock.now() });
    clock.advance(10000);
    stats.reset();
    clock.advance(5000);

    expect(stats.snapshot().runningMs).toBe(5000);
  });
});

describe('formatDuration', () => {
  it('reads at a glance at every scale', () => {
    expect(formatDuration(9000)).toBe('9s');
    expect(formatDuration(252000)).toBe('4m 12s');
    expect(formatDuration(3840000)).toBe('1h 04m');
  });
});
