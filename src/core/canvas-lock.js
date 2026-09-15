import { getCanvas } from './canvas.js';

/**
 * Pinning the game to a fixed size.
 *
 * The point is not the window — it is that a step's colours only mean the same
 * thing on another machine if the game rendered at the same resolution. Two
 * users at different window sizes read different pixels off the same button.
 *
 * This sets the CSS box rather than fighting `canvas.width`: the game reads its
 * container and sizes the framebuffer to match, one to one, so changing what it
 * reads is enough. Hijacking the property instead would have the game trying to
 * resize on every layout change and losing, every frame.
 *
 * Off by default. It costs sharpness — the game renders at the pinned size and
 * the browser scales the result — and that is not a trade to make for someone
 * who never shares a step set.
 */

/** Sizes offered in the UI; anything else is typed in. */
export const LOCK_PRESETS = [
  { width: 800, height: 520 },
  { width: 1024, height: 640 },
  { width: 1280, height: 720 },
];

/** @type {{ canvas: string, box: string } | null} styles as they were */
let original = null;

function styleTargets() {
  const canvas = getCanvas();
  if (!canvas) {
    return null;
  }
  return { canvas, box: canvas.parentElement };
}

/**
 * @param {{ width: number, height: number }} size
 * @returns {boolean} whether it was applied
 */
export function lockCanvasSize(size) {
  const target = styleTargets();
  if (!target) {
    return false;
  }

  if (!original) {
    original = {
      canvas: target.canvas.style.cssText,
      box: target.box ? target.box.style.cssText : '',
    };
  }

  const width = `${Math.max(320, Math.round(size.width))}px`;
  const height = `${Math.max(240, Math.round(size.height))}px`;

  if (target.box) {
    target.box.style.width = width;
    target.box.style.height = height;
  }
  target.canvas.style.width = width;
  target.canvas.style.height = height;

  // The game only resizes its framebuffer when it hears about it.
  window.dispatchEvent(new Event('resize'));
  return true;
}

/** Put the page back the way it was found. */
export function unlockCanvasSize() {
  const target = styleTargets();
  if (!target || !original) {
    return false;
  }
  target.canvas.style.cssText = original.canvas;
  if (target.box) {
    target.box.style.cssText = original.box;
  }
  original = null;
  window.dispatchEvent(new Event('resize'));
  return true;
}

export function isCanvasLocked() {
  return original !== null;
}
