import { el } from '../dom.js';
import { t } from '../../i18n/index.js';
import { formatDuration } from '../../core/stats.js';

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
  activity: '➜',
  hang: '⟳',
  resync: '↻',
  resource: '⛔',
  notify: '★',
};

function clock(at) {
  const date = new Date(at);
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

/** Also the wording of an alert, so a Discord ping reads like the log line. */
export function describeEntry(entry) {
  if (entry.kind === 'task') {
    return t(entry.started ? 'log.taskStarted' : 'log.taskStopped', { task: entry.label });
  }
  if (entry.kind === 'resync') {
    return t('log.resync', { label: entry.label });
  }
  if (entry.kind === 'hang') {
    return t('log.hang', { label: entry.label });
  }
  if (entry.kind === 'activity') {
    return t('log.activity', { label: entry.label });
  }
  if (entry.kind === 'screen') {
    return t('log.screen', { label: entry.label });
  }
  if (entry.kind === 'resource') {
    return t('log.resource', { label: entry.label });
  }
  if (entry.kind === 'notify') {
    return t('log.notify', { label: entry.label });
  }
  if (entry.kind === 'busy') {
    return t('log.busy', { label: entry.label });
  }
  return t('log.clicked', { label: entry.label });
}

/** `14:32` — the session started today, so the date would be noise. */
function shortClock(at) {
  const date = new Date(at);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Session counters above the log.
 *
 * The log says what happened; these say how much of it — which is the question
 * after a night of farming, and the one a 200-entry log cannot answer.
 */
function renderStats(deps) {
  const stats = deps.getStats();

  const reset = el('button', { class: 'bhb-btn bhb-btn--small', text: t('stats.reset') });
  reset.addEventListener('click', () => {
    deps.resetStats();
    deps.refresh();
  });

  const facts = [
    [t('stats.running'), formatDuration(stats.runningMs)],
    [t('stats.clicks'), String(stats.clicks)],
    [t('stats.rounds'), String(stats.rounds)],
    [t('stats.drops'), String(stats.drops)],
    [t('stats.resyncs'), String(stats.resyncs)],
    [t('stats.hangs'), String(stats.hangs)],
  ];

  const activities = Object.values(stats.activities).filter(
    (entry) => entry.clicks > 0 || entry.visits > 0
  );

  return el('div', { class: 'bhb-field' }, [
    el('div', { class: 'bhb-field__head' }, [
      el('span', { class: 'bhb-label', text: t('stats.title') }),
      el('span', {
        class: 'bhb-note bhb-mono',
        text: t('stats.since', { time: shortClock(stats.startedAt) }),
      }),
      reset,
    ]),
    el(
      'div',
      { class: 'bhb-stats' },
      facts.map(([label, value]) =>
        el('div', { class: 'bhb-stats__cell' }, [
          el('span', { class: 'bhb-stats__value bhb-mono', text: value }),
          el('span', { class: 'bhb-stats__label', text: label }),
        ])
      )
    ),
    activities.length === 0
      ? el('p', { class: 'bhb-note', text: t('stats.empty') })
      : el(
          'div',
          { class: 'bhb-stats__rows' },
          activities.map((entry) =>
            el('div', { class: 'bhb-stats__row' }, [
              el('span', { class: 'bhb-stats__name', text: entry.name }),
              el('span', {
                class: 'bhb-mono bhb-stats__num',
                text: `${entry.clicks} ${t('stats.colClicks')}`,
              }),
              el('span', {
                class: 'bhb-mono bhb-stats__num',
                text: `${entry.visits} ${t('stats.colVisits')}`,
              }),
              el('span', {
                class: `bhb-mono bhb-stats__num ${entry.spent > 0 ? 'is-spent' : ''}`,
                text: `${entry.spent} ${t('stats.colSpent')}`,
              }),
            ])
          )
        ),
  ]);
}

/**
 * @param {object} deps
 * @param {ReturnType<import('../store.js').createUiStore>} deps.store
 * @param {() => import('../../core/stats.js').StatsSnapshot} deps.getStats
 * @param {() => void} deps.resetStats
 * @param {() => void} deps.refresh
 */
/**
 * The report box outlives its render, like the step transfer box: the panel
 * rebuilds every tick, and a block of text that vanished under the user's
 * hands before they could select it would be no use at all.
 *
 * @type {HTMLTextAreaElement | null}
 */
let reportBox = null;

export function renderLogTab(deps) {
  const entries = deps.store.get().log;
  const stats = renderStats(deps);

  const clear = el('button', { class: 'bhb-btn', text: t('log.clear') });
  clear.addEventListener('click', () => {
    deps.store.clearLog();
    // The stored copy too, or the next reload brings it all back.
    deps.clearStoredLog();
    deps.refresh();
  });

  if (!reportBox) {
    reportBox = el('textarea', { class: 'bhb-transfer bhb-mono' });
    reportBox.rows = 4;
    reportBox.spellcheck = false;
    reportBox.placeholder = t('log.reportHint');
  }

  const report = el('button', { class: 'bhb-btn', text: t('log.report') });
  report.addEventListener('click', () => {
    reportBox.value = deps.buildReport();
    reportBox.focus();
    reportBox.select();
  });

  const reportRow = el('div', { class: 'bhb-field' }, [
    el('div', { class: 'bhb-btnrow' }, [report]),
    reportBox,
  ]);

  if (entries.length === 0) {
    return el('div', { class: 'bhb-tab' }, [
      stats,
      reportRow,
      el('p', { class: 'bhb-empty', text: t('log.empty') }),
    ]);
  }

  const rows = entries.map((entry) =>
    el('div', { class: `bhb-log__row bhb-log__row--${entry.kind}` }, [
      el('span', { class: 'bhb-log__time bhb-mono', text: clock(entry.at) }),
      el('span', { class: 'bhb-log__icon', text: KIND_ICON[entry.kind] || '·' }),
      el('span', { class: 'bhb-log__text', text: describeEntry(entry) }),
      el('span', {
        class: 'bhb-log__coord bhb-mono',
        text: entry.point ? `${entry.point.x},${entry.point.y}` : '',
      }),
    ])
  );

  return el('div', { class: 'bhb-tab' }, [
    stats,
    reportRow,
    el('div', { class: 'bhb-field__head' }, [
      el('span', { class: 'bhb-label', text: `${t('log.title')} · ${entries.length}` }),
      clear,
    ]),
    el('div', { class: 'bhb-log' }, rows),
  ]);
}
