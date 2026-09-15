import { el, mount } from './dom.js';
import { getCanvas } from '../core/canvas.js';
import { bufferToClient, resolvePoint, getBufferSize, isLegacyPoint } from '../core/coords.js';

/**
 * Step markers drawn over the canvas.
 *
 * A step is a screen position; a list of numbers does not say which button it
 * points at. Each marker sits where its step looks, so a step aimed at nothing
 * is visible as one.
 *
 * The layer itself never takes pointer events — only the markers do, and only
 * while the steps tab is open. A layer that swallowed clicks would make the
 * game unplayable whenever the bot was running.
 */

/**
 * @param {object} deps
 * @param {() => import('../bot/step.js').Step[]} deps.getSteps
 * @param {() => string} deps.getScaleMode
 * @param {ReturnType<import('./store.js').createUiStore>} deps.store
 */
export function createMarkerLayer(deps) {
  /** @type {HTMLElement | null} */
  let layer = null;
  /** @type {Map<string, HTMLElement>} step id to its marker, for highlighting */
  const nodes = new Map();

  function ensureLayer() {
    if (!layer) {
      layer = mount(el('div', { class: 'bhb-markers' }));
    }
    return layer;
  }

  function markerFor(step, index, canvas, buffer, rect) {
    const stored = step.points[0];
    if (!stored) {
      return null;
    }

    const resolved = resolvePoint(stored, buffer, deps.getScaleMode());
    const pos = bufferToClient(canvas, resolved.x, resolved.y, rect);

    const state = deps.store.get();
    const classes = ['bhb-mark'];
    if (!step.enabled) {
      classes.push('bhb-mark--off');
    }
    if (isLegacyPoint(stored)) {
      classes.push('bhb-mark--legacy');
    }
    if (state.selectedStepId === step.id) {
      classes.push('bhb-mark--selected');
    }
    if (state.hoveredStepId === step.id) {
      classes.push('bhb-mark--hovered');
    }

    const node = el(
      'div',
      {
        class: classes.join(' '),
        style: { left: `${pos.clientX}px`, top: `${pos.clientY}px` },
        title: step.label || step.hex || '',
      },
      [
        el('span', { class: 'bhb-mark__n', text: String(index + 1) }),
        el('span', { class: 'bhb-mark__swatch', style: { background: step.hex || 'transparent' } }),
      ]
    );

    node.addEventListener('click', (event) => {
      event.stopPropagation();
      deps.store.selectStep(step.id);
    });
    node.addEventListener('mouseenter', () => deps.store.hoverStep(step.id));
    node.addEventListener('mouseleave', () => deps.store.hoverStep(null));

    nodes.set(step.id, node);
    return node;
  }

  function render() {
    const node = ensureLayer();

    if (!deps.store.markersVisible()) {
      node.style.display = 'none';
      node.replaceChildren();
      nodes.clear();
      return;
    }

    const canvas = getCanvas();
    if (!canvas) {
      node.style.display = 'none';
      return;
    }

    node.style.display = 'block';
    const buffer = getBufferSize(canvas);
    // One layout query for the whole layer, not one per marker.
    const rect = canvas.getBoundingClientRect();
    nodes.clear();
    const marks = deps
      .getSteps()
      .map((step, index) => markerFor(step, index, canvas, buffer, rect))
      .filter(Boolean);

    node.replaceChildren(...marks);
  }

  /** Lighting a marker is a class change; it never needs the layer rebuilt. */
  function highlight() {
    const state = deps.store.get();
    for (const [stepId, marker] of nodes) {
      marker.classList.toggle('bhb-mark--selected', state.selectedStepId === stepId);
      marker.classList.toggle('bhb-mark--hovered', state.hoveredStepId === stepId);
    }
  }

  return { render, highlight };
}
