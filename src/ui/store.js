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
  STEPS: 'steps',
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
    selectedStepId: null,
    /** @type {string | null} step under the cursor, in the table or on canvas */
    hoveredStepId: null,
    /** @type {string | null} activity id shown in the steps table; null is all */
    stepFilter: null,
    /**
     * Whether the capture hotkey is armed.
     *
     * Off on every load, and deliberately not persisted: the key sits next to
     * the ones that drive the bot, and a session that starts armed is a stray
     * `0` mid-fight that captures whatever happened to be under the cursor.
     */
    isCaptureArmed: false,

    /** All markers at once; off by default, so the game stays readable. */
    areMarkersPinned: false,

    /**
     * A dry run in progress: which step it is on, and what it found.
     *
     * @type {{ index: number, scores: Record<string, string> } | null}
     */
    dryRun: null,

    /** @type {object[]} newest first */
    log: [],
  };

  /**
   * Hover and selection change nothing but which row is lit, so they are
   * announced separately: rebuilding the panel on every mouseenter replaced
   * the row under the cursor twice a second and felt like lag.
   */
  const HIGHLIGHT_KEYS = new Set(['selectedStepId', 'hoveredStepId']);

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
    closePanel: () => patch({ panelOpen: false, hoveredStepId: null }),
    togglePanel: () => patch({ panelOpen: !state.panelOpen }),
    setTab: (tab) => patch({ tab, panelOpen: true }),

    setRuleFilter: (activityId) => patch({ stepFilter: activityId }),

    armCapture: (armed) => patch({ isCaptureArmed: armed }),

    pinMarkers: (pinned) => patch({ areMarkersPinned: pinned }),

    /** @param {{ index: number, scores: Record<string, string> } | null} run */
    setDryRun(run) {
      state.dryRun = run;
      emit();
    },

    selectStep: (id) => patch({ selectedStepId: id }),
    hoverStep: (id) => patch({ hoveredStepId: id }),

    /** Drop any reference to a step that no longer exists. */
    forgetStep(id) {
      patch({
        selectedStepId: state.selectedStepId === id ? null : state.selectedStepId,
        hoveredStepId: state.hoveredStepId === id ? null : state.hoveredStepId,
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

    /**
     * Markers would swallow the game's clicks if they outlived the tab, and
     * drawing all of them all the time buried the game under numbers. They are
     * shown on demand: pinned, during a dry run, or under the cursor.
     */
    markersVisible() {
      if (!state.panelOpen || state.tab !== Tab.STEPS) {
        return false;
      }
      return (
        state.areMarkersPinned || state.dryRun !== null || state.hoveredStepId !== null
      );
    },

    /** Which steps the marker layer should draw, of the ones it could. */
    markerFilter() {
      if (state.areMarkersPinned || state.dryRun !== null) {
        return null;
      }
      return state.hoveredStepId;
    },
  };
}
