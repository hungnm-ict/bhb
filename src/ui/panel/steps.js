import { el } from '../dom.js';
import { t } from '../../i18n/index.js';
import { Keys, keyLabel } from '../../core/keys.js';
import { StepKind, pointsByPlace } from '../../bot/step.js';
import { isLegacyPoint } from '../../core/coords.js';

/**
 * The steps table.
 *
 * Paired with the marker layer: hovering a row lights the marker on the canvas
 * and the other way round, which is how a bare coordinate becomes a place.
 */

/**
 * @param {object} deps
 * @param {() => import('../../bot/step.js').Step[]} deps.getSteps
 * @param {ReturnType<import('../store.js').createUiStore>} deps.store
 * @param {() => import('../../bot/screen.js').Screen[]} deps.getScreens
 * @param {() => import('../../bot/activity.js').Activity[]} deps.getActivities
 * @param {object} deps.stepEditor
 * @param {() => void} deps.refresh
 */
/** @type {Map<string, HTMLElement>} step id to its row, for highlighting */
const rows = new Map();

/** Lighting a row is a class change; it never needs the table rebuilt. */
export function highlightSteps(state) {
  for (const [stepId, row] of rows) {
    row.classList.toggle('is-selected', state.selectedStepId === stepId);
    row.classList.toggle('is-hovered', state.hoveredStepId === stepId);
  }
}

export function renderStepsTab(deps) {
  const all = deps.getSteps();
  const expectedStepId = deps.getEngineState().expectedStepId;
  const state = deps.store.get();
  const activities = deps.getActivities();
  // Eight activities' steps in one list is unreadable, so the table is filtered.
  const filter = state.stepFilter;
  const steps = filter === null ? all : all.filter((step) => (step.activity || '') === filter);

  // The hotkey is armed here rather than always live: `0` sits beside the keys
  // that start the bot, and a stray press mid-fight captures whatever the
  // cursor happened to be over. The button below is explicit, so it always works.
  const isArmed = state.isCaptureArmed;
  const arm = el('button', { class: `bhb-task bhb-task--wrap ${isArmed ? 'is-on' : ''}` }, [
    el('span', { class: 'bhb-task__switch' }),
    el('span', { class: 'bhb-task__label', text: t('steps.armCapture') }),
    el('span', { class: 'bhb-kbd', text: keyLabel(Keys.CAPTURE) }),
  ]);
  arm.addEventListener('click', () => {
    deps.store.armCapture(!isArmed);
    deps.refresh();
  });

  const isDryRunning = state.dryRun !== null;

  const dryRun = el('button', { class: `bhb-btn ${isDryRunning ? 'is-busy' : ''}` }, [
    el('span', { text: isDryRunning ? t('steps.dryRunStop') : t('steps.dryRun') }),
  ]);
  dryRun.addEventListener('click', () => {
    if (isDryRunning) {
      deps.dryRunner.stop();
    } else {
      deps.dryRunner.start();
    }
    deps.refresh();
  });

  const pin = el('button', {
    class: `bhb-btn ${state.areMarkersPinned ? 'is-busy' : ''}`,
    text: t('steps.pinMarkers'),
  });
  pin.addEventListener('click', () => {
    deps.store.pinMarkers(!state.areMarkersPinned);
    deps.refresh();
  });

  const capture = el('button', { class: 'bhb-btn bhb-btn--primary' }, [
    el('span', { class: 'bhb-btn__dot' }),
    el('span', { text: t('steps.capture') }),
  ]);
  capture.addEventListener('click', async () => {
    await deps.stepEditor.captureAtCursor();
    deps.refresh();
  });

  const filterSelect = el('select', { class: 'bhb-rule__gate', title: t('steps.filter') });
  const filterOptions = [['', t('steps.allSteps')], ['', t('steps.loose')]];
  filterOptions[0][0] = '__all__';
  for (const [value, label] of filterOptions) {
    const option = el('option', { text: label });
    option.value = value;
    filterSelect.append(option);
  }
  for (const activity of activities) {
    const option = el('option', { text: activity.name });
    option.value = activity.id;
    filterSelect.append(option);
  }
  filterSelect.value = filter === null ? '__all__' : filter;
  filterSelect.addEventListener('change', () => {
    deps.store.setRuleFilter(filterSelect.value === '__all__' ? null : filterSelect.value);
    deps.refresh();
  });

  // Moving twenty steps one dropdown at a time is the same choice twenty times.
  const moveAll = el('select', { class: 'bhb-rule__gate', title: t('steps.moveAll') });
  const movePrompt = el('option', { text: t('steps.moveAll') });
  movePrompt.value = '__none__';
  moveAll.append(movePrompt);
  const looseTarget = el('option', { text: t('steps.noActivity') });
  looseTarget.value = '';
  moveAll.append(looseTarget);
  for (const activity of activities) {
    const option = el('option', { text: activity.name });
    option.value = activity.id;
    moveAll.append(option);
  }
  moveAll.value = '__none__';
  moveAll.disabled = steps.length === 0;
  moveAll.addEventListener('change', () => {
    if (moveAll.value === '__none__') {
      return;
    }
    const target = moveAll.value || null;
    for (const step of steps) {
      deps.stepEditor.setActivity(step.id, target);
    }
    deps.refresh();
  });

  // A legacy step cannot be rescaled, so it clicks the wrong place the moment
  // the window moves — loud enough to act on, not a ⚠ to squint at.
  const legacyCount = all.filter((step) => step.points[0] && isLegacyPoint(step.points[0])).length;

  const head = el('div', { class: 'bhb-field' }, [
    el('div', { class: 'bhb-field__head' }, [
      el('span', { class: 'bhb-label', text: `${t('overlay.steps')} · ${steps.length}` }),
      filterSelect,
    ]),
    el('div', { class: 'bhb-btnrow' }, [moveAll]),
    arm,
    capture,
    el('div', { class: 'bhb-btnrow' }, [dryRun, pin]),
    el('p', { class: 'bhb-note', text: t('steps.captureHint') }),
    el('p', { class: 'bhb-note', text: t('steps.armHint') }),
    el('p', { class: 'bhb-note', text: t('steps.dryRunHint') }),
    legacyCount > 0
      ? el('p', { class: 'bhb-note bhb-note--warn', text: t('steps.legacyWarning', { n: legacyCount }) })
      : null,
  ]);

  if (steps.length === 0) {
    return el('div', { class: 'bhb-tab' }, [head, el('p', { class: 'bhb-empty', text: t('overlay.noSteps') })]);
  }

  rows.clear();
  const stepRows = steps.map((step, index) => {
    const point = step.points[0];
    const legacy = point && isLegacyPoint(point);

    const name = el('input', { class: 'bhb-rule__name' });
    name.value = step.label || '';
    name.placeholder = t('steps.unnamed');
    name.addEventListener('change', () => {
      deps.stepEditor.rename(step.id, name.value.trim());
      deps.refresh();
    });

    const slot = el('select', { class: 'bhb-rule__gate', title: t('steps.activity') });
    const loose = el('option', { text: t('steps.noActivity') });
    loose.value = '';
    slot.append(loose);
    for (const activity of activities) {
      const option = el('option', { text: activity.name });
      option.value = activity.id;
      slot.append(option);
    }
    slot.value = step.activity || '';
    slot.addEventListener('change', () => {
      deps.stepEditor.setActivity(step.id, slot.value || null);
      deps.refresh();
    });

    const gate = el('select', { class: 'bhb-rule__gate', title: t('steps.screenGate') });
    gate.append(el('option', { text: t('steps.anywhere') }));
    gate.options[0].value = '';
    for (const screen of deps.getScreens()) {
      const option = el('option', { text: screen.name || screen.id });
      option.value = screen.id;
      gate.append(option);
    }
    gate.value = (step.screens && step.screens[0]) || '';
    gate.addEventListener('change', () => {
      deps.stepEditor.setScreens(step.id, gate.value ? [gate.value] : []);
      deps.refresh();
    });

    const toggle = el('button', {
      class: `bhb-icon ${step.enabled ? 'is-on' : ''}`,
      title: t(step.enabled ? 'steps.disable' : 'steps.enable'),
      text: step.enabled ? '◉' : '○',
    });
    toggle.addEventListener('click', () => {
      deps.stepEditor.setEnabled(step.id, !step.enabled);
      deps.refresh();
    });

    const up = el('button', { class: 'bhb-icon', title: t('steps.moveUp'), text: '▲' });
    up.addEventListener('click', () => {
      deps.stepEditor.move(step.id, -1);
      deps.refresh();
    });

    const down = el('button', { class: 'bhb-icon', title: t('steps.moveDown'), text: '▼' });
    down.addEventListener('click', () => {
      deps.stepEditor.move(step.id, 1);
      deps.refresh();
    });

    const remove = el('button', { class: 'bhb-icon bhb-icon--danger', title: t('steps.delete'), text: '✕' });
    remove.addEventListener('click', () => {
      deps.stepEditor.remove(step.id);
      deps.store.forgetStep(step.id);
      deps.refresh();
    });

    // Three behaviours, one control: click it, click it only if it is there,
    // or hold here while it is there. The third is how "wait for a third
    // player" is expressed — the empty slot's button is the colour to wait out.
    const behaviour = el('select', { class: 'bhb-rule__gate', title: t('steps.behaviourHint') });
    for (const [value, labelKey] of [
      ['click', 'steps.kindClick'],
      ['optional', 'steps.kindOptional'],
      ['wait', 'steps.kindWait'],
    ]) {
      const option = el('option', { text: t(labelKey) });
      option.value = value;
      behaviour.append(option);
    }
    behaviour.value =
      step.kind === StepKind.WAIT ? 'wait' : step.optional ? 'optional' : 'click';
    behaviour.addEventListener('change', () => {
      deps.stepEditor.setBehaviour(step.id, {
        kind: behaviour.value === 'wait' ? StepKind.WAIT : StepKind.CLICK,
        optional: behaviour.value === 'optional',
      });
      deps.refresh();
    });

    // A dungeon run lasts a minute; the step that starts one says how long to
    // stop looking, rather than the bot re-reading the same frame throughout.
    const rest = el('input', { class: 'bhb-rest bhb-mono', title: t('steps.restHint') });
    rest.type = 'number';
    rest.min = '0';
    rest.max = '600';
    rest.value = String(step.restSec || 0);
    rest.addEventListener('change', () => {
      deps.stepEditor.setRest(step.id, rest.value);
      deps.refresh();
    });

    const places = pointsByPlace(step);
    const isWait = step.kind === StepKind.WAIT;

    // A wait can watch several places at once, and then it is a count that
    // matters: four empty party slots, at most two of them still empty.
    const addPlace = el('button', {
      class: 'bhb-icon',
      title: t('steps.addPlace'),
      text: '＋',
    });
    addPlace.addEventListener('click', () => {
      // Out of the way, then the next X lands on this step.
      deps.store.awaitPlaceFor(step.id);
      deps.store.armCapture(true);
      deps.store.closePanel();
      deps.refresh();
    });

    const threshold = el('input', { class: 'bhb-rest bhb-mono', title: t('steps.maxMatchesHint') });
    threshold.type = 'number';
    threshold.min = '0';
    threshold.max = '20';
    threshold.value = String(step.maxMatches || 0);
    threshold.addEventListener('change', () => {
      deps.stepEditor.setMaxMatches(step.id, threshold.value);
      deps.refresh();
    });

    const placeCount = el('span', {
      class: 'bhb-note bhb-mono',
      title: t('steps.placeCount'),
      text: places.length > 1 ? `×${places.length}` : '',
    });

    const classes = ['bhb-step', 'bhb-step--stacked'];
    if (step.id === expectedStepId) {
      classes.push('is-next');
    }
    if (!step.enabled) {
      classes.push('is-off');
    }
    if (state.selectedStepId === step.id) {
      classes.push('is-selected');
    }
    if (state.hoveredStepId === step.id) {
      classes.push('is-hovered');
    }

    const row = el('div', { class: classes.join(' ') }, [
      el('div', { class: 'bhb-rule__main' }, [
        el('span', { class: 'bhb-rule__n', text: String(index + 1) }),
        el('span', { class: 'bhb-rule__swatch', style: { background: step.hex || 'transparent' } }),
        name,
        el('span', { class: 'bhb-rule__actions' }, [addPlace, toggle, up, down, remove]),
      ]),
      el('div', { class: 'bhb-rule__meta' }, [
        behaviour,
        placeCount,
        isWait ? threshold : rest,
        el('span', { class: 'bhb-rule__meta-coord' }, [
          el('span', {
            class: 'bhb-rule__coord bhb-mono',
            text: point ? `${point.x},${point.y}` : '—',
          }),
          legacy
            ? el('span', {
                class: 'bhb-rule__legacy',
                title: t('overlay.needsRecapture'),
                text: `⚠ ${t('steps.legacyBadge')}`,
              })
            : null,
        ]),
        activities.length > 0 ? slot : null,
        deps.getScreens().length > 0 ? gate : null,
      ]),
    ]);

    row.addEventListener('mouseenter', () => deps.store.hoverStep(step.id));
    row.addEventListener('mouseleave', () => deps.store.hoverStep(null));
    row.addEventListener('click', () => deps.store.selectStep(step.id));

    rows.set(step.id, row);
    return row;
  });

  return el('div', { class: 'bhb-tab' }, [head, el('div', { class: 'bhb-steps' }, stepRows)]);
}
