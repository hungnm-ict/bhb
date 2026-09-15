import { el } from '../dom.js';
import { t } from '../../i18n/index.js';
import { TaskId, Phase } from '../../core/engine.js';
import { getSpeed, setSpeed, formatSpeed, speedIndex, stepSpeed } from '../../core/speed.js';
import { SPEED_STEPS } from '../../core/constants.js';
import { getCanvas } from '../../core/canvas.js';
import { stepsForActivity } from '../../bot/activity.js';

/**
 * The speed control outlives its render.
 *
 * The panel is rebuilt on every engine tick, and a slider replaced under a
 * dragging finger is a slider that fights back. Keeping the node keeps the
 * drag; `updateSpeedDisplay` is how the numbers stay current without one.
 *
 * @type {{ slider: HTMLInputElement, readout: HTMLElement } | null}
 */
let speedControl = null;

/** Repaint just the speed readout and slider position. */
export function updateSpeedDisplay() {
  if (!speedControl) {
    return;
  }
  const speed = getSpeed();
  speedControl.slider.value = String(speedIndex(speed));
  speedControl.readout.textContent = `${formatSpeed(speed)}×`;
  speedControl.readout.className = `bhb-speed ${speed > 1 ? 'is-boosted' : ''}`;
}

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

  /** One tile in the 2×2 switch grid. */
  function taskTile({ taskId, labelKey, key, phase, isLocked, title }) {
    const on = engine.activeTask === taskId;
    const tile = el(
      'button',
      {
        class: `bhb-task bhb-task--tile ${on ? 'is-on' : ''} ${isLocked ? 'is-locked' : ''}`,
        ...(title ? { title } : {}),
      },
      [
        el('div', { class: 'bhb-task__top' }, [
          el('span', { class: 'bhb-task__switch' }),
          el('span', { class: 'bhb-kbd', text: key }),
        ]),
        el('span', { class: 'bhb-task__name', text: t(labelKey) }),
        el('span', { class: 'bhb-task__phase', text: phase }),
      ]
    );
    if (!isLocked) {
      tile.addEventListener('click', () => {
        deps.toggleTask(taskId);
        deps.refresh();
      });
    }
    return tile;
  }

  const tiles = TASKS.map(([taskId, labelKey, key]) => {
    const isRerunRunning = engine.activeTask === taskId && taskId === TaskId.RERUN;
    return taskTile({
      taskId,
      labelKey,
      key,
      phase: isRerunRunning
        ? t(engine.phase === Phase.RESTING ? 'phase.resting' : 'phase.hunting')
        : '',
    });
  });

  const ready = readyActivityCount(deps);
  const runAll = taskTile({
    taskId: TaskId.RUN_ALL,
    labelKey: 'task.runAll',
    key: '6',
    phase:
      engine.activeTask === TaskId.RUN_ALL ? t('queue.round', { n: engine.round }) : '',
    isLocked: ready === 0,
    title: ready === 0 ? t('tasks.runAllLocked') : t('tasks.runAllReady', { n: ready }),
  });

  if (!speedControl) {
    const slider = el('input', { class: 'bhb-slider' });
    slider.type = 'range';
    // The stops are not evenly spaced, so the slider rides their index.
    slider.min = '0';
    slider.max = String(SPEED_STEPS.length - 1);
    slider.step = '1';
    // Native tick marks, so a notch is visible before it is dragged onto.
    const stops = el('datalist');
    stops.id = 'bhb-speed-stops';
    for (const stop of SPEED_STEPS) {
      const option = el('option');
      option.value = String(SPEED_STEPS.indexOf(stop));
      option.label = `${formatSpeed(stop)}×`;
      stops.append(option);
    }
    slider.setAttribute('list', stops.id);
    slider.append(stops);

    slider.addEventListener('input', () => {
      setSpeed(SPEED_STEPS[Number(slider.value)]);
    });

    speedControl = { slider, readout: el('span', { class: 'bhb-speed' }) };
  }

  const { slider, readout } = speedControl;
  updateSpeedDisplay();

  function nudge(direction, label) {
    const button = el('button', { class: 'bhb-icon bhb-icon--wide', text: label });
    button.addEventListener('click', () => setSpeed(stepSpeed(getSpeed(), direction)));
    return button;
  }

  return el('div', { class: 'bhb-tab' }, [
    el('div', { class: 'bhb-taskgrid' }, [...tiles, runAll]),
    ready === 0
      ? el('p', { class: 'bhb-note bhb-note--warn', text: t('tasks.runAllLocked') })
      : el('p', { class: 'bhb-note', text: t('queue.inSettings') }),

    el('div', { class: 'bhb-field' }, [
      el('div', { class: 'bhb-field__head' }, [
        el('span', { class: 'bhb-label', text: t('overlay.speed') }),
        readout,
      ]),
      el('div', { class: 'bhb-speedrow' }, [
        nudge(-1, '−'),
        slider,
        nudge(1, '+'),
      ]),
      el('div', { class: 'bhb-speedends bhb-mono' }, [
        el('span', { text: `${formatSpeed(SPEED_STEPS[0])}×` }),
        // The stops are uneven, so 1x is not the middle of the track; a label
        // sitting there anyway would misread the whole scale.
        el('span', {
          class: 'bhb-speedends__mark',
          text: '1×',
          style: { left: `${(speedIndex(1) / (SPEED_STEPS.length - 1)) * 100}%` },
        }),
        el('span', { text: `${formatSpeed(SPEED_STEPS[SPEED_STEPS.length - 1])}×` }),
      ]),
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
