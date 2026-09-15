import { STORAGE_KEY_RESUME, RESUME_MAX_AGE, MAX_RELOADS } from './constants.js';
import { realNow } from './timers.js';

/**
 * Surviving a reload.
 *
 * The bot cannot tell a hung WebGL context from an expired session, and both
 * are fixed the same way: reload the page. A reload is a fresh page, so the
 * intent to keep farming has to be written down before it happens and read
 * back on the way in.
 *
 * @typedef {{ task: string, at: number, reloads: number }} ResumeRecord
 */

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RESUME);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed.task !== 'string' || typeof parsed.at !== 'number') {
      return null;
    }
    return { task: parsed.task, at: parsed.at, reloads: Number(parsed.reloads) || 0 };
  } catch (error) {
    console.warn('[BHB] could not read the resume record', error);
    return null;
  }
}

function write(record) {
  try {
    if (record === null) {
      localStorage.removeItem(STORAGE_KEY_RESUME);
    } else {
      localStorage.setItem(STORAGE_KEY_RESUME, JSON.stringify(record));
    }
    return true;
  } catch (error) {
    console.warn('[BHB] could not write the resume record', error);
    return false;
  }
}

/**
 * @param {object} [deps]
 * @param {() => void} [deps.reload] injected so tests do not navigate
 * @param {() => number} [deps.now]
 */
export function createWatchdog(deps = {}) {
  const now = deps.now || realNow;
  const reload = deps.reload || (() => window.location.reload());

  /** Remember what to come back to. Called whenever a task starts. */
  function arm(task) {
    const previous = read();
    write({ task, at: now(), reloads: previous ? previous.reloads : 0 });
  }

  /** The user stopped the task themselves, so there is nothing to come back to. */
  function disarm() {
    write(null);
  }

  /** A click means the game is alive, so the reload streak is over. */
  function noteProgress() {
    const record = read();
    if (record && record.reloads !== 0) {
      write({ ...record, reloads: 0 });
    }
  }

  /**
   * The task to resume on boot, or null.
   *
   * A stale record is a session the user walked away from; resuming that would
   * start the bot behind their back.
   */
  function taskToResume() {
    const record = read();
    if (!record) {
      return null;
    }
    if (now() - record.at > RESUME_MAX_AGE) {
      write(null);
      return null;
    }
    return record.task;
  }

  function reloadCount() {
    const record = read();
    return record ? record.reloads : 0;
  }

  /**
   * Recover from a hang.
   *
   * @param {string} task the task that was running
   * @returns {boolean} false when reloading has stopped helping
   */
  function recover(task) {
    const record = read();
    const reloads = (record ? record.reloads : 0) + 1;

    // If reloading did not help twice, it will not help the third time.
    if (reloads > MAX_RELOADS) {
      write(null);
      return false;
    }

    write({ task, at: now(), reloads });
    reload();
    return true;
  }

  return { arm, disarm, noteProgress, taskToResume, reloadCount, recover };
}
