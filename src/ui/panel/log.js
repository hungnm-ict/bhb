import { el } from '../dom.js';
import { t } from '../../i18n/index.js';

/**
 * Activity log.
 *
 * Built from the engine's discrete `action` events rather than its status
 * string, so it survives being overwritten on the next tick.
 */

const KIND_ICON = {
  click: '⊙',
  busy: '⋯',
  task: '⏻',
  screen: '▣',
  resource: '⛔',
};

function clock(at) {
  const date = new Date(at);
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

function describe(entry) {
  if (entry.kind === 'task') {
    return t(entry.started ? 'log.taskStarted' : 'log.taskStopped', { task: entry.label });
  }
  if (entry.kind === 'screen') {
    return t('log.screen', { label: entry.label });
  }
  if (entry.kind === 'resource') {
    return t('log.resource', { label: entry.label });
  }
  if (entry.kind === 'busy') {
    return t('log.busy', { label: entry.label });
  }
  return t('log.clicked', { label: entry.label });
}

/**
 * @param {object} deps
 * @param {ReturnType<import('../store.js').createUiStore>} deps.store
 * @param {() => void} deps.refresh
 */
export function renderLogTab(deps) {
  const entries = deps.store.get().log;

  const clear = el('button', { class: 'bhb-btn', text: t('log.clear') });
  clear.addEventListener('click', () => {
    deps.store.clearLog();
    deps.refresh();
  });

  if (entries.length === 0) {
    return el('div', { class: 'bhb-tab' }, [el('p', { class: 'bhb-empty', text: t('log.empty') })]);
  }

  const rows = entries.map((entry) =>
    el('div', { class: `bhb-log__row bhb-log__row--${entry.kind}` }, [
      el('span', { class: 'bhb-log__time bhb-mono', text: clock(entry.at) }),
      el('span', { class: 'bhb-log__icon', text: KIND_ICON[entry.kind] || '·' }),
      el('span', { class: 'bhb-log__text', text: describe(entry) }),
      el('span', {
        class: 'bhb-log__coord bhb-mono',
        text: entry.point ? `${entry.point.x},${entry.point.y}` : '',
      }),
    ])
  );

  return el('div', { class: 'bhb-tab' }, [
    el('div', { class: 'bhb-field__head' }, [
      el('span', { class: 'bhb-label', text: `${t('log.title')} · ${entries.length}` }),
      clear,
    ]),
    el('div', { class: 'bhb-log' }, rows),
  ]);
}
