/**
 * The hours this game's server is known to struggle in.
 *
 * Every day, the same clock times, and the last quarter of each is the worst
 * of it. The bot cannot measure a slow server — the canvas keeps drawing at
 * sixty while the requests behind it hang — so this is the one thing it knows
 * only by being told.
 *
 * Knowing is worth something on its own: asking a browser for fifteen frames
 * per real one during an hour the server is already struggling is how a slow
 * hour becomes a dead one. The speed comes off for the duration.
 *
 * Local clock, because that is the clock the user set these against. Anyone
 * whose machine sits in another timezone edits the list.
 */

/** The three this game is known for. Editable; this is only a starting point. */
export const DEFAULT_LAG_WINDOWS = Object.freeze([
  Object.freeze({ from: '06:00', to: '07:00' }),
  Object.freeze({ from: '14:00', to: '15:00' }),
  Object.freeze({ from: '22:00', to: '23:00' }),
]);

/** @returns {number | null} minutes since midnight, or null if unreadable */
function toMinutes(text) {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(String(text || '').trim());
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

function toClock(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/**
 * @param {unknown} stored
 * @returns {{ from: string, to: string }[]}
 */
export function normaliseLagWindows(stored) {
  if (!Array.isArray(stored)) {
    return DEFAULT_LAG_WINDOWS.map((window) => ({ ...window }));
  }

  const kept = [];
  for (const window of stored) {
    const from = window ? toMinutes(window.from) : null;
    const to = window ? toMinutes(window.to) : null;
    if (from === null || to === null) {
      continue;
    }
    kept.push({ from: toClock(from), to: toClock(to) });
  }
  return kept;
}

/**
 * Is this clock reading inside one of the windows?
 *
 * A window whose end is before its start runs past midnight, which is the
 * only way to say "half eleven until half twelve" on a clock that wraps.
 *
 * @param {Date} when
 * @param {{ from: string, to: string }[]} windows
 * @returns {boolean}
 */
export function isInLagWindow(when, windows) {
  if (!Array.isArray(windows) || windows.length === 0) {
    return false;
  }

  const minutes = when.getHours() * 60 + when.getMinutes();
  for (const window of windows) {
    const from = toMinutes(window.from);
    const to = toMinutes(window.to);
    if (from === null || to === null) {
      continue;
    }
    const isInside = from <= to ? minutes >= from && minutes < to : minutes >= from || minutes < to;
    if (isInside) {
      return true;
    }
  }
  return false;
}

/**
 * Watches the clock and takes the speed off inside a lag window.
 *
 * The speed the user had is remembered rather than guessed at: coming out of
 * an hour at 1x when they went into it at 15x would cost them the rest of the
 * night without saying so. And a speed they set themselves during the hour is
 * theirs — it outranks whatever was remembered.
 *
 * @param {object} deps
 * @param {() => { from: string, to: string }[]} deps.getWindows
 * @param {() => number} deps.getSpeed
 * @param {(speed: number) => void} deps.setSpeed
 * @param {() => Date} [deps.now]
 */
export function createLagGuard(deps) {
  const now = deps.now || (() => new Date());

  let isHolding = false;
  /** The speed to give back, and what we left it at, to spot a hand on it. */
  let restoreTo = null;
  let heldAt = null;

  function check() {
    const inside = isInLagWindow(now(), deps.getWindows());

    if (inside && !isHolding) {
      const current = deps.getSpeed();
      isHolding = true;
      restoreTo = current > 1 ? current : null;
      heldAt = 1;
      if (current > 1) {
        deps.setSpeed(1);
      }
      return;
    }

    if (!inside && isHolding) {
      isHolding = false;
      // Only if nobody touched it since: their hand outranks our memory.
      if (restoreTo !== null && deps.getSpeed() === heldAt) {
        deps.setSpeed(restoreTo);
      }
      restoreTo = null;
      heldAt = null;
    }
  }

  return { check, isHolding: () => isHolding };
}
