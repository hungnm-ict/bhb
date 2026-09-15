import { bufferToClient, isInsideCanvas } from './coords.js';
import { realSetTimeout } from './timers.js';
import {
  CLICK_LOCKOUT_MS,
  CLICK_HOVER_RESET_MS,
  HOVER_RESET_POINT,
} from './constants.js';

/**
 * Synthetic input.
 *
 * Unity listens for pointer events on the canvas, so a click is a full
 * pointer/mouse sequence rather than a bare `click`. Events go to the canvas,
 * document and window together because Unity's listener placement varies
 * between builds and a missed target means a silently dead click.
 *
 * Nothing here moves the real cursor — the user keeps their machine.
 */

let locked = false;

/** @type {((clientX: number, clientY: number) => void) | null} */
let clickObserver = null;

/** Notified on every dispatched click, for the on-screen flash. */
export function setClickObserver(observer) {
  clickObserver = observer;
}

function pointerInit(x, y, buttons) {
  return {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    clientX: x,
    clientY: y,
    screenX: window.screenX + x,
    screenY: window.screenY + y,
    button: 0,
    buttons,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    pressure: buttons ? 0.5 : 0,
    width: 1,
    height: 1,
  };
}

function mouseInit(x, y, buttons) {
  return {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    clientX: x,
    clientY: y,
    screenX: window.screenX + x,
    screenY: window.screenY + y,
    button: 0,
    buttons,
    detail: 1,
  };
}

/** The sequence a real mouse produces: approach, press, release, leave. */
const CLICK_SEQUENCE = [
  ['pointerover', 'pointer', 0],
  ['pointerenter', 'pointer', 0],
  ['pointermove', 'pointer', 0],
  ['mouseover', 'mouse', 0],
  ['mousemove', 'mouse', 0],
  ['pointerdown', 'pointer', 1],
  ['mousedown', 'mouse', 1],
  ['pointerup', 'pointer', 0],
  ['mouseup', 'mouse', 0],
  ['click', 'mouse', 0],
  ['pointerout', 'pointer', 0],
  ['pointerleave', 'pointer', 0],
  ['mouseout', 'mouse', 0],
  ['mouseleave', 'mouse', 0],
];

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} clientX
 * @param {number} clientY
 */
export function dispatchClickAt(canvas, clientX, clientY) {
  dispatchSequence(canvas, CLICK_SEQUENCE, clientX, clientY);
}

function dispatchSequence(canvas, sequence, clientX, clientY) {
  const targets = [canvas, document, window];

  for (const [type, family, buttons] of sequence) {
    const Ctor = family === 'pointer' ? PointerEvent : MouseEvent;
    const init =
      family === 'pointer'
        ? pointerInit(clientX, clientY, buttons)
        : mouseInit(clientX, clientY, buttons);

    for (const target of targets) {
      try {
        target.dispatchEvent(new Ctor(type, init));
      } catch {
        // A target that rejects one event type must not abort the sequence.
      }
    }
  }
}

/** Just the approach half of the sequence: hover without pressing anything. */
const MOVE_SEQUENCE = [
  ['pointerover', 'pointer', 0],
  ['pointerenter', 'pointer', 0],
  ['pointermove', 'pointer', 0],
  ['mouseover', 'mouse', 0],
  ['mousemove', 'mouse', 0],
];

/**
 * Move the synthetic pointer somewhere without clicking.
 *
 * The real cursor stays where the user left it — this only changes what the
 * game believes is hovered.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number} clientX
 * @param {number} clientY
 */
export function dispatchMoveTo(canvas, clientX, clientY) {
  dispatchSequence(canvas, MOVE_SEQUENCE, clientX, clientY);
}

/**
 * Park the pointer in the canvas corner so no button keeps a hover highlight —
 * a highlighted button reads as a different colour and would break the next
 * step match.
 *
 * @param {HTMLCanvasElement} canvas
 */
export function resetHover(canvas) {
  const pos = bufferToClient(canvas, HOVER_RESET_POINT.x, HOVER_RESET_POINT.y);
  dispatchMoveTo(canvas, pos.clientX, pos.clientY);
}

/**
 * Click a buffer-space point, if one is not already in flight.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ x: number, y: number }} point buffer space
 * @returns {boolean} false when locked out or the point is off-canvas
 */
export function clickBufferPoint(canvas, point) {
  if (locked) {
    return false;
  }

  const pos = bufferToClient(canvas, point.x, point.y);
  if (!isInsideCanvas(canvas, pos.clientX, pos.clientY)) {
    return false;
  }

  locked = true;
  dispatchClickAt(canvas, pos.clientX, pos.clientY);
  clickObserver?.(pos.clientX, pos.clientY);

  realSetTimeout(() => resetHover(canvas), CLICK_HOVER_RESET_MS);
  realSetTimeout(() => {
    locked = false;
  }, CLICK_LOCKOUT_MS);

  return true;
}
