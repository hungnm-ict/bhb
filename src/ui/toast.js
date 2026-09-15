import { el, mount } from './dom.js';
import { realSetTimeout, realRequestAnimationFrame } from '../core/timers.js';

/**
 * A short-lived confirmation pinned where something happened.
 *
 * Capture used to answer only in the HUD's status line, which is a strip in
 * the corner the user is not looking at — they are looking at the button they
 * just pointed to. So the answer appears there instead, with the colour that
 * was read, which is also the fastest way to see a capture that read the wrong
 * shade.
 *
 * Real timers throughout: tied to the speed hack this would vanish instantly
 * at 20×, exactly when the user is least able to watch for it.
 */

const LIFETIME_MS = 1800;
const FADE_MS = 300;

/** Keep the bubble on screen when the captured point sits near an edge. */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {object} toast
 * @param {number} toast.clientX @param {number} toast.clientY
 * @param {string} toast.text
 * @param {string} [toast.hex] the colour read, shown as a swatch
 * @param {boolean} [toast.isWarning] amber instead of green
 */
export function showToast({ clientX, clientY, text, hex, isWarning }) {
  const bubble = mount(
    el('div', { class: `bhb-toast ${isWarning ? 'bhb-toast--warn' : ''}` }, [
      hex ? el('span', { class: 'bhb-toast__swatch', style: { background: hex } }) : null,
      el('span', { text }),
    ])
  );

  const width = bubble.offsetWidth || 120;
  bubble.style.left = `${clamp(clientX, width / 2 + 8, window.innerWidth - width / 2 - 8)}px`;
  bubble.style.top = `${clamp(clientY - 34, 8, window.innerHeight - 40)}px`;

  realRequestAnimationFrame(() => bubble.classList.add('bhb-toast--in'));
  realSetTimeout(() => {
    bubble.classList.remove('bhb-toast--in');
    realSetTimeout(() => bubble.remove(), FADE_MS);
  }, LIFETIME_MS);

  return bubble;
}
