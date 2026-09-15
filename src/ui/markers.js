import { el, mount } from './dom.js';
import { getCanvas } from '../core/canvas.js';
import { bufferToClient, resolvePoint, getBufferSize, isLegacyPoint } from '../core/coords.js';

/**
 * Rule markers drawn over the canvas.
 *
 * A rule is a screen position; a list of numbers does not say which button it
 * points at. Each marker sits where its rule looks, so a rule aimed at nothing
 * is visible as one.
 *
 * The layer itself never takes pointer events — only the markers do, and only
 * while the rules tab is open. A layer that swallowed clicks would make the
 * game unplayable whenever the bot was running.
 */

/**
 * @param {object} deps
 * @param {() => import('../rules/model.js').Rule[]} deps.getRules
 * @param {() => string} deps.getScaleMode
 * @param {ReturnType<import('./store.js').createUiStore>} deps.store
 */
export function createMarkerLayer(deps) {
  /** @type {HTMLElement | null} */
  let layer = null;
  /** @type {Map<string, HTMLElement>} rule id to its marker, for highlighting */
  const nodes = new Map();

  function ensureLayer() {
    if (!layer) {
      layer = mount(el('div', { class: 'bhb-markers' }));
    }
    return layer;
  }

  function markerFor(rule, index, canvas, buffer, rect) {
    const stored = rule.points[0];
    if (!stored) {
      return null;
    }

    const resolved = resolvePoint(stored, buffer, deps.getScaleMode());
    const pos = bufferToClient(canvas, resolved.x, resolved.y, rect);

    const state = deps.store.get();
    const classes = ['bhb-mark'];
    if (!rule.enabled) {
      classes.push('bhb-mark--off');
    }
    if (isLegacyPoint(stored)) {
      classes.push('bhb-mark--legacy');
    }
    if (state.selectedRuleId === rule.id) {
      classes.push('bhb-mark--selected');
    }
    if (state.hoveredRuleId === rule.id) {
      classes.push('bhb-mark--hovered');
    }

    const node = el(
      'div',
      {
        class: classes.join(' '),
        style: { left: `${pos.clientX}px`, top: `${pos.clientY}px` },
        title: rule.label || rule.hex || '',
      },
      [
        el('span', { class: 'bhb-mark__n', text: String(index + 1) }),
        el('span', { class: 'bhb-mark__swatch', style: { background: rule.hex || 'transparent' } }),
      ]
    );

    node.addEventListener('click', (event) => {
      event.stopPropagation();
      deps.store.selectRule(rule.id);
    });
    node.addEventListener('mouseenter', () => deps.store.hoverRule(rule.id));
    node.addEventListener('mouseleave', () => deps.store.hoverRule(null));

    nodes.set(rule.id, node);
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
      .getRules()
      .map((rule, index) => markerFor(rule, index, canvas, buffer, rect))
      .filter(Boolean);

    node.replaceChildren(...marks);
  }

  /** Lighting a marker is a class change; it never needs the layer rebuilt. */
  function highlight() {
    const state = deps.store.get();
    for (const [ruleId, marker] of nodes) {
      marker.classList.toggle('bhb-mark--selected', state.selectedRuleId === ruleId);
      marker.classList.toggle('bhb-mark--hovered', state.hoveredRuleId === ruleId);
    }
  }

  return { render, highlight };
}
