import { getRenderTarget } from '../core/canvas.js';
import { readPixel } from '../core/pixel.js';
import { rgbToHex, colorMatches } from '../core/color.js';
import { dispatchMoveTo } from '../core/input.js';
import {
  clientToBuffer,
  bufferToClient,
  isInsideCanvas,
  getBufferSize,
} from '../core/coords.js';
import { realRequestAnimationFrame } from '../core/timers.js';
import { HOVER_RESET_POINT } from '../core/constants.js';
import { createStep } from './step.js';
import { t } from '../i18n/index.js';

/**
 * Every mutation a step can undergo: capture, rename, enable, delete, reorder.
 *
 * Capture is one action. The old flow made the user move the mouse away before
 * sampling, because a hovered button is lit and stores the wrong colour. The
 * synthetic pointer does that instead: it is parked in a corner, the game
 * redraws, the resting colour is read, and the pointer goes back. The user's
 * real cursor never moves.
 *
 * Both shades are kept — resting as the step's colour, hovered as a second
 * point with its own. The bot's own click leaves a button highlighted for a
 * moment, and a step that only knows the resting shade misses it.
 */

/** Frames to let the game repaint after the synthetic pointer moves. */
const REPAINT_FRAMES = 2;

/** Give up waiting for a still colour after this many frames (~330ms). */
const SETTLE_MAX_FRAMES = 20;

/** Two reads this close apart are the same colour, not a fade still running. */
const SETTLE_TOLERANCE = 4;

function nextFrame() {
  return new Promise((resolve) => realRequestAnimationFrame(() => resolve()));
}

/**
 * Read a pixel once it stops changing.
 *
 * A fixed two-frame wait assumes the highlight vanishes the instant the pointer
 * leaves. Plenty of buttons fade out over a few hundred milliseconds instead,
 * and the colour captured mid-fade belongs to neither state — the step then
 * matches nothing. Some icons animate on their own and never settle at all,
 * which is worth saying out loud rather than storing a frame at random.
 *
 * @returns {Promise<{ pixel: import('../core/color.js').Rgb | null, isSettled: boolean }>}
 */
async function readSettledPixel(gl, point) {
  let previous = null;

  for (let frame = 0; frame < SETTLE_MAX_FRAMES; frame += 1) {
    await nextFrame();
    const pixel = readPixel(gl, point.x, point.y);
    if (!pixel) {
      return { pixel: null, isSettled: false };
    }
    if (
      previous &&
      frame + 1 >= REPAINT_FRAMES &&
      colorMatches(pixel, previous, SETTLE_TOLERANCE)
    ) {
      return { pixel, isSettled: true };
    }
    previous = pixel;
  }

  return { pixel: previous, isSettled: false };
}

/**
 * @param {object} deps
 * @param {() => import('./step.js').Step[]} deps.getSteps
 * @param {() => void} deps.persist
 * @param {(message: string) => void} deps.report
 * @param {(captured: { step: object, clientX: number, clientY: number,
 *   isSettled: boolean }) => void} [deps.onCaptured] so the UI can confirm the
 *   capture where the user is looking; this module stays DOM-free
 */
export function createStepEditor(deps) {
  let cursorX = null;
  let cursorY = null;
  let capturing = false;

  window.addEventListener(
    'mousemove',
    (event) => {
      cursorX = event.clientX;
      cursorY = event.clientY;
    },
    true
  );

  /**
   * Capture a step at the current cursor position.
   * @returns {Promise<import('./step.js').Step | null>}
   */
  async function captureAtCursor() {
    // A second capture mid-flight would move the pointer out from under the
    // first one's colour read.
    if (capturing) {
      return null;
    }

    const target = getRenderTarget();
    if (!target) {
      deps.report(t('msg.noCanvas'));
      return null;
    }
    if (cursorX === null || cursorY === null) {
      deps.report(t('msg.noMousePosition'));
      return null;
    }
    if (!isInsideCanvas(target.canvas, cursorX, cursorY)) {
      deps.report(t('msg.outsideCanvas'));
      return null;
    }

    capturing = true;
    try {
      const { canvas, gl } = target;
      const point = clientToBuffer(canvas, cursorX, cursorY);
      const buffer = getBufferSize(canvas);

      const hovered = readPixel(gl, point.x, point.y);

      const corner = bufferToClient(canvas, HOVER_RESET_POINT.x, HOVER_RESET_POINT.y);
      dispatchMoveTo(canvas, corner.clientX, corner.clientY);

      const settled = await readSettledPixel(gl, point);
      const resting = settled.pixel;
      dispatchMoveTo(canvas, cursorX, cursorY);

      if (!resting) {
        deps.report(t('msg.noWebgl'));
        return null;
      }

      const size = { bw: buffer.width, bh: buffer.height };
      const restingHex = rgbToHex(resting);
      const hoveredHex = hovered ? rgbToHex(hovered) : null;

      const points = [{ ...point, ...size }];
      if (hoveredHex && hoveredHex !== restingHex) {
        points.push({ ...point, ...size, hex: hoveredHex });
      }

      const steps = deps.getSteps();
      const step = createStep({
        label: t('step.defaultLabel', { n: steps.length + 1 }),
        points,
        hex: restingHex,
      });
      steps.push(step);
      deps.persist();

      deps.report(
        settled.isSettled
          ? t('msg.stepCaptured', { x: point.x, y: point.y, hex: restingHex })
          : t('msg.stepUnstable', { x: point.x, y: point.y, hex: restingHex })
      );
      if (deps.onCaptured) {
        deps.onCaptured({ step, clientX: cursorX, clientY: cursorY, isSettled: settled.isSettled });
      }
      return step;
    } finally {
      capturing = false;
    }
  }

  function find(stepId) {
    return deps.getSteps().find((step) => step.id === stepId) || null;
  }

  function rename(stepId, label) {
    const step = find(stepId);
    if (!step) {
      return;
    }
    step.label = label;
    deps.persist();
  }

  function setEnabled(stepId, enabled) {
    const step = find(stepId);
    if (!step) {
      return;
    }
    step.enabled = enabled;
    deps.persist();
  }

  /** A step with no screens fires anywhere, which is the default. */
  function setScreens(stepId, screenIds) {
    const step = find(stepId);
    if (!step) {
      return;
    }
    step.screens = screenIds;
    deps.persist();
  }

  /** Which Run-All slot a step belongs to; null leaves it in the Script set. */
  function setActivity(stepId, activityId) {
    const step = find(stepId);
    if (!step) {
      return;
    }
    step.activity = activityId;
    deps.persist();
  }

  function remove(stepId) {
    const steps = deps.getSteps();
    const index = steps.findIndex((step) => step.id === stepId);
    if (index === -1) {
      return;
    }
    steps.splice(index, 1);
    deps.persist();
  }

  /** Order is priority: the first matching step wins, so moving matters. */
  function move(stepId, delta) {
    const steps = deps.getSteps();
    const from = steps.findIndex((step) => step.id === stepId);
    const to = from + delta;
    if (from === -1 || to < 0 || to >= steps.length) {
      return;
    }
    const [step] = steps.splice(from, 1);
    steps.splice(to, 0, step);
    deps.persist();
  }

  return {
    captureAtCursor,
    rename,
    setEnabled,
    setScreens,
    setActivity,
    remove,
    move,
  };
}
