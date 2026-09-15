import { el } from '../dom.js';
import { t } from '../../i18n/index.js';
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

  const capture = el('button', { class: 'bhb-btn bhb-btn--primary' }, [
    el('span', { class: 'bhb-btn__dot' }),
    el('span', { text: t('steps.capture') }),
    el('span', { class: 'bhb-kbd', text: '0' }),
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

  // A legacy step cannot be rescaled, so it clicks the wrong place the moment
  // the window moves — loud enough to act on, not a ⚠ to squint at.
  const legacyCount = all.filter((step) => step.points[0] && isLegacyPoint(step.points[0])).length;

  const head = el('div', { class: 'bhb-field' }, [
    el('div', { class: 'bhb-field__head' }, [
      el('span', { class: 'bhb-label', text: `${t('overlay.steps')} · ${steps.length}` }),
      filterSelect,
    ]),
    capture,
    el('p', { class: 'bhb-note', text: t('steps.captureHint') }),
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
        el('span', { class: 'bhb-rule__actions' }, [toggle, up, down, remove]),
      ]),
      el('div', { class: 'bhb-rule__meta' }, [
        el('span', {
          class: 'bhb-rule__coord bhb-mono',
          title: legacy ? t('overlay.needsRecapture') : '',
          text: point ? `${point.x},${point.y}${legacy ? ' ⚠' : ''}` : '—',
        }),
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
