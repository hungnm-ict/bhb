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
 * `reentrant` stops a callback that re-registers itself mid-catch-up from
 * scheduling a second real frame; `FRAME_BUDGET_MS` caps the catch-up so a
 * slow frame cannot stall the browser for a whole second.
 */
function installFrameMultiplier() {
  const FRAME_BUDGET_MS = 15;

  /** @type {Map<Function, number>} */
  const credit = new Map();
  let reentrant = false;

  window.requestAnimationFrame = function (callback) {
    if (reentrant) {
      return 1;
    }

    return realRequestAnimationFrame(() => {
      if (!credit.has(callback)) {
        credit.set(callback, 0);
        callback(performance.now());
        return;
      }

      if (speed <= 1) {
        callback(performance.now());
        return;
      }

      let owed = credit.get(callback) + speed;
      const startedAt = realPerformanceNow();

      reentrant = true;
      try {
        while (owed >= 1) {
          try {
            callback(performance.now());
          } catch (error) {
            console.error('[BHB] frame callback threw', error);
          }
          owed -= 1;

          if (realPerformanceNow() - startedAt > FRAME_BUDGET_MS) {
            owed = 0;
            break;
          }
        }
      } finally {
        reentrant = false;
      }

      credit.set(callback, owed);
    });
  };
}
