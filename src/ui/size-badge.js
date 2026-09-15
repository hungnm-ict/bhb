import { el, mount } from './dom.js';
import { getCanvas } from '../core/canvas.js';
import { t } from '../i18n/index.js';
import { realSetTimeout, realClearTimeout } from '../core/timers.js';

/**
 * The live canvas size, parked in a corner.
 *
 * Two numbers matter and they are not the same one: the framebuffer the bot
 * reads pixels from, and the CSS box the game is drawn into. When steps start
 * missing, this line is what says whether the framebuffer moved under them.
 *
 * It never takes pointer events — it sits over the game, and a readout that
 * swallowed a click would be worse than no readout. That also means it gets no
 * `mouseenter`, so "is the cursor near it" is measured against its own box from
 * a passive listener on the window instead.
 */

/** Idle time before the badge fades back out of the way. */
const DIM_AFTER_MS = 5000;

/** How close the cursor has to come before the badge lights up. */
const NEAR_PX = 32;

export function createSizeBadge(deps) {
  /** @type {HTMLElement | null} */
  let node = null;
  let dimTimer = null;
  let previousText = null;

  function ensureNode() {
    if (!node) {
      node = mount(el('div', { class: 'bhb-size bhb-mono' }));
      window.addEventListener('mousemove', onMouseMove, { passive: true, capture: true });
    }
    return node;
  }

  /** Show it now, and start the clock that fades it again. */
  function wake() {
    if (!node) {
      return;
    }
    node.classList.remove('bhb-size--dim');
    if (dimTimer !== null) {
      realClearTimeout(dimTimer);
    }
    dimTimer = realSetTimeout(() => {
      dimTimer = null;
      if (node) {
        node.classList.add('bhb-size--dim');
      }
    }, DIM_AFTER_MS);
  }

  function onMouseMove(event) {
    if (!node || node.style.display === 'none') {
      return;
    }
    const rect = node.getBoundingClientRect();
    const near =
      event.clientX >= rect.left - NEAR_PX &&
      event.clientX <= rect.right + NEAR_PX &&
      event.clientY >= rect.top - NEAR_PX &&
      event.clientY <= rect.bottom + NEAR_PX;

    node.classList.toggle('bhb-size--near', near);
    if (near) {
      wake();
    }
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

    // A size that just changed is the one worth reading, so a resize wakes it.
    if (target.textContent !== previousText) {
      previousText = target.textContent;
      wake();
    }
  }

  return { render };
}
