/**
 * BHB
 *
 * Entry point. Load order matters and is enforced here:
 *
 *  1. `installCanvasPatch` before Unity creates its WebGL context, or the
 *     framebuffer cannot be read at all.
 *  2. `timers.js` (imported by `speed.js`) captures the native timers before
 *     the speed hack replaces the globals.
 *  3. Everything else once the DOM is ready.
 */

import { SPEED_STEPS, RESUME_DELAY } from './core/constants.js';
import { installCanvasPatch } from './core/canvas.js';
import { installFocusPatch } from './core/focus.js';
import {
  installSpeedHack,
  getSpeed,
  setSpeed,
  onSpeedChange,
  speedIndex,
  pumpFrame,
} from './core/speed.js';
import { installKeepAlive } from './core/keepalive.js';
import { createEngine, TaskId } from './core/engine.js';
import { setClickObserver } from './core/input.js';
import {
  loadProfiles,
  saveProfiles,
  getActiveProfile,
  loadSettings,
  saveSettings,
  createProfile,
  duplicateProfile,
  renameProfile,
  deleteProfile,
  setActiveProfile,
  exportProfiles,
  importProfiles,
} from './core/storage.js';
import { createWatchdog } from './core/watchdog.js';
import { RERUN_STEPS, WORLD_BOSS_STEPS } from './bot/builtin.js';
import { createStepEditor } from './bot/step-editor.js';
import { createScreenEditor } from './bot/screen-editor.js';
import { createQueueEditor } from './bot/queue-editor.js';
import { setLanguage } from './i18n/index.js';
import { installStyles } from './ui/styles.js';
import { createUiStore, Tab } from './ui/store.js';
import { createHud } from './ui/hud.js';
import { createPanel } from './ui/panel/index.js';
import { createMarkerLayer } from './ui/markers.js';
import { createSizeBadge } from './ui/size-badge.js';
import { installHotkeys } from './ui/hotkeys.js';
import { showClickFlash } from './ui/flash.js';
import { realSetInterval, realClearInterval, realSetTimeout, realNow } from './core/timers.js';
import { getCanvas } from './core/canvas.js';

// --- Phase 1: patches that must beat the game to the punch -----------------
installCanvasPatch();
installFocusPatch();
installSpeedHack();

/** Redraw cadence for the countdown and status text. */
const UI_REFRESH_MS = 500;

function bootstrap() {
  installStyles();

  const settings = loadSettings();
  setLanguage(settings.language);

  const profileState = loadProfiles();
  const getSteps = () => getActiveProfile(profileState).steps;
  const getScreens = () => getActiveProfile(profileState).screens;
  const getActivities = () => getActiveProfile(profileState).activities;
  const persist = () => saveProfiles(profileState);

  const store = createUiStore();
  const watchdog = createWatchdog();

  const engine = createEngine({
    getScriptSteps: getSteps,
    getRerunSteps: () => RERUN_STEPS,
    getWorldBossSteps: () => WORLD_BOSS_STEPS,
    getScaleMode: () => settings.scaleMode,
    getScreens,
    getActivities,
    shouldCloseAfterRound: () => settings.closeAfterRound,
    closeGame: () => window.close(),
    shouldRecoverFromHang: () => settings.watchdog,
    recoverFromHang: (task) => watchdog.recover(task),
  });

  const stepEditor = createStepEditor({
    getSteps,
    persist,
    report: engine.setMessage,
  });

  const screenEditor = createScreenEditor({
    getScreens,
    persist,
    report: engine.setMessage,
    getScaleMode: () => settings.scaleMode,
  });

  const queueEditor = createQueueEditor({ getActivities, persist });

  // One renderer for all three views: any change redraws whatever is showing.
  const refresh = () => {
    hud.render();
    panel.render();
    markers.render();
    sizeBadge.render();
  };

  /** Tabs whose contents change on their own: a countdown, a live probe. */
  const LIVE_TABS = new Set([Tab.TASKS, Tab.SCREENS]);

  const refreshLive = () => {
    hud.render();
    sizeBadge.render();
    const state = store.get();
    if (state.panelOpen && LIVE_TABS.has(state.tab)) {
      panel.render();
    }
  };

  const hud = createHud({ getEngineState: engine.getState, store });

  const profileActions = {
    list: () => profileState.profiles.map(({ id, name }) => ({ id, name })),
    activeId: () => getActiveProfile(profileState).id,
    activeName: () => getActiveProfile(profileState).name,
    create: (name) => {
      createProfile(profileState, name);
      persist();
    },
    duplicate: () => {
      duplicateProfile(profileState);
      persist();
    },
    rename: (id, name) => {
      renameProfile(profileState, id, name);
      persist();
    },
    remove: (id) => {
      deleteProfile(profileState, id);
      persist();
    },
    setActive: (id) => {
      setActiveProfile(profileState, id);
      persist();
    },
    exportAll: () => exportProfiles(profileState),
    importAll: (json) => {
      const imported = importProfiles(json);
      profileState.version = imported.version;
      profileState.activeProfileId = imported.activeProfileId;
      profileState.profiles = imported.profiles;
      persist();
    },
  };

  const panel = createPanel({
    store,
    stepEditor,
    screenEditor,
    queueEditor,
    getSteps,
    getScreens,
    getActivities,
    getCloseAfterRound: () => settings.closeAfterRound,
    setCloseAfterRound: (value) => {
      settings.closeAfterRound = value;
      saveSettings(settings);
    },
    profiles: profileActions,
    settings,
    getReloadCount: () => watchdog.reloadCount(),
    updateSettings: (changes) => {
      Object.assign(settings, changes);
      saveSettings(settings);
      if (changes.language) {
        setLanguage(changes.language);
      }
    },
    getEngineState: engine.getState,
    toggleTask: engine.toggle,
    getProfileName: () => getActiveProfile(profileState).name,
    refresh: () => refresh(),
  });

  const markers = createMarkerLayer({
    getSteps,
    getScaleMode: () => settings.scaleMode,
    store,
  });

  const sizeBadge = createSizeBadge({ isVisible: () => settings.sizeBadge });

  // A window covered edge to edge stops getting animation frames, and the game
  // stops with them. This drives the loop by hand when that happens.
  if (settings.keepAlive) {
    installKeepAlive(() => pumpFrame());
  }

  setClickObserver(showClickFlash);
  engine.on('change', () => refresh());
  engine.on('action', (entry) => {
    store.log(entry);
    // The watchdog only needs to know two things: what to come back to, and
    // whether the game is still answering.
    if (entry.kind === 'task') {
      if (entry.started) {
        watchdog.arm(entry.label);
      } else {
        watchdog.disarm();
      }
    }
    if (entry.kind === 'click') {
      watchdog.noteProgress();
    }
  });
  store.subscribe(() => refresh());
  // Hover and selection only light a row, so they never rebuild the panel.
  store.onHighlight(() => {
    panel.highlight();
    markers.highlight();
  });
  onSpeedChange(() => refresh());

  installHotkeys({
    // The keyboard reference has no key of its own; it opens from the panel.
    '1': () => store.togglePanel(),
    '3': () => engine.toggle(TaskId.RERUN),
    '4': () => engine.toggle(TaskId.WORLD_BOSS),
    '5': () => engine.toggle(TaskId.SCRIPT),
    '6': () => engine.toggle(TaskId.RUN_ALL),
    '0': () => stepEditor.captureAtCursor().then(refresh),
    '=': () => setSpeed(nextSpeedStep(getSpeed(), 1)),
    '+': () => setSpeed(nextSpeedStep(getSpeed(), 1)),
    '-': () => setSpeed(nextSpeedStep(getSpeed(), -1)),
  });

  refresh();
  hud.wake();
  // Only the tabs that show live numbers are worth redrawing on a timer.
  // Redrawing the steps table twice a second ate the caret out of its inputs.
  realSetInterval(refreshLive, UI_REFRESH_MS);
  // Markers are positioned from the live canvas box, so a resize moves them.
  const onCanvasMoved = () => {
    markers.render();
    sizeBadge.render();
  };

  window.addEventListener('resize', onCanvasMoved);
  // The game can resize its own canvas without the window moving — a fullscreen
  // toggle, a layout change — and markers pinned to the old box would lie.
  const canvas = getCanvas();
  if (canvas && typeof ResizeObserver === 'function') {
    new ResizeObserver(onCanvasMoved).observe(canvas);
  }

  resumeAfterReload(engine, watchdog);

  console.info('[BHB] ready — press 1 for the keyboard reference');
}

/**
 * Pick up where a reload left off.
 *
 * The delay is the game's own load time plus whatever clicking through a login
 * screen takes; starting into that would only burn the watchdog's patience.
 */
function resumeAfterReload(engine, watchdog) {
  const task = watchdog.taskToResume();
  if (!task) {
    return;
  }

  engine.setMessage(`resuming ${task} in ${RESUME_DELAY / 1000}s`);
  realSetTimeout(() => {
    if (!engine.getState().activeTask) {
      engine.start(task);
    }
  }, RESUME_DELAY);
}

/**
 * Wait for this frame to contain the game canvas.
 *
 * The host page embeds the game in an iframe, so the script runs in both the outer
 * page and the frame. Only one of them has a canvas, and building the UI in
 * both would stack two overlays and two sets of hotkeys on top of each other.
 * A frame that never gets a canvas simply does nothing.
 *
 * The patches above still run everywhere: at document-start there is no way to
 * tell which frame Unity will load into, and the canvas patch has to be in
 * place before it does.
 *
 * @param {() => void} onReady
 */
function whenCanvasAppears(onReady) {
  const POLL_MS = 300;
  const GIVE_UP_MS = 5 * 60 * 1000;

  if (getCanvas()) {
    onReady();
    return;
  }

  const startedAt = realNow();
  const timer = realSetInterval(() => {
    if (getCanvas()) {
      realClearInterval(timer);
      onReady();
    } else if (realNow() - startedAt > GIVE_UP_MS) {
      realClearInterval(timer);
    }
  }, POLL_MS);
}

// --- Phase 2: wire up the UI, but only in the frame holding the game -------
function start() {
  whenCanvasAppears(bootstrap);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}

/** The hotkeys walk the slider's stops rather than adding a fixed amount. */
function nextSpeedStep(current, direction) {
  const index = speedIndex(current) + direction;
  const bounded = Math.max(0, Math.min(SPEED_STEPS.length - 1, index));
  return SPEED_STEPS[bounded];
}
