/**
 * Every hotkey, in one place.
 *
 * They were spelled out separately in the handler, the task tiles, the capture
 * button and the keyboard reference, which is four chances for the panel to
 * promise a key that does nothing.
 *
 * Letters rather than digits: the handler consumes what it binds, and the game
 * listens for number keys — so the old bindings took `3` through `6` away from
 * it. A letter can still collide with a shortcut of the game's own, so these
 * stay clear of the movement cluster.
 */
export const Keys = Object.freeze({
  PANEL: '`',
  CLOSE_PANEL: 'Escape',
  SCRIPT: 'c',
  RUN_ALL: 'a',
  CAPTURE: 'x',
  SPEED_RESET: '0',
  SPEED_UP: '=',
  SPEED_UP_ALT: '+',
  SPEED_DOWN: '-',
});

/** How a key is shown on a cap: a letter reads better upper case. */
export function keyLabel(key) {
  return key.length === 1 ? key.toUpperCase() : key;
}
