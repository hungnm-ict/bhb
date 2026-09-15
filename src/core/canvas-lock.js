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
 * A window smaller than the pinned size would leave the page scrolling and part
 * of the game out of reach, so the box is scaled down to fit. The framebuffer is
 * untouched by that: `transform` changes the element's client rect, and both
 * coordinate conversions already work from that rect, so clicks and captures
 * land where they did.
 *
 * Off by default. It costs sharpness — the game renders at the pinned size and
 * the browser scales the result — and that is not a trade to make for someone
 * who never shares a step set.
 */

/**
 * The one pinned size.
 *
 * A single size is the point: a step set is only shareable because everyone who
 * captured it was looking at the same pixels. A menu of sizes would quietly
 * split the packs into incompatible families.
 */
export const LOCK_SIZE = Object.freeze({ width: 640, height: 400 });

/** @type {{ canvas: string, box: string } | null} styles as they were */
let original = null;

/**
 * What is applied right now.
 *
 * Re-applying tells the game to resize, the game resizing wakes the observer,
 * and the observer re-applies: without this the lock would drive itself in a
 * circle. Nothing is written unless something actually differs.
 *
 * @type {{ width: number, height: number, scale: number } | null}
 */
let applied = null;

function styleTargets() {
  const canvas = getCanvas();
  if (!canvas) {
    return null;
  }
  return { canvas, box: canvas.parentElement };
}

/** Never magnify: past 1 the game would be upscaled for no reason. */
export function fitScale(size, viewport) {
  const scale = Math.min(viewport.width / size.width, viewport.height / size.height, 1);
  return Math.max(0.2, Number(scale.toFixed(4)));
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
  const width = `${pinned.width}px`;
  const height = `${pinned.height}px`;

  if (target.box) {
    target.box.style.width = width;
    target.box.style.height = height;
  }
  target.canvas.style.width = width;
  target.canvas.style.height = height;

  const scale = fitScale(pinned, {
    width: window.innerWidth,
    height: window.innerHeight,
  });
  // Scaling the box, not the canvas: the canvas is what the game measures to
  // size its framebuffer, and a transform on it would be measured too.
  const scaled = target.box || target.canvas;

  if (
    applied &&
    applied.width === pinned.width &&
    applied.height === pinned.height &&
    applied.scale === scale
  ) {
    return true;
  }

  scaled.style.transform = scale < 1 ? `scale(${scale})` : '';
  scaled.style.transformOrigin = 'top left';
  applied = { ...pinned, scale };

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
