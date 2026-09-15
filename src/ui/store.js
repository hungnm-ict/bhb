import { createEmitter } from '../core/events.js';

/**
 * UI state, separate from the DOM.
 *
 * Every view reads from here and re-renders on `change`; nothing reads another
 * view's internals. Keeping it DOM-free is also what makes it testable without
 * jsdom.
 */

export const Tab = Object.freeze({
  TASKS: 'tasks',
  RULES: 'rules',
  SCREENS: 'screens',
  SETTINGS: 'settings',
  LOG: 'log',
  HELP: 'help',
});

/** Entries beyond this are dropped. The log describes a session, not history. */
export const LOG_LIMIT = 200;

export function createUiStore() {
  const emitter = createEmitter();

  const state = {
    panelOpen: false,
    tab: Tab.TASKS,
    /** @type {string | null} */
    selectedRuleId: null,
    /** @type {string | null} rule under the cursor, in the table or on canvas */
    hoveredRuleId: null,
    /** @type {string | null} activity id shown in the rules table; null is all */
    ruleFilter: null,
    /** @type {object[]} newest first */
    log: [],
  };

  /**
   * Hover and selection change nothing but which row is lit, so they are
   * announced separately: rebuilding the panel on every mouseenter replaced
   * the row under the cursor twice a second and felt like lag.
   */
  const HIGHLIGHT_KEYS = new Set(['selectedRuleId', 'hoveredRuleId']);

  function emit() {
    emitter.emit('change', state);
  }

  /** Assign only if something actually differs, so views do not churn. */
  function patch(changes) {
    const changed = [];
    for (const [key, value] of Object.entries(changes)) {
      if (state[key] !== value) {
        state[key] = value;
        changed.push(key);
      }
    }
    if (changed.length === 0) {
      return false;
    }
    if (changed.every((key) => HIGHLIGHT_KEYS.has(key))) {
      emitter.emit('highlight', state);
    } else {
      emit();
    }
    return true;
  }

  return {
    get: () => state,
    subscribe: (handler) => emitter.on('change', handler),
    onHighlight: (handler) => emitter.on('highlight', handler),

    openPanel: () => patch({ panelOpen: true }),
    closePanel: () => patch({ panelOpen: false, hoveredRuleId: null }),
    togglePanel: () => patch({ panelOpen: !state.panelOpen }),
    setTab: (tab) => patch({ tab, panelOpen: true }),

    setRuleFilter: (activityId) => patch({ ruleFilter: activityId }),

    selectRule: (id) => patch({ selectedRuleId: id }),
    hoverRule: (id) => patch({ hoveredRuleId: id }),

    /** Drop any reference to a rule that no longer exists. */
    forgetRule(id) {
      patch({
        selectedRuleId: state.selectedRuleId === id ? null : state.selectedRuleId,
        hoveredRuleId: state.hoveredRuleId === id ? null : state.hoveredRuleId,
      });
    },

    /** @param {object} entry an engine action event */
    log(entry) {
      state.log.unshift(entry);
      if (state.log.length > LOG_LIMIT) {
        state.log.length = LOG_LIMIT;
      }
      emit();
    },

    clearLog() {
      if (state.log.length === 0) {
        return;
      }
      state.log = [];
      emit();
    },

    /** Markers would swallow the game's clicks if they outlived the tab. */
    markersVisible() {
      return state.panelOpen && state.tab === Tab.RULES;
    },
  };
}
