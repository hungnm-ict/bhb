import { el, mount } from './dom.js';
import { bufferToClient } from '../core/coords.js';
import { getCanvas } from '../core/canvas.js';
import { realSetTimeout, realRequestAnimationFrame } from '../core/timers.js';

/**
 * Transient visuals: the pending-rule marker and the click flash.
 *
 * Both use the real timers — tying feedback animations to the speed hack would
 * make them flicker out at 10x.
 */

const FLASH_LIFETIME_MS = 400;

/** @type {HTMLElement | null} */
let pendingMarker = null;

/** Ring on a buffer point whose rule is still waiting for its colour. */
export function showPendingMarker(bufferX, bufferY) {
  removePendingMarker();

  const canvas = getCanvas();
  if (!canvas) {
    return;
  }

  const pos = bufferToClient(canvas, bufferX, bufferY);
  pendingMarker = mount(
    el('div', {
      class: 'bhb-marker',
      style: { left: `${pos.clientX}px`, top: `${pos.clientY}px` },
    })
  );
}

export function removePendingMarker() {
  pendingMarker?.remove();
  pendingMarker = null;
}

/** Expanding ring at a click, so the user can see where the bot is acting. */
export function showClickFlash(clientX, clientY) {
  const ring = mount(
    el('div', {
      class: 'bhb-flash bhb-flash--ring',
      style: { left: `${clientX}px`, top: `${clientY}px` },
    })
  );

  realRequestAnimationFrame(() => ring.classList.add('bhb-flash--out'));
  realSetTimeout(() => ring.remove(), FLASH_LIFETIME_MS);
}
