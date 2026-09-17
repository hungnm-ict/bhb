import { getRenderTarget } from '../core/canvas.js';
import { readPixel } from '../core/pixel.js';
import { rgbToHex } from '../core/color.js';
import { clientToBuffer, getBufferSize, isInsideCanvas } from '../core/coords.js';
import { trackCursor, getCursor } from '../core/cursor.js';
import { createProbe, scoreProbe } from '../core/probe.js';
import { t } from '../i18n/index.js';

/**
 * Capturing and scoring probes.
 *
 * Deliberately thinner than `step-editor.js`: a probe is never clicked, so the
 * hover-settling dance a step needs would only add a colour the button does not
 * show at rest. A probe records the pixel exactly as it looked, hover and all,
 * because what it measures is whether that pixel is still there afterwards.
 *
 * DOM-free, like its siblings.
 *
 * @param {object} deps
 * @param {() => import('../core/probe.js').Probe[]} deps.getProbes
 * @param {(probes: import('../core/probe.js').Probe[]) => void} deps.setProbes
 * @param {(message: string) => void} deps.report
 * @param {() => number} deps.getTolerance
 * @param {() => string} deps.getScaleMode
 * @param {(captured: { probe: object, clientX: number, clientY: number }) => void}
 *   [deps.onCaptured] so the UI can confirm where the user is looking
 */
export function createProbeEditor(deps) {
  trackCursor();

  /** @returns {import('../core/probe.js').Probe | null} */
  function captureAtCursor() {
    const target = getRenderTarget();
    if (!target) {
      deps.report(t('msg.noCanvas'));
      return null;
    }

    const cursor = getCursor();
    if (!cursor) {
      deps.report(t('msg.noMousePosition'));
      return null;
    }
    if (!isInsideCanvas(target.canvas, cursor.clientX, cursor.clientY)) {
      deps.report(t('msg.outsideCanvas'));
      return null;
    }

    const { canvas, gl } = target;
    const point = clientToBuffer(canvas, cursor.clientX, cursor.clientY);
    const pixel = readPixel(gl, point.x, point.y);
    if (!pixel) {
      deps.report(t('msg.noWebgl'));
      return null;
    }

    const buffer = getBufferSize(canvas);
    const probes = deps.getProbes();
    const probe = createProbe({
      x: point.x,
      y: point.y,
      bw: buffer.width,
      bh: buffer.height,
      hex: rgbToHex(pixel),
      label: t('probe.defaultName', { n: probes.length + 1 }),
    });

    deps.setProbes([...probes, probe]);
    if (deps.onCaptured) {
      deps.onCaptured({ probe, clientX: cursor.clientX, clientY: cursor.clientY });
    }
    return probe;
  }

  function remove(probeId) {
    deps.setProbes(deps.getProbes().filter((probe) => probe.id !== probeId));
  }

  function clear() {
    deps.setProbes([]);
  }

  /**
   * Every probe, judged against the framebuffer as it is right now.
   *
   * One `readPixel` per probe, and there are a handful of them — this runs when
   * the settings tab renders, not on the engine's tick.
   *
   * @returns {{ buffer: { width: number, height: number } | null, scores: object[] }}
   */
  function scoreAll() {
    const target = getRenderTarget();
    const probes = deps.getProbes();
    if (!target) {
      return { buffer: null, scores: [] };
    }

    const { canvas, gl } = target;
    const buffer = getBufferSize(canvas);
    const mode = deps.getScaleMode();
    const tolerance = deps.getTolerance();

    const scores = probes.map((probe) => {
      const resolved = scoreProbe(probe, buffer, null, tolerance, mode).resolved;
      const live = readPixel(gl, resolved.x, resolved.y);
      return scoreProbe(probe, buffer, live, tolerance, mode);
    });

    return { buffer, scores };
  }

  return { captureAtCursor, remove, clear, scoreAll };
}
