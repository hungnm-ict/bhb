import { getCanvas } from './canvas.js';

/**
 * Pinning the game to a fixed size.
 *
 * The point is not the window — it is that a step's colours only mean the same
 * thing on another machine if the game rendered at the same resolution. Two
 * users at different window sizes read different pixels off the same button.
 *
 * This sets the CSS box and stops there. The game sizes its framebuffer from
 * its container, one to one, so changing what it measures is the whole job.
 *
 * Two things that look like improvements are not, and both were tried:
 *
 *  - Scaling the box down to fit a small window. The game measures itself with
 *    `getBoundingClientRect`, which counts a transform, so it built a
 *    framebuffer the size of the shrunken box and the pin meant nothing.
 *  - Holding `canvas.width` against the game. The buffer then stays pinned, but
 *    the game lays its scene out at the size it believes it has and draws it
 *    into a buffer of another — which comes out as garbled pixels.
 *
 * So a window narrower than the pinned size scrolls. That is the honest cost,
 * and at 640x400 it is a rare one.
 *
 * Off by default. It also costs sharpness, and that is not a trade to make for
 * someone who never shares a step set.
 */

/**
 * The sizes the canvas may be pinned to, smallest first.
 *
 * Every one of them is 1.6 wide, and that is not decoration. A step is stored
 * against the framebuffer it was captured on and resolved onto the live one by
 * proportion, so a set survives a change of size exactly as long as the
 * proportion survives it. Sizes at three different ratios would look like a
 * menu and behave like three incompatible families of step packs.
 */
export const LOCK_SIZES = Object.freeze([
  Object.freeze({ width: 560, height: 350 }),
  Object.freeze({ width: 640, height: 400 }),
  Object.freeze({ width: 800, height: 500 }),
]);

/** The middle one, and what a profile that never chose is pinned to. */
export const LOCK_SIZE = LOCK_SIZES[1];

/**
 * @param {{ width?: unknown, height?: unknown } | null} size
 * @returns {{ width: number, height: number }} one of `LOCK_SIZES`
 */
export function normaliseLockSize(size) {
  const match =
    size &&
    LOCK_SIZES.find(
      (offered) => offered.width === Number(size.width) && offered.height === Number(size.height)
    );
  return match || LOCK_SIZE;
}

/** @type {{ canvas: string, box: string } | null} styles as they were */
let original = null;

/** What is applied, so re-asserting the lock does not churn the layout. */
let applied = null;

function styleTargets() {
  const canvas = getCanvas();
  if (!canvas) {
    return null;
  }
  return { canvas, box: canvas.parentElement };
}

/**
 * @param {{ width: number, height: number }} [size]
 * @returns {boolean} whether it was applied
 */
export function lockCanvasSize(size = LOCK_SIZE) {
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

  const pinned = {
    width: Math.max(320, Math.round(size.width)),
    height: Math.max(240, Math.round(size.height)),
  };

  if (applied && applied.width === pinned.width && applied.height === pinned.height) {
    return true;
  }

  const width = `${pinned.width}px`;
  const height = `${pinned.height}px`;
  if (target.box) {
    target.box.style.width = width;
    target.box.style.height = height;
  }
  target.canvas.style.width = width;
  target.canvas.style.height = height;
  applied = pinned;

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
  applied = null;
  window.dispatchEvent(new Event('resize'));
  return true;
}

export function isCanvasLocked() {
  return original !== null;
}
