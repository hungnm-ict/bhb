import { el, mount } from './dom.js';
import { realSetTimeout, realRequestAnimationFrame } from '../core/timers.js';

/**
 * Expanding ring at every click the bot makes.
 *
 * Uses the real timers: tied to the speed hack it would blink out at 10x,
 * exactly when seeing the clicks matters most.
 */

const LIFETIME_MS = 400;

export function showClickFlash(clientX, clientY) {
  const ring = mount(
    el('div', { class: 'bhb-flash', style: { left: `${clientX}px`, top: `${clientY}px` } })
  );

  realRequestAnimationFrame(() => ring.classList.add('bhb-flash--out'));
  realSetTimeout(() => ring.remove(), LIFETIME_MS);
}
