import { el } from '../dom.js';
import { t } from '../../i18n/index.js';
import { TaskId, resolveRunTarget } from '../../core/engine.js';
import {
  getSpeed,
  setSpeed,
  formatSpeed,
  speedIndex,
  stepSpeed,
  getFrameRates,
  getClockDrift,
  resetClock,
} from '../../core/speed.js';
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

/** Past this the game may already have rolled into another day. */
const DRIFT_WARN_MS = 60 * 60 * 1000;

/**
 * What Run would start, and why it cannot.
 *
 * Run-All with nothing tagged rotates an empty queue quietly, and an activity
 * with no steps polls forever — both look like the bot ignoring the button, so
 * the control says no instead of starting.
 */
function describeTarget(deps, target) {
  const activities = deps.getActivities();
  const { taskId, activityId } = resolveRunTarget(target, activities);
  const steps = deps.getSteps();

  if (taskId === TaskId.RUN_ALL) {
    const ready = readyActivityCount(deps);
    return {
      taskId,
      activityId,
      isLocked: ready === 0,
      title: ready === 0 ? t('tasks.runAllLocked') : t('tasks.runAllReady', { n: ready }),
    };
  }
  if (taskId === TaskId.SOLO) {
    const count = stepsForActivity(steps, activityId).length;
    return { taskId, activityId, isLocked: count === 0, title: count === 0 ? t('queue.noSteps') : '' };
  }
  const loose = steps.filter((step) => !step.activity).length;
  return { taskId, activityId, isLocked: loose === 0, title: loose === 0 ? t('tasks.noLoose') : '' };
}

/** Drift is only worth reading in the units it has reached. */
function formatDrift(ms) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) {
    return `+${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `+${minutes}m${String(seconds % 60).padStart(2, '0')}s`;
  }
  return `+${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}m`;
}

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

  const drift = getClockDrift();
  const resetClockButton = el('button', {
    class: 'bhb-btn bhb-btn--tiny',
    title: t('tasks.resetClockHint'),
    text: t('tasks.resetClock'),
  });
  resetClockButton.addEventListener('click', () => {
    resetClock();
    deps.refresh();
  });

  const target = deps.getRunTarget();
  const picked = describeTarget(deps, target);

  const chooser = el('select', { class: 'bhb-rule__gate', title: t('tasks.target') });
  const script = el('option', { text: t('task.script') });
  script.value = TaskId.SCRIPT;
  chooser.append(script);
  for (const activity of deps.getActivities()) {
    const option = el('option', { text: activity.name });
    option.value = activity.id;
    chooser.append(option);
  }
  const all = el('option', { text: t('task.runAll') });
  all.value = TaskId.RUN_ALL;
  chooser.append(all);
  // A target whose activity was deleted falls back to the Script set, and the
  // dropdown has to agree with what Run would actually do.
  chooser.value = picked.taskId === TaskId.SOLO ? picked.activityId : picked.taskId;
  chooser.addEventListener('change', () => {
    deps.setRunTarget(chooser.value);
    deps.refresh();
  });

  // Running *this* target, not merely running: Run-All is not the Script set.
  const isOnTarget =
    engine.activeTask === picked.taskId &&
    (picked.taskId !== TaskId.SOLO || engine.activity === picked.activityId);

  const phase =
    isOnTarget && picked.taskId === TaskId.RUN_ALL ? t('queue.round', { n: engine.round }) : '';

  const isLocked = picked.isLocked && !isOnTarget;
  const run = el(
    'button',
    { class: `bhb-task bhb-task--tile ${isOnTarget ? 'is-on' : ''} ${isLocked ? 'is-locked' : ''}` },
    [
      el('span', { class: 'bhb-task__switch' }),
      el('span', { class: 'bhb-task__name', text: t(isOnTarget ? 'tasks.stop' : 'tasks.run') }),
      phase ? el('span', { class: 'bhb-task__phase', text: phase }) : null,
      el('span', { class: 'bhb-kbd', text: keyLabel(Keys.RUN) }),
    ]
  );
  if (!isLocked) {
    run.addEventListener('click', () => {
      deps.runSelected();
      deps.refresh();
    });
  }

  // Said in words under the button, and only about the mode that is selected:
  // a ⚠ on the switch itself read as the switch being broken.
  const warning = isLocked ? el('p', { class: 'bhb-note bhb-note--warn', text: picked.title }) : null;

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
    el('div', { class: 'bhb-field' }, [
      el('div', { class: 'bhb-field__head' }, [
        el('span', { class: 'bhb-label', text: t('tasks.target') }),
        chooser,
      ]),
      run,
      warning,
    ]),
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
      el('dt', { text: t('overlay.clock') }),
      el('dd', {}, [
        el('span', {
          class: `bhb-mono ${drift >= DRIFT_WARN_MS ? 'bhb-drift--far' : ''}`,
          text: formatDrift(drift),
        }),
        drift >= 1000 ? resetClockButton : null,
      ]),
      el('dt', { text: t('overlay.fps') }),
      el('dd', { class: 'bhb-mono', text: `${getFrameRates().real} fps` }),
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
