import { el, mount } from './dom.js';
import { getCanvas } from '../core/canvas.js';
import { t } from '../i18n/index.js';

/**
 * The live canvas size, parked in a corner.
 *
 * Two numbers matter and they are not the same one: the framebuffer the bot
 * reads pixels from, and the CSS box the game is drawn into. When steps start
 * missing, this line is what says whether the framebuffer moved under them.
 *
 * It never takes pointer events — it sits over the game, and a readout that
 * swallowed a click would be worse than no readout.
 */
export function createSizeBadge(deps) {
  /** @type {HTMLElement | null} */
  let node = null;

  function ensureNode() {
    if (!node) {
      node = mount(el('div', { class: 'bhb-size bhb-mono' }));
    }
    return node;
  }

  function render() {
    const target = ensureNode();
    const canvas = getCanvas();

    if (!deps.isVisible() || !canvas) {
      target.style.display = 'none';
      return;
    }

    target.style.display = 'block';
    const clientWidth = Math.round(canvas.clientWidth);
    const clientHeight = Math.round(canvas.clientHeight);
    const sameSize = clientWidth === canvas.width && clientHeight === canvas.height;

    // Showing one number twice only invites the question of what the second
    // one is; the arrow form appears when the two actually differ.
    target.textContent = sameSize
      ? `${canvas.width}×${canvas.height}`
      : `${canvas.width}×${canvas.height} → ${clientWidth}×${clientHeight}`;
    target.title = t(sameSize ? 'size.same' : 'size.scaled');
  }

  return { render };
}
