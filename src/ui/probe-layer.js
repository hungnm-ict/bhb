import { el, mount } from './dom.js';
import { getCanvas } from '../core/canvas.js';
import { bufferToClient, resolvePoint, getBufferSize } from '../core/coords.js';

/**
 * Probe crosshairs drawn over the canvas.
 *
 * Separate from the step marker layer on purpose: markers answer "what does my
 * preset do", probes answer "did the scaling survive". They appear under
 * different conditions and would only fight over the same node.
 *
 * A crosshair rather than a numbered badge — a probe is aimed at a pixel, and a
 * badge wide enough to hold a number hides the thing being judged.
 *
 * @param {object} deps
 * @param {() => import('../core/probe.js').Probe[]} deps.getProbes
 * @param {() => string} deps.getScaleMode
 * @param {ReturnType<import('./store.js').createUiStore>} deps.store
 */
export function createProbeLayer(deps) {
  /** @type {HTMLElement | null} */
  let layer = null;

  function ensureLayer() {
    if (!layer) {
      layer = mount(el('div', { class: 'bhb-probes' }));
    }
    return layer;
  }

  function crosshairFor(probe, canvas, buffer, rect) {
    const resolved = resolvePoint(probe, buffer, deps.getScaleMode());
    const pos = bufferToClient(canvas, resolved.x, resolved.y, rect);

    return el(
      'div',
      {
        class: 'bhb-probe',
        style: { left: `${pos.clientX}px`, top: `${pos.clientY}px` },
        title: probe.label,
      },
      [el('span', { class: 'bhb-probe__dot', style: { background: probe.hex } })]
    );
  }

  function render() {
    const node = ensureLayer();

    if (!deps.store.probesVisible()) {
      node.style.display = 'none';
      node.replaceChildren();
      return;
    }

    const canvas = getCanvas();
    if (!canvas) {
      node.style.display = 'none';
      return;
    }

    node.style.display = 'block';
    const buffer = getBufferSize(canvas);
    // One layout query for the whole layer, as the marker layer does.
    const rect = canvas.getBoundingClientRect();
    node.replaceChildren(
      ...deps.getProbes().map((probe) => crosshairFor(probe, canvas, buffer, rect))
    );
  }

  return { render };
}
