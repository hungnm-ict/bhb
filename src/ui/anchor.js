import { getCanvas } from '../core/canvas.js';

/**
 * Hanging the overlay off the game rather than off the window.
 *
 * The readouts belong to the picture, so they follow the canvas: the page can
 * put a banner above it, the lock can change its size, and the corners still
 * line up with each other. Pinning to the viewport instead only agreed with
 * the canvas by coincidence, and stopped agreeing the moment anything sat
 * above the game.
 */

/** Every corner readout uses this, which is what keeps them in a row. */
export const CANVAS_INSET = 6;

function canvasBox() {
  const canvas = getCanvas();
  if (!canvas) {
    return null;
  }
  const box = canvas.getBoundingClientRect();
  // A canvas with no box yet is mid-layout; the stylesheet's own corner is a
  // better answer than a position derived from zeroes.
  return box.width > 0 && box.height > 0 ? box : null;
}

/**
 * @param {HTMLElement} node
 * @returns {boolean} whether the canvas was there to hang off
 */
/**
 * The canvas corner, but never past the window's own.
 *
 * The canvas is pinned to a fixed size, so a window narrower than the game
 * scrolls and the canvas runs off the edge. Following it there takes the
 * readouts with it — and a narrow window is exactly when the frame rate and
 * what the bot is doing are the only things worth the space.
 */
function onScreen(offset) {
  return Math.max(CANVAS_INSET, Math.round(offset) + CANVAS_INSET);
}

export function anchorTopLeft(node) {
  const box = canvasBox();
  if (!box) {
    return false;
  }
  node.style.left = `${onScreen(box.left)}px`;
  node.style.top = `${onScreen(box.top)}px`;
  return true;
}

/**
 * @param {HTMLElement} node
 * @returns {boolean} whether the canvas was there to hang off
 */
export function anchorTopRight(node) {
  const box = canvasBox();
  if (!box) {
    return false;
  }
  // Measured from the window's right edge, so the node never needs its own
  // width — which it does not have until after it is laid out.
  node.style.right = `${onScreen(window.innerWidth - box.right)}px`;
  node.style.top = `${onScreen(box.top)}px`;
  return true;
}
