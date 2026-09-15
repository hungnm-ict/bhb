import { getRenderTarget } from '../core/canvas.js';
import { readPixel } from '../core/pixel.js';
import { rgbToHex } from '../core/color.js';
import { dispatchMoveTo } from '../core/input.js';
import {
  clientToBuffer,
  bufferToClient,
  isInsideCanvas,
  getBufferSize,
} from '../core/coords.js';
import { realRequestAnimationFrame } from '../core/timers.js';
import { HOVER_RESET_POINT } from '../core/constants.js';
import { createRule } from './model.js';
import { t } from '../i18n/index.js';

/**
 * Every mutation a rule can undergo: capture, rename, enable, delete, reorder.
 *
 * Capture is one action. The old flow made the user move the mouse away before
 * sampling, because a hovered button is lit and stores the wrong colour. The
 * synthetic pointer does that instead: it is parked in a corner, the game
 * redraws, the resting colour is read, and the pointer goes back. The user's
 * real cursor never moves.
 *
 * Both shades are kept — resting as the rule's colour, hovered as a second
 * point with its own. The bot's own click leaves a button highlighted for a
 * moment, and a rule that only knows the resting shade misses it.
 */

/** Frames to let the game repaint after the synthetic pointer moves. */
const REPAINT_FRAMES = 2;

function nextFrame() {
  return new Promise((resolve) => realRequestAnimationFrame(() => resolve()));
}

/**
 * @param {object} deps
 * @param {() => import('./model.js').Rule[]} deps.getRules
 * @param {() => void} deps.persist
 * @param {(message: string) => void} deps.report
 */
export function createRuleEditor(deps) {
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
   * Capture a rule at the current cursor position.
   * @returns {Promise<import('./model.js').Rule | null>}
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
      for (let i = 0; i < REPAINT_FRAMES; i += 1) {
        await nextFrame();
      }

      const resting = readPixel(gl, point.x, point.y);
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

      const rules = deps.getRules();
      const rule = createRule({
        label: t('rule.defaultLabel', { n: rules.length + 1 }),
        points,
        hex: restingHex,
      });
      rules.push(rule);
      deps.persist();

      deps.report(t('msg.ruleCaptured', { x: point.x, y: point.y, hex: restingHex }));
      return rule;
    } finally {
      capturing = false;
    }
  }

  function find(ruleId) {
    return deps.getRules().find((rule) => rule.id === ruleId) || null;
  }

  function rename(ruleId, label) {
    const rule = find(ruleId);
    if (!rule) {
      return;
    }
    rule.label = label;
    deps.persist();
  }

  function setEnabled(ruleId, enabled) {
    const rule = find(ruleId);
    if (!rule) {
      return;
    }
    rule.enabled = enabled;
    deps.persist();
  }

  /** A rule with no screens fires anywhere, which is the default. */
  function setScreens(ruleId, screenIds) {
    const rule = find(ruleId);
    if (!rule) {
      return;
    }
    rule.screens = screenIds;
    deps.persist();
  }

  function remove(ruleId) {
    const rules = deps.getRules();
    const index = rules.findIndex((rule) => rule.id === ruleId);
    if (index === -1) {
      return;
    }
    rules.splice(index, 1);
    deps.persist();
  }

  /** Order is priority: the first matching rule wins, so moving matters. */
  function move(ruleId, delta) {
    const rules = deps.getRules();
    const from = rules.findIndex((rule) => rule.id === ruleId);
    const to = from + delta;
    if (from === -1 || to < 0 || to >= rules.length) {
      return;
    }
    const [rule] = rules.splice(from, 1);
    rules.splice(to, 0, rule);
    deps.persist();
  }

  return {
    captureAtCursor,
    rename,
    setEnabled,
    setScreens,
    remove,
    move,
  };
}
