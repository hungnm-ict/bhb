import { el, mount } from './dom.js';
import { t } from '../i18n/index.js';
import { getSpeed } from '../core/speed.js';
import { TaskId, Phase } from '../core/engine.js';
import { isLegacyPoint } from '../core/coords.js';

/**
 * Status overlay: the top-right panel.
 *
 * Cycles expanded → compact → hidden. A feature that needs the whole panel
 * (World Boss party) installs a custom renderer rather than this module
 * learning about it.
 */

export const OverlayState = Object.freeze({
  EXPANDED: 'expanded',
  COMPACT: 'compact',
  HIDDEN: 'hidden',
});

const CYCLE = [OverlayState.EXPANDED, OverlayState.COMPACT, OverlayState.HIDDEN];

const TASK_LABELS = {
  [TaskId.RERUN]: 'task.rerun',
  [TaskId.WORLD_BOSS]: 'task.wb',
  [TaskId.SCRIPT]: 'task.script',
};

const TASK_KEYS = {
  [TaskId.RERUN]: '3',
  [TaskId.WORLD_BOSS]: '4',
  [TaskId.SCRIPT]: '5',
};

/**
 * @param {object} deps
 * @param {() => object} deps.getEngineState
 * @param {() => import('../rules/model.js').Rule[]} deps.getRules
 * @param {() => string} deps.getProfileName
 */
export function createOverlay(deps) {
  let state = OverlayState.COMPACT;
  /** @type {HTMLElement | null} */
  let panel = null;
  /** @type {(() => HTMLElement | null) | null} */
  let customRenderer = null;

  function ensurePanel() {
    if (!panel) {
      panel = mount(el('div', { class: 'bhb-panel bhb-overlay' }));
    }
    return panel;
  }

  function formatRemaining(ms) {
    const total = Math.floor(ms / 1000);
    const minutes = Math.floor(total / 60);
    const seconds = String(total % 60).padStart(2, '0');
    return `${minutes}m${seconds}s`;
  }

  function taskClass(engine, taskId) {
    return engine.activeTask === taskId ? 'bhb-task--on' : 'bhb-task--off';
  }

  function renderCompact(engine) {
    const node = ensurePanel();
    node.className = 'bhb-panel bhb-overlay';

    const speed = getSpeed();
    const chips = Object.keys(TASK_LABELS).map((taskId) =>
      el('span', { class: `bhb-row ${taskClass(engine, taskId)}`, style: { gap: '5px', fontWeight: '700' } }, [
        el('span', { class: 'bhb-dot bhb-dot--sm' }),
        t(TASK_LABELS[taskId]),
      ])
    );

    node.replaceChildren(
      el('div', { class: 'bhb-row bhb-row--compact' }, [
        ...chips,
        el('span', {
          class: `bhb-speed ${speed > 1 ? 'bhb-speed--boosted' : 'bhb-speed--normal'}`,
          text: `${speed}×`,
        }),
        el('span', { class: 'bhb-hint', text: `1 ${t('overlay.help')} · 2 ⬜` }),
      ])
    );
  }

  function renderRuleList(rules) {
    if (rules.length === 0) {
      return [el('div', { class: 'bhb-rule bhb-rule--pending', text: t('overlay.noRules') })];
    }

    return rules.map((rule, index) => {
      const first = rule.points[0];
      const legacy = first && isLegacyPoint(first);

      let modifier = 'bhb-rule--ready';
      let label = rule.hex ?? '';

      if (!rule.hex) {
        modifier = 'bhb-rule--pending';
        label = t('overlay.awaitingColor');
      } else if (!rule.enabled) {
        modifier = 'bhb-rule--disabled';
      } else if (legacy) {
        modifier = 'bhb-rule--legacy';
        label = `${rule.hex} ⚠`;
      }

      return el('div', { class: `bhb-rule ${modifier}` }, [
        el('span', { text: `${index + 1}. ${rule.label || label}` }),
        el('span', {
          class: 'bhb-rule__coord',
          text: first ? `${first.x} ${first.y}` : '—',
        }),
      ]);
    });
  }

  function renderTaskRow(engine, taskId) {
    const active = engine.activeTask === taskId;
    const phase =
      active && taskId === TaskId.RERUN
        ? ` [${t(engine.phase === Phase.RESTING ? 'phase.resting' : 'phase.hunting')}]`
        : '';

    return el('div', { class: `bhb-row ${taskClass(engine, taskId)}`, style: { marginBottom: '3px' } }, [
      el('span', { class: 'bhb-dot' }),
      el('span', {
        class: 'bhb-task',
        text: `${t(TASK_LABELS[taskId])} ${t(active ? 'task.on' : 'task.off')}${phase}`,
      }),
      el('span', { class: 'bhb-key', text: TASK_KEYS[taskId] }),
    ]);
  }

  function renderExpanded(engine) {
    const node = ensurePanel();
    node.className = 'bhb-panel bhb-overlay bhb-overlay--expanded';

    const rules = deps.getRules();
    const speed = getSpeed();

    node.replaceChildren(
      el('div', { class: 'bhb-row bhb-row--between', style: { marginBottom: '7px' } }, [
        el('span', { class: 'bhb-title', text: `${t('app.name')} ${t('app.tagline')}` }),
        el('span', { class: 'bhb-muted', text: deps.getProfileName() }),
      ]),

      ...Object.keys(TASK_LABELS).map((taskId) => renderTaskRow(engine, taskId)),

      el('div', { class: 'bhb-row bhb-row--between bhb-section' }, [
        el('span', { class: 'bhb-muted', text: t('overlay.speed') }),
        el('span', {
          class: `bhb-speed ${speed > 1 ? 'bhb-speed--boosted' : 'bhb-speed--normal'}`,
          text: `${speed}×`,
        }),
      ]),

      el('div', { class: 'bhb-row bhb-row--between' }, [
        el('span', { class: 'bhb-muted', text: t('overlay.autoStop') }),
        el('span', {
          class: 'bhb-muted',
          style: { color: engine.activeTask ? '#ffaa33' : '#666' },
          text: engine.activeTask
            ? `${t('overlay.remaining')} ${formatRemaining(engine.remainingMs)}`
            : '---',
        }),
      ]),

      el('div', { class: 'bhb-section' }, [
        el('div', { class: 'bhb-section__label', text: `${t('overlay.rules')} (${rules.length})` }),
        ...renderRuleList(rules),
      ]),

      el('div', { class: 'bhb-row bhb-row--between bhb-section bhb-hint' }, [
        el('span', { text: `1 · ${t('overlay.help')}` }),
        el('span', { text: `2 · ${t('overlay.collapse')}` }),
      ]),

      el('div', { class: 'bhb-section' }, [
        el('div', { class: 'bhb-message', text: engine.lastMessage || ' ' }),
      ])
    );
  }

  function render() {
    if (customRenderer) {
      const handled = customRenderer(ensurePanel());
      if (handled !== false) {
        return;
      }
    }

    const node = ensurePanel();

    if (state === OverlayState.HIDDEN) {
      node.style.display = 'none';
      return;
    }
    node.style.display = 'block';

    const engine = deps.getEngineState();
    if (state === OverlayState.EXPANDED) {
      renderExpanded(engine);
    } else {
      renderCompact(engine);
    }
  }

  function cycle() {
    state = CYCLE[(CYCLE.indexOf(state) + 1) % CYCLE.length];
    render();
  }

  /** A feature can own the panel; pass null to hand it back. */
  function setCustomRenderer(renderer) {
    customRenderer = renderer;
    render();
  }

  return { render, cycle, setCustomRenderer, getState: () => state };
}
