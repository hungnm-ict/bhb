import { getRenderTarget } from '../core/canvas.js';
import { readPixel } from '../core/pixel.js';
import { rgbToHex } from '../core/color.js';
import { clientToBuffer, isInsideCanvas, getBufferSize } from '../core/coords.js';
import { createRule } from './model.js';
import { t } from '../i18n/index.js';

/**
 * Add-rule mode.
 *
 * Capturing is two steps on purpose: position first, colour second. The cursor
 * sitting on a button usually lights it up, so the colour must be sampled only
 * once the user has moved away — otherwise every rule stores the hover shade
 * and never matches at rest.
 *
 * Each captured point records the framebuffer size it was taken at, which is
 * what lets the point be rescaled later on a different window or DPI.
 */

/**
 * @param {object} deps
 * @param {() => import('./model.js').Rule[]} deps.getRules
 * @param {() => void} deps.persist
 * @param {(message: string) => void} deps.report
 * @param {{ showPendingMarker: Function, removePendingMarker: Function }} deps.markers
 */
export function createRuleCapture(deps) {
  let active = false;
  let cursorX = null;
  let cursorY = null;

  window.addEventListener(
    'mousemove',
    (event) => {
      cursorX = event.clientX;
      cursorY = event.clientY;
    },
    true
  );

  function toggle() {
    active = !active;
    deps.report(
      active
        ? t('msg.addModeOn')
        : t('msg.addModeOff', { n: deps.getRules().length })
    );
    return active;
  }

  function savePosition() {
    const target = getRenderTarget();
    if (!target) {
      deps.report(t('msg.noCanvas'));
      return;
    }
    if (cursorX === null || cursorY === null) {
      deps.report(t('msg.noMousePosition'));
      return;
    }
    if (!isInsideCanvas(target.canvas, cursorX, cursorY)) {
      deps.report(t('msg.outsideCanvas'));
      return;
    }

    const point = clientToBuffer(target.canvas, cursorX, cursorY);
    const buffer = getBufferSize(target.canvas);

    const rules = deps.getRules();
    rules.push(
      createRule({ points: [{ ...point, bw: buffer.width, bh: buffer.height }] })
    );
    deps.persist();

    deps.markers.showPendingMarker(point.x, point.y);
    deps.report(
      t('msg.positionSaved', { n: rules.length, x: point.x, y: point.y })
    );
  }

  function saveColor() {
    const target = getRenderTarget();
    if (!target) {
      deps.report(t('msg.noCanvas'));
      return;
    }

    const rules = deps.getRules();
    if (rules.length === 0) {
      deps.report(t('msg.noRuleToColor'));
      return;
    }

    const rule = rules[rules.length - 1];
    if (rule.hex) {
      deps.report(t('msg.colorAlreadySet', { n: rules.length, hex: rule.hex }));
      return;
    }

    const stored = rule.points[0];
    const pixel = readPixel(target.gl, stored.x, stored.y);
    if (!pixel) {
      deps.report(t('msg.noWebgl'));
      return;
    }

    rule.hex = rgbToHex(pixel);
    deps.persist();

    deps.markers.removePendingMarker();
    deps.report(t('msg.colorSaved', { n: rules.length, hex: rule.hex }));
  }

  function deleteLast() {
    const rules = deps.getRules();
    if (rules.length === 0) {
      deps.report(t('msg.noRuleToDelete'));
      return;
    }

    const removed = rules.pop();
    deps.persist();

    if (!removed.hex) {
      deps.markers.removePendingMarker();
    }
    deps.report(t('msg.ruleDeleted'));
  }

  return { toggle, savePosition, saveColor, deleteLast, isActive: () => active };
}
