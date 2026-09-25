import { el, mount } from './dom.js';
import { getCanvas } from '../core/canvas.js';
import { t } from '../i18n/index.js';
import { VERSION } from '../core/constants.js';
import { realSetTimeout, realClearTimeout } from '../core/timers.js';

/**
 * The build number, parked in a corner.
 *
 * It was only in the reference tab, which meant opening the panel to answer
 * "am I on the build I just pushed" — the question asked most often and the
 * one the panel is least convenient for.
 *
 * The canvas size used to live here too and no longer does: it is read a few
 * times a month, when steps start missing and the question is whether the
 * framebuffer moved under them, and the Run tab already answers that.
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

  function ensureNode() {
    if (!node) {
      node = mount(
        el('div', { class: 'bhb-size bhb-mono' }, [
          el('div', { class: 'bhb-size__ver', text: `v${VERSION}` }),
        ])
      );
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

    if (!deps.isVisible() || !getCanvas()) {
      target.style.display = 'none';
      return;
    }

    target.style.display = 'block';
    target.title = t('size.version');
  }

  return { render };
}
