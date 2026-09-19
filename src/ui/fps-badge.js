import { el, mount } from './dom.js';
import { getCanvas } from '../core/canvas.js';
import { getFrameRates } from '../core/speed.js';
import { t } from '../i18n/index.js';

/**
 * The frame rate, pinned to the game's own top-left corner.
 *
 * It belongs over the canvas rather than in the HUD: the number is about the
 * game's picture, and it is read while watching that picture, not while
 * reading the bot's status line.
 *
 * Only the browser's own rate: the game-loop count rises with the speed hack
 * and reads as a second, bigger number that nobody is watching for.
 *
 * It never takes pointer events: a readout that swallowed a click into the
 * game would be worse than no readout.
 */

/** Smooth enough to read as fine at a glance; under LOW_FPS it stutters. */
const GOOD_FPS = 45;
const LOW_FPS = 20;

export function createFpsBadge(deps) {
  /** @type {HTMLElement | null} */
  let node = null;

  function ensureNode() {
    if (!node) {
      node = mount(el('div', { class: 'bhb-fpsbadge bhb-mono' }));
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

    const box = canvas.getBoundingClientRect();
    target.style.display = 'block';
    target.style.left = `${Math.round(box.left) + 6}px`;
    target.style.top = `${Math.round(box.top) + 6}px`;

    const { real } = getFrameRates();
    target.textContent = `${real} fps`;
    target.title = t('hud.fps');
    target.classList.toggle('is-good', real >= GOOD_FPS);
    target.classList.toggle('is-low', real > 0 && real < LOW_FPS);
  }

  return { render };
}
