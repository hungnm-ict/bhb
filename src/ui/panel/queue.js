import { el } from '../dom.js';
import { t } from '../../i18n/index.js';
import { rulesForActivity } from '../../rules/activity.js';
import { TaskId } from '../../core/engine.js';

/**
 * The Run-All queue.
 *
 * Reordering is ▲▼ rather than drag-and-drop, to match the rules table: one
 * interaction to learn, not two.
 *
 * @param {object} deps
 * @param {() => import('../../rules/activity.js').Activity[]} deps.getActivities
 * @param {() => import('../../rules/model.js').Rule[]} deps.getRules
 * @param {object} deps.queueEditor
 * @param {() => object} deps.getEngineState
 * @param {(taskId: string) => void} deps.toggleTask
 * @param {() => boolean} deps.getCloseAfterRound
 * @param {(value: boolean) => void} deps.setCloseAfterRound
 * @param {() => void} deps.refresh
 */
export function renderQueueTab(deps) {
  const activities = deps.getActivities();
  const engine = deps.getEngineState();
  const rules = deps.getRules();
  const running = engine.activeTask === TaskId.RUN_ALL;
  const spent = new Set(engine.spent || []);

  const run = el('button', { class: `bhb-btn ${running ? 'is-on' : 'bhb-btn--primary'}` }, [
    el('span', { class: 'bhb-btn__dot' }),
    el('span', { text: t(running ? 'queue.stop' : 'queue.start') }),
    el('span', { class: 'bhb-kbd', text: '6' }),
  ]);
  run.addEventListener('click', () => {
    deps.toggleTask(TaskId.RUN_ALL);
    deps.refresh();
  });

  const closesAfterRound = deps.getCloseAfterRound();
  const closeAfter = el('button', { class: `bhb-toggle ${closesAfterRound ? 'is-on' : ''}` }, [
    el('span', { class: 'bhb-toggle__dot', text: closesAfterRound ? '◉' : '○' }),
    el('span', { class: 'bhb-toggle__label', text: t('queue.closeAfterRound') }),
  ]);
  closeAfter.addEventListener('click', () => {
    deps.setCloseAfterRound(!closesAfterRound);
    deps.refresh();
  });

  const head = el('div', { class: 'bhb-field' }, [
    el('div', { class: 'bhb-field__head' }, [
      el('span', { class: 'bhb-label', text: t('queue.title') }),
      el('span', {
        class: 'bhb-mono bhb-note',
        text: running ? t('queue.round', { n: engine.round }) : '',
      }),
    ]),
    run,
    closeAfter,
    el('p', { class: 'bhb-note', text: t('queue.hint') }),
  ]);

  const rows = activities.map((activity, index) => {
    const count = rulesForActivity(rules, activity.id).length;

    const toggle = el('button', {
      class: `bhb-icon ${activity.enabled ? 'is-on' : ''}`,
      title: t(activity.enabled ? 'rules.disable' : 'rules.enable'),
      text: activity.enabled ? '◉' : '○',
    });
    toggle.addEventListener('click', () => {
      deps.queueEditor.setEnabled(activity.id, !activity.enabled);
      deps.refresh();
    });

    const up = el('button', { class: 'bhb-icon', title: t('rules.moveUp'), text: '▲' });
    up.addEventListener('click', () => {
      deps.queueEditor.move(activity.id, -1);
      deps.refresh();
    });

    const down = el('button', { class: 'bhb-icon', title: t('rules.moveDown'), text: '▼' });
    down.addEventListener('click', () => {
      deps.queueEditor.move(activity.id, 1);
      deps.refresh();
    });

    const classes = ['bhb-rule', 'bhb-queue__row'];
    if (!activity.enabled) {
      classes.push('is-off');
    }
    if (engine.activity === activity.id) {
      classes.push('is-active');
    }
    if (spent.has(activity.id)) {
      classes.push('is-spent');
    }

    return el('div', { class: classes.join(' ') }, [
      el('span', { class: 'bhb-rule__n', text: String(index + 1) }),
      el('span', {
        class: 'bhb-queue__state',
        text: engine.activity === activity.id ? '▶' : spent.has(activity.id) ? '∅' : '',
      }),
      el('span', { class: 'bhb-queue__name', text: activity.name }),
      el('span', {
        class: 'bhb-rule__coord bhb-mono',
        title: t('queue.ruleCount'),
        text: String(count),
      }),
      el('span', { class: 'bhb-rule__actions' }, [toggle, up, down]),
    ]);
  });

  return el('div', { class: 'bhb-tab' }, [head, el('div', { class: 'bhb-rules' }, rows)]);
}
