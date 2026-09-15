import { el } from '../dom.js';
import { t } from '../../i18n/index.js';
import { TaskId, Phase } from '../../core/engine.js';
import { getSpeed, setSpeed, formatSpeed, speedIndex } from '../../core/speed.js';
import { SPEED_STEPS } from '../../core/constants.js';
import { getCanvas } from '../../core/canvas.js';
import { stepsForActivity } from '../../bot/activity.js';

/** Hotkeys still work; showing them here is how the user learns them. */
const TASKS = [
  [TaskId.RERUN, 'task.rerun', '3'],
  [TaskId.WORLD_BOSS, 'task.wb', '4'],
  [TaskId.SCRIPT, 'task.script', '5'],
];

function formatRemaining(ms) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}m${String(total % 60).padStart(2, '0')}s`;
}

/**
 * Live framebuffer size next to the displayed size — when steps start missing,
 * this line says whether the framebuffer moved under them.
 */
function describeCanvas() {
  const canvas = getCanvas();
  if (!canvas) {
    return '—';
  }
  return `${canvas.width}×${canvas.height} → ${Math.round(canvas.clientWidth)}×${Math.round(
    canvas.clientHeight
  )}`;
}

/**
 * How many enabled activities Run-All could actually do something with.
 *
 * Run-All with nothing tagged does not fail loudly — it rotates the queue
 * quietly, and with the watchdog on it eventually reloads the page — so the
 * switch says no rather than letting the user start it.
 */
function readyActivityCount(deps) {
  const steps = deps.getSteps();
  return deps
    .getActivities()
    .filter((activity) => activity.enabled && stepsForActivity(steps, activity.id).length > 0)
    .length;
}

/**
 * @param {object} deps
 * @param {() => object} deps.getEngineState
 * @param {(taskId: string) => void} deps.toggleTask
 * @param {() => import('../../bot/step.js').Step[]} deps.getSteps
 * @param {() => import('../../bot/activity.js').Activity[]} deps.getActivities
 * @param {() => void} deps.refresh
 */
export function renderTasksTab(deps) {
  const engine = deps.getEngineState();
  const speed = getSpeed();

  const rows = TASKS.map(([taskId, labelKey, key]) => {
    const on = engine.activeTask === taskId;
    const phase =
      on && taskId === TaskId.RERUN
        ? t(engine.phase === Phase.RESTING ? 'phase.resting' : 'phase.hunting')
        : '';

    const button = el('button', { class: `bhb-task ${on ? 'is-on' : ''}` }, [
      el('span', { class: 'bhb-task__switch' }),
      el('span', { class: 'bhb-task__name', text: t(labelKey) }),
      el('span', { class: 'bhb-task__phase', text: phase }),
      el('span', { class: 'bhb-kbd', text: key }),
    ]);
    button.addEventListener('click', () => {
      deps.toggleTask(taskId);
      deps.refresh();
    });
    return button;
  });

  const ready = readyActivityCount(deps);
  const runningAll = engine.activeTask === TaskId.RUN_ALL;
  const runAll = el(
    'button',
    {
      class: `bhb-task ${runningAll ? 'is-on' : ''} ${ready === 0 ? 'is-locked' : ''}`,
      title: ready === 0 ? t('tasks.runAllLocked') : t('tasks.runAllReady', { n: ready }),
    },
    [
      el('span', { class: 'bhb-task__switch' }),
      el('span', { class: 'bhb-task__name', text: t('task.runAll') }),
      el('span', {
        class: 'bhb-task__phase',
        text: runningAll ? t('queue.round', { n: engine.round }) : '',
      }),
      el('span', { class: 'bhb-kbd', text: '6' }),
    ]
  );
  if (ready > 0) {
    runAll.addEventListener('click', () => {
      deps.toggleTask(TaskId.RUN_ALL);
      deps.refresh();
    });
  }

  const slider = el('input', { class: 'bhb-slider' });
  slider.type = 'range';
  // The stops are not evenly spaced, so the slider rides their index.
  slider.min = '0';
  slider.max = String(SPEED_STEPS.length - 1);
  slider.step = '1';
  slider.value = String(speedIndex(speed));
  slider.addEventListener('input', () => {
    setSpeed(SPEED_STEPS[Number(slider.value)]);
    deps.refresh();
  });

  return el('div', { class: 'bhb-tab' }, [
    el('div', { class: 'bhb-stack' }, [...rows, runAll]),
    ready === 0
      ? el('p', { class: 'bhb-note bhb-note--warn', text: t('tasks.runAllLocked') })
      : el('p', { class: 'bhb-note', text: t('queue.inSettings') }),

    el('div', { class: 'bhb-field' }, [
      el('div', { class: 'bhb-field__head' }, [
        el('span', { class: 'bhb-label', text: t('overlay.speed') }),
        el('span', { class: `bhb-speed ${speed > 1 ? 'is-boosted' : ''}`, text: `${formatSpeed(speed)}×` }),
      ]),
      slider,
    ]),

    el('dl', { class: 'bhb-facts' }, [
      el('dt', { text: t('overlay.canvas') }),
      el('dd', { class: 'bhb-mono', text: describeCanvas() }),
      el('dt', { text: t('overlay.autoStop') }),
      el('dd', {
        class: 'bhb-mono',
        text: engine.activeTask ? formatRemaining(engine.remainingMs) : '—',
      }),
    ]),
  ]);
}
