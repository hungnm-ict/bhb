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

import { RESUME_DELAY, DEFAULT_COLOR_TOLERANCE } from './core/constants.js';
import { Keys } from './core/keys.js';
import { installCanvasPatch } from './core/canvas.js';
import { installFocusPatch } from './core/focus.js';
import {
  installSpeedHack,
  getSpeed,
  setSpeed,
  onSpeedChange,
  stepSpeed,
  pumpFrame,
} from './core/speed.js';
import { installKeepAlive } from './core/keepalive.js';
import { createEngine, TaskId, resolveRunTarget } from './core/engine.js';
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
import { createStats } from './core/stats.js';
import { lockCanvasSize, unlockCanvasSize } from './core/canvas-lock.js';
import { createNotifier } from './core/notify.js';
import { createStepEditor } from './bot/step-editor.js';
import { createScreenEditor } from './bot/screen-editor.js';
import { createQueueEditor } from './bot/queue-editor.js';
import { createDryRunner } from './bot/dry-run-runner.js';
import { setLanguage, t } from './i18n/index.js';
import { installStyles } from './ui/styles.js';
import { createUiStore, Tab } from './ui/store.js';
import { createHud } from './ui/hud.js';
import { createPanel } from './ui/panel/index.js';
import { describeEntry } from './ui/panel/log.js';
import { createMarkerLayer } from './ui/markers.js';
import { createProbeLayer } from './ui/probe-layer.js';
import { createProbeEditor } from './bot/probe-editor.js';
import { createSizeBadge } from './ui/size-badge.js';
import { installHotkeys } from './ui/hotkeys.js';
import { showClickFlash } from './ui/flash.js';
import { showToast } from './ui/toast.js';
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
  const stats = createStats();

  const notifier = createNotifier({
    getConfig: () => settings.notify,
    getCanvas,
    report: (message) => engine.setMessage(message),
  });

  const engine = createEngine({
    getScriptSteps: getSteps,
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
    // A filter of null means All steps, and a new step there belongs to nobody.
    getCaptureActivity: () => store.get().stepFilter || null,
    // The status line is in a corner; the user is looking at the button they
    // just pointed at, so the confirmation goes there.
    onCaptured: ({ step, clientX, clientY, isSettled }) => {
      showClickFlash(clientX, clientY);
      showToast({
        clientX,
        clientY,
        text: isSettled ? t('toast.captured', { label: step.label }) : t('toast.capturedUnstable'),
        hex: step.hex,
        isWarning: !isSettled,
      });
    },
  });

  const screenEditor = createScreenEditor({
    getScreens,
    persist,
    report: engine.setMessage,
    getScaleMode: () => settings.scaleMode,
  });

  const queueEditor = createQueueEditor({ getActivities, persist });

  const probeEditor = createProbeEditor({
    getProbes: () => settings.probes,
    setProbes: (probes) => {
      settings.probes = probes;
      saveSettings(settings);
    },
    report: engine.setMessage,
    getTolerance: () => DEFAULT_COLOR_TOLERANCE,
    getScaleMode: () => settings.scaleMode,
    onCaptured: ({ probe, clientX, clientY }) => {
      showClickFlash(clientX, clientY);
      showToast({
        clientX,
        clientY,
        text: t('toast.probeCaptured', { label: probe.label }),
        hex: probe.hex,
      });
    },
  });

  const dryRunner = createDryRunner({
    getSteps,
    getScreens,
    getScaleMode: () => settings.scaleMode,
    onTick: (run) => {
      store.setDryRun(run);
      markers.render();
    },
  });

  // One renderer for all three views: any change redraws whatever is showing.
  const refresh = () => {
    hud.render();
    panel.render();
    markers.render();
    probes.render();
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
    dryRunner,
    probeEditor,
    getProbes: () => settings.probes,
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
    getStats: () => stats.snapshot(),
    resetStats: () => stats.reset(),
    sendTestAlert: () => {
      notifier.clearCooldown();
      return notifier.notify(t('notify.testText'), 'manual', { force: true });
    },
    updateSettings: (changes) => {
      Object.assign(settings, changes);
      saveSettings(settings);
      if (changes.language) {
        setLanguage(changes.language);
      }
      if (changes.canvasLock) {
        applyCanvasLock();
      }
    },
    getEngineState: engine.getState,
    toggleTask: engine.toggle,
    getRunTarget: () => settings.runTarget,
    setRunTarget: (target) => {
      settings.runTarget = target;
      saveSettings(settings);
    },
    runSelected: () => runSelected(),
    runActivity: (activityId) => {
      const engineState = engine.getState();
      if (engineState.activeTask === TaskId.SOLO && engineState.activity === activityId) {
        engine.stop();
        return;
      }
      engine.start(TaskId.SOLO, activityId);
    },
    getProfileName: () => getActiveProfile(profileState).name,
    refresh: () => refresh(),
  });

  /** Start what the Run tab has selected, or stop it if that is what is on. */
  function runSelected() {
    const { taskId, activityId } = resolveRunTarget(settings.runTarget, getActivities());
    const state = engine.getState();
    const isOn =
      state.activeTask === taskId && (taskId !== TaskId.SOLO || state.activity === activityId);
    if (isOn) {
      engine.stop();
      return;
    }
    engine.start(taskId, activityId);
  }

  const markers = createMarkerLayer({
    getSteps,
    getScaleMode: () => settings.scaleMode,
    store,
  });

  const probes = createProbeLayer({
    getProbes: () => settings.probes,
    getScaleMode: () => settings.scaleMode,
    store,
  });

  const sizeBadge = createSizeBadge({ isVisible: () => settings.sizeBadge });

  /** The game rewrites its own layout, so the lock is re-asserted, not set once. */
  function applyCanvasLock() {
    if (settings.canvasLock.enabled) {
      lockCanvasSize();
    } else {
      unlockCanvasSize();
    }
    sizeBadge.render();
  }

  applyCanvasLock();

  // A window covered edge to edge stops getting animation frames, and the game
  // stops with them. This drives the loop by hand when that happens.
  if (settings.keepAlive) {
    installKeepAlive(() => pumpFrame());
  }

  setClickObserver(showClickFlash);
  engine.on('change', () => refresh());
  engine.on('action', (entry) => {
    store.log(entry);
    stats.record(entry);
    if (settings.notify.events.includes(entry.kind)) {
      notifier.notify(`${t('app.name')} · ${describeEntry(entry)}`, entry.kind);
    }
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
  // Rebuilding the panel on every notch replaced the slider mid-drag, which is
  // what made dragging feel like it was fighting back.
  onSpeedChange(() => {
    hud.render();
    panel.updateSpeed();
  });

  installHotkeys({
    // The keyboard reference has no key of its own; it opens from the panel.
    [Keys.PANEL]: () => store.togglePanel(),
    [Keys.CLOSE_PANEL]: () => {
      // Declined when there is nothing to close, so the game keeps its Esc.
      if (!store.get().panelOpen) {
        return false;
      }
      store.closePanel();
      refresh();
      return true;
    },
    [Keys.RUN]: () => {
      runSelected();
      refresh();
    },
    [Keys.CAPTURE]: () => {
      if (!store.get().isCaptureArmed) {
        engine.setMessage(t('msg.captureDisarmed'));
        return;
      }
      // A probe is armed the same way a step is, and takes precedence: the
      // user asked for it one button press ago.
      if (store.get().isAwaitingProbe) {
        probeEditor.captureAtCursor();
        store.awaitProbe(false);
        store.openPanel();
        refresh();
        return;
      }
      // A pending ＋ means this capture belongs to a step that already exists.
      const pending = store.get().pendingPlaceStepId;
      stepEditor.captureAtCursor(pending).then(() => {
        if (pending) {
          store.awaitPlaceFor(null);
          store.openPanel();
        }
        refresh();
      });
    },
    [Keys.SPEED_RESET]: () => setSpeed(1),
    [Keys.SPEED_UP]: () => setSpeed(stepSpeed(getSpeed(), 1)),
    [Keys.SPEED_UP_ALT]: () => setSpeed(stepSpeed(getSpeed(), 1)),
    [Keys.SPEED_DOWN]: () => setSpeed(stepSpeed(getSpeed(), -1)),
  });

  refresh();
  hud.wake();
  // Only the tabs that show live numbers are worth redrawing on a timer.
  // Redrawing the steps table twice a second ate the caret out of its inputs.
  realSetInterval(refreshLive, UI_REFRESH_MS);
  // Markers are positioned from the live canvas box, so a resize moves them.
  const onCanvasMoved = () => {
    // The fit scale is derived from the viewport, so a resize has to redo it
    // before anything reads the canvas box.
    if (settings.canvasLock.enabled) {
      lockCanvasSize();
    }
    markers.render();
    probes.render();
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
