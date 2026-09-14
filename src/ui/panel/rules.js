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
 * @param {object} deps.editor
 * @param {() => void} deps.refresh
 */
export function renderRulesTab(deps) {
  const rules = deps.getRules();
  const state = deps.store.get();

  const capture = el('button', { class: 'bhb-btn bhb-btn--primary' }, [
    el('span', { class: 'bhb-btn__dot' }),
    el('span', { text: t('rules.capture') }),
    el('span', { class: 'bhb-kbd', text: '0' }),
  ]);
  capture.addEventListener('click', async () => {
    await deps.editor.captureAtCursor();
    deps.refresh();
  });

  const head = el('div', { class: 'bhb-field' }, [
    el('div', { class: 'bhb-field__head' }, [
      el('span', { class: 'bhb-label', text: `${t('overlay.rules')} · ${rules.length}` }),
    ]),
    capture,
    el('p', { class: 'bhb-note', text: t('rules.captureHint') }),
  ]);

  if (rules.length === 0) {
    return el('div', { class: 'bhb-tab' }, [head, el('p', { class: 'bhb-empty', text: t('overlay.noRules') })]);
  }

  const rows = rules.map((rule, index) => {
    const point = rule.points[0];
    const legacy = point && isLegacyPoint(point);

    const name = el('input', { class: 'bhb-rule__name' });
    name.value = rule.label || '';
    name.placeholder = t('rules.unnamed');
    name.addEventListener('change', () => {
      deps.editor.rename(rule.id, name.value.trim());
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

    const classes = ['bhb-rule'];
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
      el('span', { class: 'bhb-rule__n', text: String(index + 1) }),
      el('span', { class: 'bhb-rule__swatch', style: { background: rule.hex || 'transparent' } }),
      name,
      el('span', {
        class: 'bhb-rule__coord bhb-mono',
        title: legacy ? t('overlay.needsRecapture') : '',
        text: point ? `${point.x},${point.y}${legacy ? ' ⚠' : ''}` : '—',
      }),
      el('span', { class: 'bhb-rule__actions' }, [toggle, up, down, remove]),
    ]);

    row.addEventListener('mouseenter', () => deps.store.hoverRule(rule.id));
    row.addEventListener('mouseleave', () => deps.store.hoverRule(null));
    row.addEventListener('click', () => deps.store.selectRule(rule.id));

    return row;
  });

  return el('div', { class: 'bhb-tab' }, [head, el('div', { class: 'bhb-rules' }, rows)]);
}
