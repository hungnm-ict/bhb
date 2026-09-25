import { el, mount } from './dom.js';
import { getCanvas } from '../core/canvas.js';
import { isInsideCanvas } from '../core/coords.js';

/**
 * Drag a rectangle over the game.
 *
 * Capturing an anchor means saying *where*, and the only honest way to say it
 * is to draw it on the game itself. The overlay lives only for the duration of
 * one drag: left up any longer it would eat every click meant for the game.
 */

/** Anything smaller is a stray click, not a region. */
const MIN_SIDE_PX = 6;

/**
 * @param {(rect: { left: number, top: number, width: number, height: number } | null) => void} onDone
 *   called with the client-space rectangle, or null when cancelled
 * @returns {() => void} cancels the drag
 */
export function startDragSelect(onDone) {
  const canvas = getCanvas();
  if (!canvas) {
    onDone(null);
    return () => {};
  }

  const layer = mount(el('div', { class: 'bhb-drag' }));
  const box = el('div', { class: 'bhb-drag__box' });
  const hint = el('div', { class: 'bhb-drag__hint' });
  layer.append(box, hint);

  let startX = null;
  let startY = null;
  let finished = false;

  function rectFrom(x, y) {
    return {
      left: Math.min(startX, x),
      top: Math.min(startY, y),
      width: Math.abs(x - startX),
      height: Math.abs(y - startY),
    };
  }

  /** Clear of the box, and clear of the screen edges. */
  const HINT_GAP_PX = 9;

  function draw(rect) {
    Object.assign(box.style, {
      display: 'block',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });

    hint.style.display = 'block';
    hint.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;

    // Under the box, or over it when there is no room under: parked in the
    // middle of the screen it covered the very thing being framed.
    const size = hint.getBoundingClientRect();
    const below = rect.top + rect.height + HINT_GAP_PX;
    const above = rect.top - size.height - HINT_GAP_PX;
    const top = below + size.height <= window.innerHeight || above < 0 ? below : above;
    const left = rect.left + rect.width / 2 - size.width / 2;

    hint.style.top = `${Math.max(0, top)}px`;
    hint.style.left = `${Math.min(Math.max(0, left), window.innerWidth - size.width)}px`;
  }

  function finish(rect) {
    if (finished) {
      return;
    }
    finished = true;
    window.removeEventListener('mousedown', onDown, true);
    window.removeEventListener('mousemove', onMove, true);
    window.removeEventListener('mouseup', onUp, true);
    window.removeEventListener('keydown', onKey, true);
    layer.remove();
    onDone(rect);
  }

  function onDown(event) {
    if (!isInsideCanvas(canvas, event.clientX, event.clientY)) {
      finish(null);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    startX = event.clientX;
    startY = event.clientY;
    draw(rectFrom(startX, startY));
  }

  function onMove(event) {
    if (startX === null) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    draw(rectFrom(event.clientX, event.clientY));
  }

  function onUp(event) {
    if (startX === null) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const rect = rectFrom(event.clientX, event.clientY);
    finish(rect.width >= MIN_SIDE_PX && rect.height >= MIN_SIDE_PX ? rect : null);
  }

  function onKey(event) {
    if (event.key === 'Escape') {
      finish(null);
    }
  }

  window.addEventListener('mousedown', onDown, true);
  window.addEventListener('mousemove', onMove, true);
  window.addEventListener('mouseup', onUp, true);
  window.addEventListener('keydown', onKey, true);

  return () => finish(null);
}
