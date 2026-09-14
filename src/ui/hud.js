import { el, mount } from './dom.js';
import { t } from '../i18n/index.js';
import { getSpeed } from '../core/speed.js';
import { VERSION } from '../core/constants.js';
import { realSetTimeout, realClearTimeout } from '../core/timers.js';

/**
 * The always-on strip.
 *
 * It answers one question — is the bot working, and on what — and gets out of
 * the way. Everything else lives in the panel. It fades once the user stops
 * touching it so it stops being something to look past while playing.
 */

const DIM_AFTER_MS = 4000;

/**
 * @param {object} deps
 * @param {() => object} deps.getEngineState
 * @param {ReturnType<import('./store.js').createUiStore>} deps.store
 */
export function createHud(deps) {
  /** @type {HTMLElement | null} */
  let node = null;
  let dimTimer = null;

  function ensureNode() {
    if (node) {
      return node;
    }
    node = mount(el('div', { class: 'bhb-hud' }));
    node.addEventListener('click', () => deps.store.togglePanel());
    node.addEventListener('mouseenter', wake);
    node.addEventListener('mousemove', wake);
    return node;
  }

  /** Full opacity now, faded again once the user leaves it alone. */
  function wake() {
    const target = ensureNode();
    target.classList.remove('bhb-hud--dim');

    if (dimTimer !== null) {
      realClearTimeout(dimTimer);
    }
    dimTimer = realSetTimeout(() => {
      target.classList.add('bhb-hud--dim');
    }, DIM_AFTER_MS);
  }

  function render() {
    const target = ensureNode();
    const engine = deps.getEngineState();
    const speed = getSpeed();
    const running = Boolean(engine.activeTask);

    target.className = `bhb-hud ${running ? 'bhb-hud--live' : ''} ${
      target.classList.contains('bhb-hud--dim') ? 'bhb-hud--dim' : ''
    }`;

    target.replaceChildren(
      el('span', { class: 'bhb-hud__dot' }),
      el('span', { class: 'bhb-hud__name', text: t('app.name') }),
      el('span', { class: 'bhb-hud__ver', text: `v${VERSION}` }),
      el('span', { class: 'bhb-hud__sep' }),
      el('span', {
        class: 'bhb-hud__task',
        text: running ? t(`task.${engine.activeTask}`) : t('hud.idle'),
      }),
      el('span', {
        class: `bhb-hud__speed ${speed > 1 ? 'is-boosted' : ''}`,
        text: `${speed}×`,
      }),
      el('span', { class: 'bhb-hud__msg', text: engine.lastMessage || '' })
    );
  }

  return { render, wake };
}
