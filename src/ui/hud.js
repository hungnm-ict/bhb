import { el, mount } from './dom.js';
import { anchorTopRight } from './anchor.js';
import { t } from '../i18n/index.js';
import { getSpeed, formatSpeed } from '../core/speed.js';
import { AUTO_STOP_TIMEOUT } from '../core/constants.js';
import { activityCode } from '../bot/activity.js';
import { realSetTimeout, realClearTimeout } from '../core/timers.js';

/**
 * The always-on strip.
 *
 * It answers one question — is the bot working, and on what — and gets out of
 * the way. Everything else lives in the panel. It fades once the user stops
 * touching it so it stops being something to look past while playing.
 *
 * The name and version are gone from here: they never change, so they were
 * paying rent on the one corner of the screen the game is also using. What is
 * left is a badge, and a message only when there is bad news.
 */

const DIM_AFTER_MS = 4000;

/**
 * How long without a click before the status line earns its width.
 *
 * While steps are landing, the message only repeats what the badge says. It is
 * the silence that is worth reading about.
 */
const STUCK_AFTER_MS = 4000;

/**
 * @param {object} deps
 * @param {() => object} deps.getEngineState
 * @param {ReturnType<import('./store.js').createUiStore>} deps.store
 */
/** The badge: the activity when there is one, else the mode being run. */
function runCode(engine) {
  if (engine.activity) {
    return activityCode({ id: engine.activity, name: engine.activityName });
  }
  return t(`code.${engine.activeTask}`);
}

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

    // With the panel open the strip says nothing the panel is not already
    // saying, and it costs the panel the height it sits in.
    if (deps.store.get().panelOpen) {
      target.style.display = 'none';
      return;
    }
    target.style.display = '';
    anchorTopRight(target);

    const engine = deps.getEngineState();
    const speed = getSpeed();
    const running = Boolean(engine.activeTask);

    const sinceClick = AUTO_STOP_TIMEOUT - (engine.remainingMs || 0);
    // While steps are landing the message only repeats the badge. It is the
    // silence that is worth saying something about — and an amber frame says
    // it without taking a strip of the game with it.
    const stuck = Boolean(engine.activeTask) && sinceClick > STUCK_AFTER_MS;

    target.className = `bhb-hud ${running ? 'bhb-hud--live' : ''} ${
      stuck ? 'bhb-hud--stuck' : ''
    } ${target.classList.contains('bhb-hud--dim') ? 'bhb-hud--dim' : ''}`;
    target.title = stuck ? engine.lastMessage || '' : '';

    // Stopped, the mode is a plan rather than a fact — the panel is where a
    // plan belongs. The strip keeps only the dot.
    const code = running ? runCode(engine) : null;

    const parts = [
      el('span', { class: 'bhb-hud__dot' }),
      code
        ? el('span', {
            class: 'bhb-hud__code',
            text: code,
            title: engine.activityName || t(`task.${engine.activeTask}`),
          })
        : null,
      speed > 1 || running
        ? el('span', {
            class: `bhb-hud__speed ${speed > 1 ? 'is-boosted' : ''}`,
            text: `${formatSpeed(speed)}×`,
          })
        : null,
    ].filter(Boolean);

    if (running && engine.activity) {
      target.dataset.activity = engine.activity;
    } else {
      delete target.dataset.activity;
    }

    target.replaceChildren(...parts);
  }

  return { render, wake };
}
