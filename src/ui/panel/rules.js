import { el } from '../dom.js';
import { t } from '../../i18n/index.js';
import { isLegacyPoint } from '../../core/coords.js';

/**
 * The rules table.
 *
 * Paired with the marker layer: hovering a row lights the marker on the canvas
 * and the other way round, which is how a bare coordinate becomes a place.
 */

/**
 * @param {object} deps
 * @param {() => import('../../rules/model.js').Rule[]} deps.getRules
 * @param {ReturnType<import('../store.js').createUiStore>} deps.store
 * @param {() => import('../../rules/screen.js').Screen[]} deps.getScreens
 * @param {() => import('../../rules/activity.js').Activity[]} deps.getActivities
 * @param {object} deps.editor
 * @param {() => void} deps.refresh
 */
/** @type {Map<string, HTMLElement>} rule id to its row, for highlighting */
const rows = new Map();

/** Lighting a row is a class change; it never needs the table rebuilt. */
export function highlightRules(state) {
  for (const [ruleId, row] of rows) {
    row.classList.toggle('is-selected', state.selectedRuleId === ruleId);
    row.classList.toggle('is-hovered', state.hoveredRuleId === ruleId);
  }
}

export function renderRulesTab(deps) {
  const all = deps.getRules();
  const state = deps.store.get();
  const activities = deps.getActivities();
  // Eight activities' rules in one list is unreadable, so the table is filtered.
  const filter = state.ruleFilter;
  const rules = filter === null ? all : all.filter((rule) => (rule.activity || '') === filter);

  const capture = el('button', { class: 'bhb-btn bhb-btn--primary' }, [
    el('span', { class: 'bhb-btn__dot' }),
    el('span', { text: t('rules.capture') }),
    el('span', { class: 'bhb-kbd', text: '0' }),
  ]);
  capture.addEventListener('click', async () => {
    await deps.editor.captureAtCursor();
    deps.refresh();
  });

  const filterSelect = el('select', { class: 'bhb-rule__gate', title: t('rules.filter') });
  const filterOptions = [['', t('rules.allRules')], ['', t('rules.loose')]];
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

  const head = el('div', { class: 'bhb-field' }, [
    el('div', { class: 'bhb-field__head' }, [
      el('span', { class: 'bhb-label', text: `${t('overlay.rules')} · ${rules.length}` }),
      filterSelect,
    ]),
    capture,
    el('p', { class: 'bhb-note', text: t('rules.captureHint') }),
  ]);

  if (rules.length === 0) {
    return el('div', { class: 'bhb-tab' }, [head, el('p', { class: 'bhb-empty', text: t('overlay.noRules') })]);
  }

  rows.clear();
  const ruleRows = rules.map((rule, index) => {
    const point = rule.points[0];
    const legacy = point && isLegacyPoint(point);

    const name = el('input', { class: 'bhb-rule__name' });
    name.value = rule.label || '';
    name.placeholder = t('rules.unnamed');
    name.addEventListener('change', () => {
      deps.editor.rename(rule.id, name.value.trim());
      deps.refresh();
    });

    const slot = el('select', { class: 'bhb-rule__gate', title: t('rules.activity') });
    const loose = el('option', { text: t('rules.noActivity') });
    loose.value = '';
    slot.append(loose);
    for (const activity of activities) {
      const option = el('option', { text: activity.name });
      option.value = activity.id;
      slot.append(option);
    }
    slot.value = rule.activity || '';
    slot.addEventListener('change', () => {
      deps.editor.setActivity(rule.id, slot.value || null);
      deps.refresh();
    });

    const gate = el('select', { class: 'bhb-rule__gate', title: t('rules.screenGate') });
    gate.append(el('option', { text: t('rules.anywhere') }));
    gate.options[0].value = '';
    for (const screen of deps.getScreens()) {
      const option = el('option', { text: screen.name || screen.id });
      option.value = screen.id;
      gate.append(option);
    }
    gate.value = (rule.screens && rule.screens[0]) || '';
    gate.addEventListener('change', () => {
      deps.editor.setScreens(rule.id, gate.value ? [gate.value] : []);
      deps.refresh();
    });

    const toggle = el('button', {
      class: `bhb-icon ${rule.enabled ? 'is-on' : ''}`,
      title: t(rule.enabled ? 'rules.disable' : 'rules.enable'),
      text: rule.enabled ? '◉' : '○',
    });
    toggle.addEventListener('click', () => {
      deps.editor.setEnabled(rule.id, !rule.enabled);
      deps.refresh();
    });

    const up = el('button', { class: 'bhb-icon', title: t('rules.moveUp'), text: '▲' });
    up.addEventListener('click', () => {
      deps.editor.move(rule.id, -1);
      deps.refresh();
    });

    const down = el('button', { class: 'bhb-icon', title: t('rules.moveDown'), text: '▼' });
    down.addEventListener('click', () => {
      deps.editor.move(rule.id, 1);
      deps.refresh();
    });

    const remove = el('button', { class: 'bhb-icon bhb-icon--danger', title: t('rules.delete'), text: '✕' });
    remove.addEventListener('click', () => {
      deps.editor.remove(rule.id);
      deps.store.forgetRule(rule.id);
      deps.refresh();
    });

    const classes = ['bhb-rule', 'bhb-rule--stacked'];
    if (!rule.enabled) {
      classes.push('is-off');
    }
    if (state.selectedRuleId === rule.id) {
      classes.push('is-selected');
    }
    if (state.hoveredRuleId === rule.id) {
      classes.push('is-hovered');
    }

    const row = el('div', { class: classes.join(' ') }, [
      el('div', { class: 'bhb-rule__main' }, [
        el('span', { class: 'bhb-rule__n', text: String(index + 1) }),
        el('span', { class: 'bhb-rule__swatch', style: { background: rule.hex || 'transparent' } }),
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

    row.addEventListener('mouseenter', () => deps.store.hoverRule(rule.id));
    row.addEventListener('mouseleave', () => deps.store.hoverRule(null));
    row.addEventListener('click', () => deps.store.selectRule(rule.id));

    rows.set(rule.id, row);
    return row;
  });

  return el('div', { class: 'bhb-tab' }, [head, el('div', { class: 'bhb-rules' }, ruleRows)]);
}
