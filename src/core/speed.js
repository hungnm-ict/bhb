import {
  realNow,
  realPerformanceNow,
  realSetTimeout,
  realSetInterval,
  realRequestAnimationFrame,
} from './timers.js';
import { SPEED_MIN, SPEED_MAX } from './constants.js';

/**
 * Speed hack.
 *
 * The game drives itself off wall-clock time and animation frames, so running
 * it faster means lying about both: clocks advance by `speed` times the real
 * delta, timers fire `speed` times sooner, and each animation frame invokes
 * the game's callback `speed` times instead of once.
 *
 * Clocks are advanced by accumulated deltas rather than multiplying the
 * absolute time, so changing speed mid-session never makes time jump or run
 * backwards — which would break the game's own interpolation.
 */

let speed = 1;
/** @type {Array<(speed: number) => void>} */
const listeners = [];

export function getSpeed() {
  return speed;
}

/** @param {number} next clamped into [SPEED_MIN, SPEED_MAX] */
export function setSpeed(next) {
  const clamped = Math.max(SPEED_MIN, Math.min(SPEED_MAX, Math.round(next)));
  if (clamped === speed) {
    return;
  }
  speed = clamped;
  for (const listener of listeners) {
    listener(speed);
  }
}

/** @param {(speed: number) => void} listener */
export function onSpeedChange(listener) {
  listeners.push(listener);
}

/** Builds a clock that accumulates scaled deltas from a real clock. */
function createVirtualClock(readReal) {
  let virtual = null;
  let previous = null;

  return function read() {
    const real = readReal();
    if (virtual === null) {
      virtual = real;
      previous = real;
      return virtual;
    }
    virtual += (real - previous) * speed;
    previous = real;
    return virtual;
  };
}

export function installSpeedHack() {
  const virtualDateNow = createVirtualClock(realNow);
  const virtualPerformanceNow = createVirtualClock(realPerformanceNow);

  Date.now = () => Math.floor(virtualDateNow());
  performance.now = () => virtualPerformanceNow();

  window.setTimeout = (handler, delay = 0, ...args) =>
    realSetTimeout(handler, delay / speed, ...args);

  window.setInterval = (handler, delay = 0, ...args) =>
    realSetInterval(handler, delay / speed, ...args);

  installFrameMultiplier();
}

/**
 * Run the game's frame callback several times per real frame.
 *
 * A game loop re-registers itself from inside its own callback, and Unity
 * hands `requestAnimationFrame` a fresh closure every frame. So the burst
 * cannot key anything on callback identity, and it must not swallow the
 * re-registration outright: the last callback registered during a burst is
 * what gets the single real frame scheduled at the end of it. Drop that and
 * the loop simply stops.
 *
 * `FRAME_BUDGET_MS` caps the catch-up so a slow frame cannot stall the
 * browser; `owed` carries the remainder into the next frame.
 */
function installFrameMultiplier() {
  const FRAME_BUDGET_MS = 15;

  /** Callback registered from inside the current burst. */
  let pending = null;
  let bursting = false;
  let owed = 0;

  window.requestAnimationFrame = function (callback) {
    if (bursting) {
      pending = callback;
      return 1;
    }
    return realRequestAnimationFrame(() => runBurst(callback));
  };

  function runBurst(callback) {
    if (speed <= 1) {
      owed = 0;
      callback(performance.now());
      return;
    }

    owed += speed;
    const startedAt = realPerformanceNow();

    pending = null;
    bursting = true;
    try {
      while (owed >= 1) {
        const next = pending;
        pending = null;
        const current = next || callback;

        try {
          current(performance.now());
        } catch (error) {
          console.error('[BHB] frame callback threw', error);
        }
        owed -= 1;

        // A loop that stopped re-registering has ended; do not keep calling it.
        if (!pending) {
          break;
        }
        if (realPerformanceNow() - startedAt > FRAME_BUDGET_MS) {
          owed = 0;
          break;
        }
      }
    } finally {
      bursting = false;
    }

    if (pending) {
      const next = pending;
      pending = null;
      realRequestAnimationFrame(() => runBurst(next));
    }
  }
}
