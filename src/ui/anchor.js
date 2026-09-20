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
export function anchorTopLeft(node) {
  const box = canvasBox();
  if (!box) {
    return false;
  }
  node.style.left = `${Math.round(box.left) + CANVAS_INSET}px`;
  node.style.top = `${Math.round(box.top) + CANVAS_INSET}px`;
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
  node.style.right = `${Math.round(window.innerWidth - box.right) + CANVAS_INSET}px`;
  node.style.top = `${Math.round(box.top) + CANVAS_INSET}px`;
  return true;
}
