import { el } from '../dom.js';
import { t } from '../../i18n/index.js';
import { stepsForActivity } from '../../bot/activity.js';

/**
 * The Run-All queue, as a section of the settings tab.
 *
 * The order and the on/off switches are configuration, so they live with the
 * other settings; the switch that starts Run-All sits with the other task
 * switches, because that is what the user reaches for every session.
 *
 * Reordering is ▲▼ rather than drag-and-drop, to match the actions table: one
 * interaction to learn, not two.
 *
 * @param {object} deps
 * @param {() => import('../../bot/activity.js').Activity[]} deps.getActivities
 * @param {() => import('../../bot/step.js').Step[]} deps.getSteps
 * @param {object} deps.queueEditor
 * @param {() => object} deps.getEngineState
 * @param {(taskId: string) => void} deps.toggleTask
 * @param {() => boolean} deps.getCloseAfterRound
 * @param {(value: boolean) => void} deps.setCloseAfterRound
 * @param {() => void} deps.refresh
 */
export function renderQueueSection(deps) {
  const activities = deps.getActivities();
  const engine = deps.getEngineState();
  const steps = deps.getSteps();
  const running = Boolean(engine.activity);
  const spent = new Set(engine.spent || []);

  const head = el('div', { class: 'bhb-field__head' }, [
    el('span', { class: 'bhb-label', text: t('queue.title') }),
    el('span', {
      class: 'bhb-mono bhb-note',
      text: running ? t('queue.round', { n: engine.round }) : '',
    }),
  ]);

  const rows = activities.map((activity, index) => {
    const count = stepsForActivity(steps, activity.id).length;

    const toggle = el('button', {
      class: `bhb-icon ${activity.enabled ? 'is-on' : ''}`,
      title: t(activity.enabled ? 'steps.disable' : 'steps.enable'),
      text: activity.enabled ? '◉' : '○',
    });
    toggle.addEventListener('click', () => {
      deps.queueEditor.setEnabled(activity.id, !activity.enabled);
      deps.refresh();
    });

    const up = el('button', { class: 'bhb-icon', title: t('steps.moveUp'), text: '▲' });
    up.addEventListener('click', () => {
      deps.queueEditor.move(activity.id, -1);
      deps.refresh();
    });

    const down = el('button', { class: 'bhb-icon', title: t('steps.moveDown'), text: '▼' });
    down.addEventListener('click', () => {
      deps.queueEditor.move(activity.id, 1);
      deps.refresh();
    });

    const classes = ['bhb-step', 'bhb-queue__row'];
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
        title: t('queue.stepCount'),
        text: String(count),
      }),
      el('span', { class: 'bhb-rule__actions' }, [toggle, up, down]),
    ]);
  });

  return el('div', { class: 'bhb-field' }, [
    head,
    el('p', { class: 'bhb-note', text: t('queue.hint') }),
    el('div', { class: 'bhb-steps' }, rows),
  ]);
}
