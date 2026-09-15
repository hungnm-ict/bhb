import { el } from '../dom.js';
import { t } from '../../i18n/index.js';
import { TaskId, Phase } from '../../core/engine.js';
import { getSpeed, setSpeed, formatSpeed, speedIndex, stepSpeed } from '../../core/speed.js';
import { SPEED_STEPS } from '../../core/constants.js';
import { getCanvas } from '../../core/canvas.js';
import { stepsForActivity } from '../../bot/activity.js';
import { Keys, keyLabel } from '../../core/keys.js';

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

/**
 * Whether a finger is on the speed slider right now.
 *
 * Keeping the slider node across renders is not enough: the panel body is
 * rebuilt every tick, and re-parenting a node mid-drag makes Chrome drop the
 * pointer capture — the thumb comes off the cursor twice a second. So while the
 * slider is held, the panel does not rebuild at all.
 */
let isDraggingSpeed = false;

export function speedIsBeingDragged() {
  return isDraggingSpeed;
}

/** Repaint just the speed readout and slider position. */
export function updateSpeedDisplay() {
  if (!speedControl) {
    return;
  }
  const speed = getSpeed();
  const index = speedIndex(speed);
  speedControl.slider.value = String(index);
  speedControl.slider.style.setProperty(
    '--bhb-fill',
    `${(index / (SPEED_STEPS.length - 1)) * 100}%`
  );
  speedControl.readout.textContent = `${formatSpeed(speed)}×`;
  speedControl.readout.className = `bhb-speed ${speed > 1 ? 'is-boosted' : ''}`;
}

/**
 * Stops worth a label under the track.
 *
 * The scale is uneven, so a label has to sit over the stop it names rather than
 * at a share of the width — 1× is nowhere near the middle.
 */
const LABELLED_SPEEDS = [0.1, 1, 5, 10, 20];

/** Hotkeys still work; showing them here is how the user learns them. */
const TASKS = [
  [TaskId.RERUN, 'task.rerun', Keys.RERUN],
  [TaskId.WORLD_BOSS, 'task.wb', Keys.WORLD_BOSS],
  [TaskId.SCRIPT, 'task.script', Keys.SCRIPT],
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
        el('span', { class: 'bhb-task__switch' }),
        el('span', { class: 'bhb-task__name', text: t(labelKey) }),
        phase ? el('span', { class: 'bhb-task__phase', text: phase }) : null,
        // The reason a switch is locked belongs on that switch. Said under the
        // grid instead, it read as a verdict on all four.
        isLocked ? el('span', { class: 'bhb-task__warn', title, text: '⚠' }) : null,
        el('span', { class: 'bhb-kbd', text: keyLabel(key) }),
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
    key: Keys.RUN_ALL,
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
    slider.addEventListener('input', () => {
      setSpeed(SPEED_STEPS[Number(slider.value)]);
    });

    slider.addEventListener('pointerdown', () => {
      isDraggingSpeed = true;
    });
    // On the window, not the slider: a drag very often ends with the cursor
    // somewhere else entirely, and a flag left stuck on would freeze the panel.
    window.addEventListener('pointerup', () => {
      isDraggingSpeed = false;
    });
    window.addEventListener('pointercancel', () => {
      isDraggingSpeed = false;
    });

    speedControl = { slider, readout: el('span', { class: 'bhb-speed' }) };
  }

  const { slider, readout } = speedControl;
  updateSpeedDisplay();

  /** Where the track is, as a percentage, for a stop's tick and its label. */
  function stopOffset(index) {
    return `${(index / (SPEED_STEPS.length - 1)) * 100}%`;
  }

  // Drawn by hand: Chrome renders a `<datalist>`'s marks so faintly that the
  // stops were invisible, which made an uneven scale look like a linear one.
  const ticks = el(
    'div',
    { class: 'bhb-speedticks' },
    SPEED_STEPS.map((stop, index) =>
      el('span', {
        class: `bhb-speedticks__tick ${LABELLED_SPEEDS.includes(stop) ? 'is-major' : ''}`,
        style: { left: stopOffset(index) },
      })
    )
  );

  const scale = el(
    'div',
    { class: 'bhb-speedscale bhb-mono' },
    LABELLED_SPEEDS.map((stop) =>
      el('span', {
        class: `bhb-speedscale__mark ${stop === 1 ? 'is-unity' : ''}`,
        text: `${formatSpeed(stop)}×`,
        style: { left: stopOffset(speedIndex(stop)) },
      })
    )
  );

  function nudge(direction, label) {
    const button = el('button', { class: 'bhb-icon bhb-icon--wide', text: label });
    button.addEventListener('click', () => setSpeed(stepSpeed(getSpeed(), direction)));
    return button;
  }

  return el('div', { class: 'bhb-tab' }, [
    el('div', { class: 'bhb-taskgrid' }, [...tiles, runAll]),
    el('p', { class: 'bhb-note', text: t('queue.inSettings') }),

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
      ticks,
      scale,
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
