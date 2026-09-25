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
 *
 * Drawing every marker at once buried the game under numbers, so they appear on
 * demand: the one under the cursor, all of them while pinned, or the list in
 * turn during a dry run, where each carries what the matcher just found.
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
  /** What the last render drew, so a hover can tell a repaint from a relight. */
  let drawnFilter = null;
  let drawnVisible = false;
  /**
   * Which markers were on screen last time.
   *
   * The layer is rebuilt on every tick, so an animation on the marker itself
   * would replay forever. A marker only bounces the first time it appears.
   *
   * @type {Set<string>}
   */
  let drawnIds = new Set();

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
    if (!drawnIds.has(step.id)) {
      classes.push('bhb-mark--arriving');
    }
    if (state.dryRun) {
      const verdict = state.dryRun.scores[step.id];
      if (verdict) {
        classes.push(`bhb-mark--${verdict}`);
      }
      if (deps.getSteps()[state.dryRun.index] === step) {
        classes.push('bhb-mark--testing');
      }
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
      drawnIds = new Set();
      drawnVisible = false;
      drawnFilter = null;
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
    const only = deps.store.markerFilter();
    nodes.clear();
    const marks = deps
      .getSteps()
      .map((step, index) =>
        only !== null && step.id !== only ? null : markerFor(step, index, canvas, buffer, rect)
      )
      .filter(Boolean);

    node.replaceChildren(...marks);
    drawnIds = new Set(nodes.keys());
    drawnFilter = only;
    drawnVisible = true;
  }

  /**
   * Lighting a marker is a class change; it never needs the layer rebuilt —
   * unless the hover is what decides which markers exist, in which case it does.
   */
  function highlight() {
    if (deps.store.markersVisible() !== drawnVisible || deps.store.markerFilter() !== drawnFilter) {
      render();
      return;
    }
    const state = deps.store.get();
    for (const [stepId, marker] of nodes) {
      marker.classList.toggle('bhb-mark--selected', state.selectedStepId === stepId);
      marker.classList.toggle('bhb-mark--hovered', state.hoveredStepId === stepId);
      marker.classList.toggle('bhb-mark--previewing', state.previewStepId === stepId);
    }
  }

  return { render, highlight };
}
