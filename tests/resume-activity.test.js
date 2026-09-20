/**
 * Coming back to the right activity after a reload.
 *
 * A solo run is a task plus the activity it is running. Remembering only the
 * task brings the bot back as "solo, nothing in particular": `soloSteps()` is
 * `state.activity ? … : []`, so it wakes up with an empty step list and spins
 * until auto-stop, while the Run toggle reads as off because the activity it
 * compares against is missing.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createWatchdog } from '../src/core/watchdog.js';
import { STORAGE_KEY_RESUME } from '../src/core/constants.js';

let clock = 1_000_000;

function build() {
  return createWatchdog({ now: () => clock, reload: () => {} });
}

beforeEach(() => {
  clock = 1_000_000;
  localStorage.clear();
});

describe('what a reload comes back to', () => {
  it('remembers the activity a solo run was on', () => {
    const watchdog = build();
    watchdog.arm('solo', 'dungeon');

    expect(watchdog.taskToResume()).toEqual({ task: 'solo', activity: 'dungeon' });
  });

  it('has no activity for a run that never had one', () => {
    const watchdog = build();
    watchdog.arm('runAll');

    expect(watchdog.taskToResume()).toEqual({ task: 'runAll', activity: null });
  });

  it('carries the activity across a recovery reload', () => {
    const watchdog = build();
    watchdog.arm('solo', 'worldbossteam');

    expect(watchdog.recover('solo', 'worldbossteam')).toBe(true);
    expect(watchdog.taskToResume()).toEqual({ task: 'solo', activity: 'worldbossteam' });
  });

  it('keeps the reload streak while it does so', () => {
    const watchdog = build();
    watchdog.arm('solo', 'raid');

    watchdog.recover('solo', 'raid');
    expect(watchdog.reloadCount()).toBe(1);
    expect(watchdog.taskToResume().activity).toBe('raid');
  });

  it('reads a record written before activities were remembered', () => {
    // An older build wrote the task alone; that must still resume, not throw.
    localStorage.setItem(
      STORAGE_KEY_RESUME,
      JSON.stringify({ task: 'runAll', at: clock, reloads: 0 })
    );

    expect(build().taskToResume()).toEqual({ task: 'runAll', activity: null });
  });

  it('still refuses a record the user walked away from', () => {
    const watchdog = build();
    watchdog.arm('solo', 'dungeon');
    clock += 60 * 60 * 1000;

    expect(watchdog.taskToResume()).toBeNull();
  });
});
