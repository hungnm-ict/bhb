/**
 * Where the mouse last was, in client space.
 *
 * Capture happens on a key press, not a click — the click would land in the
 * game — so whoever handles the key has to know where the user was pointing.
 * Two editors need that same answer, and two listeners for one fact is one
 * listener too many.
 *
 * Capturing (`true`) so a game that stops propagation cannot blind the bot.
 */

let cursorX = null;
let cursorY = null;
let isTracking = false;

export function trackCursor() {
  if (isTracking) {
    return;
  }
  isTracking = true;
  window.addEventListener(
    'mousemove',
    (event) => {
      cursorX = event.clientX;
      cursorY = event.clientY;
    },
    true
  );
}

/** @returns {{ clientX: number, clientY: number } | null} null before any move */
export function getCursor() {
  if (cursorX === null || cursorY === null) {
    return null;
  }
  return { clientX: cursorX, clientY: cursorY };
}
