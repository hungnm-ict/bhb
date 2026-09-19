import {
  realNow,
  realPerformanceNow,
  realSetTimeout,
  realSetInterval,
  realRequestAnimationFrame,
} from './timers.js';
import { SPEED_STEPS } from './constants.js';

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

/**
 * How long a frame may be outstanding before it is assumed the browser has
 * stopped sending them. Generous: a real frame at 30fps is 33ms, and a busy
 * tab can miss several in a row without being occluded.
 */
export const STALL_MS = 250;

/**
 * Frame counters, rolled over a one-second window.
 *
 * Two rates, because the speed hack makes them diverge: `real` is what the
 * browser hands us, `game` is how many times the game's own loop ran. At 10×
 * a healthy run shows ten times as many game frames as real ones; when it
 * does not, the frame budget is the ceiling, not the slider.
 */
const FPS_WINDOW_MS = 1000;
let realFrames = 0;
let gameFrames = 0;
let windowStartedAt = realPerformanceNow();
let rates = { real: 0, game: 0 };

function rollFrameWindow() {
  const elapsed = realPerformanceNow() - windowStartedAt;
  if (elapsed < FPS_WINDOW_MS) {
    return;
  }
  const perSecond = 1000 / elapsed;
  rates = {
    real: Math.round(realFrames * perSecond),
    game: Math.round(gameFrames * perSecond),
  };
  realFrames = 0;
  gameFrames = 0;
  windowStartedAt = realPerformanceNow();
}

/** @returns {{ real: number, game: number }} frames per real second */
export function getFrameRates() {
  rollFrameWindow();
  return rates;
}

/** Set by `installFrameMultiplier`; a no-op until the hack is installed. */
let driveStalledFrame = () => false;

/** Run the game's frame callback by hand if the browser has stopped. */
export function pumpFrame() {
  return driveStalledFrame();
}

let speed = 1;
/** @type {Array<(speed: number) => void>} */
const listeners = [];

export function getSpeed() {
  return speed;
}

/** @param {number} next snapped to the nearest SPEED_STEPS stop */
export function setSpeed(next) {
  const snapped = snapSpeed(next);
  if (snapped === speed) {
    return;
  }
  speed = snapped;
  for (const listener of listeners) {
    listener(speed);
  }
}

/** @param {number} value */
export function snapSpeed(value) {
  return SPEED_STEPS.reduce((best, stop) =>
    Math.abs(stop - value) < Math.abs(best - value) ? stop : best
  );
}

/** The neighbouring stop in a direction, for the hotkeys and the +/- buttons. */
export function stepSpeed(current, direction) {
  const index = speedIndex(current) + direction;
  return SPEED_STEPS[Math.max(0, Math.min(SPEED_STEPS.length - 1, index))];
}

/** The index of a speed among the stops, for a stepped slider. */
export function speedIndex(value) {
  return SPEED_STEPS.indexOf(snapSpeed(value));
}

/** Whole speeds read as "2×", fractional ones keep the single decimal. */
export function formatSpeed(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
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

  /** The frame the browser owes us, and when it last paid one. */
  let waiting = null;
  let lastFrameAt = realPerformanceNow();
  let frameSeq = 0;
  /**
   * The newest frame already run by hand.
   *
   * A frame driven by hand is still queued in the browser, and an occluded
   * window delivers its whole backlog once it is uncovered. Running those would
   * fork the game's loop into two chains re-registering each other — the game
   * would quietly run at double speed. Ids only go up, so one watermark is
   * enough to drop every stale delivery.
   */
  let drivenUpTo = 0;

  window.requestAnimationFrame = function (callback) {
    if (bursting) {
      pending = callback;
      return 1;
    }
    const id = (frameSeq += 1);
    waiting = { id, callback };
    return realRequestAnimationFrame(() => {
      if (id <= drivenUpTo) {
        return;
      }
      lastFrameAt = realPerformanceNow();
      waiting = null;
      realFrames += 1;
      runBurst(callback);
    });
  };

  /**
   * Run the frame the browser has stopped delivering.
   *
   * A window covered edge to edge is marked occluded, and an occluded window
   * stops compositing — which is what drives `requestAnimationFrame`. No amount
   * of lying about `document.hidden` brings it back, because the decision is
   * made below JavaScript. So when a frame is outstanding and none has arrived
   * for a while, the callback is run from here instead.
   *
   * It does nothing while the browser is delivering frames normally, because
   * then no frame is ever outstanding for that long.
   *
   * @returns {boolean} whether a frame had to be driven by hand
   */
  driveStalledFrame = function () {
    if (!waiting || bursting) {
      return false;
    }
    if (realPerformanceNow() - lastFrameAt < STALL_MS) {
      return false;
    }

    const { id, callback } = waiting;
    waiting = null;
    drivenUpTo = id;
    lastFrameAt = realPerformanceNow();
    runBurst(callback);
    return true;
  };

  function runBurst(callback) {
    if (speed <= 1) {
      owed = 0;
      gameFrames += 1;
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
          gameFrames += 1;
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
      // A real frame, and the one the loop rides while boosted: the game
      // re-registered from inside the burst, so it never went back through the
      // patched `requestAnimationFrame` where deliveries are counted.
      realRequestAnimationFrame(() => {
        realFrames += 1;
        runBurst(next);
      });
    }
  }
}
