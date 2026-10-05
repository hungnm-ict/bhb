import { el, mount } from './dom.js';
import { getCanvas } from '../core/canvas.js';
import { bufferToClient, resolvePoint, getBufferSize } from '../core/coords.js';

/**
 * The box one anchor reads, drawn over the game while its row is hovered.
 *
 * An anchor is a colour fingerprint, not a picture — "anchor 2" means nothing
 * on its own. Outlining the rectangle it was captured from is what lets
 * someone place it without recapturing.
 *
 * @param {object} deps
 * @param {() => import('../bot/screen.js').Screen[]} deps.getScreens
 * @param {() => string} deps.getScaleMode
 * @param {ReturnType<import('./store.js').createUiStore>} deps.store
 */
export function createAnchorHighlight(deps) {
  /** @type {HTMLElement | null} */
  let box = null;

  function ensureBox() {
    if (!box) {
      box = mount(el('div', { class: 'bhb-anchorhi' }));
    }
    return box;
  }

  function render() {
    const node = ensureBox();
    const hovered = deps.store.get().hoveredAnchor;
    const canvas = hovered && getCanvas();
    const screen = hovered && deps.getScreens().find((candidate) => candidate.id === hovered.screenId);
    const anchor = screen && screen.anchors[hovered.anchorIndex];

    if (!anchor || !canvas) {
      node.style.display = 'none';
      return;
    }

    const buffer = getBufferSize(canvas);
    const mode = deps.getScaleMode();
    const rect = canvas.getBoundingClientRect();
    const stored = { bw: anchor.bw, bh: anchor.bh };
    // Buffer space has its origin bottom-left, so the anchor's own corner is
    // its bottom edge and `x + w, y + h` is the top one.
    const bottomLeft = resolvePoint({ ...stored, x: anchor.x, y: anchor.y }, buffer, mode);
    const topRight = resolvePoint({ ...stored, x: anchor.x + anchor.w, y: anchor.y + anchor.h }, buffer, mode);
    const from = bufferToClient(canvas, bottomLeft.x, bottomLeft.y, rect);
    const to = bufferToClient(canvas, topRight.x, topRight.y, rect);

    node.style.display = 'block';
    node.style.left = `${Math.min(from.clientX, to.clientX)}px`;
    node.style.top = `${Math.min(from.clientY, to.clientY)}px`;
    node.style.width = `${Math.abs(to.clientX - from.clientX)}px`;
    node.style.height = `${Math.abs(from.clientY - to.clientY)}px`;
  }

  return { render };
}
