/**
 * The watchdog's whole job is to survive a reload without turning into a
 * reload loop, so both halves are pinned here.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWatchdog } from '../src/core/watchdog.js';
import { RESUME_MAX_AGE, MAX_RELOADS, STORAGE_KEY_RESUME } from '../src/core/constants.js';

let clock = 1_000_000;

function build() {
  const reload = vi.fn();
  return { reload, watchdog: createWatchdog({ reload, now: () => clock }) };
}

beforeEach(() => {
  localStorage.clear();
  clock = 1_000_000;
});

describe('resume record', () => {
  it('comes back to the task that was running', () => {
    const { watchdog } = build();
    watchdog.arm('runAll');
    expect(watchdog.taskToResume()).toBe('runAll');
  });

  it('ignores and clears a record the user walked away from', () => {
    const { watchdog } = build();
    watchdog.arm('runAll');

    clock += RESUME_MAX_AGE + 1;
    expect(watchdog.taskToResume()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY_RESUME)).toBeNull();
  });

  it('forgets the task when the user stops it themselves', () => {
    const { watchdog } = build();
    watchdog.arm('script');
    watchdog.disarm();
    expect(watchdog.taskToResume()).toBeNull();
  });

  it('survives a corrupt record rather than throwing', () => {
    localStorage.setItem(STORAGE_KEY_RESUME, '{not json');
    const { watchdog } = build();
    expect(watchdog.taskToResume()).toBeNull();
  });
});

describe('reload streak', () => {
  it('counts consecutive reloads and gives up at the limit', () => {
    const { watchdog, reload } = build();
    watchdog.arm('runAll');

    for (let attempt = 1; attempt <= MAX_RELOADS; attempt += 1) {
      expect(watchdog.recover('runAll')).toBe(true);
      expect(watchdog.reloadCount()).toBe(attempt);
    }

    expect(watchdog.recover('runAll'), 'reloading has stopped helping').toBe(false);
    expect(reload).toHaveBeenCalledTimes(MAX_RELOADS);
    expect(watchdog.taskToResume(), 'nothing to come back to').toBeNull();
  });

  it('clears the streak as soon as the game answers', () => {
    const { watchdog } = build();
    watchdog.arm('runAll');
    watchdog.recover('runAll');
    expect(watchdog.reloadCount()).toBe(1);

    watchdog.noteProgress();
    expect(watchdog.reloadCount()).toBe(0);
    expect(watchdog.taskToResume()).toBe('runAll');
  });

  it('keeps the streak across a reload, because the record is all that survives', () => {
    const first = build();
    first.watchdog.arm('runAll');
    first.watchdog.recover('runAll');

    // A reload is a new page: a new watchdog reading the same localStorage.
    const second = build();
    expect(second.watchdog.reloadCount()).toBe(1);
    expect(second.watchdog.taskToResume()).toBe('runAll');
  });
});
