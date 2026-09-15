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

import { SPEED_STEPS } from './core/constants.js';
import { installCanvasPatch } from './core/canvas.js';
import { installFocusPatch } from './core/focus.js';
import { installSpeedHack, getSpeed, setSpeed, onSpeedChange, speedIndex } from './core/speed.js';
import { createEngine, TaskId } from './core/engine.js';
import { setClickObserver } from './core/input.js';
import {
  loadProfiles,
  saveProfiles,
  getActiveProfile,
  loadSettings,
  saveSettings,
} from './core/storage.js';
import { RERUN_RULES, WORLD_BOSS_RULES } from './rules/builtin.js';
import { createRuleEditor } from './rules/editor.js';
import { createScreenEditor } from './rules/screen-editor.js';
import { createQueueEditor } from './rules/queue-editor.js';
import { setLanguage } from './i18n/index.js';
import { installStyles } from './ui/styles.js';
import { createUiStore } from './ui/store.js';
import { createHud } from './ui/hud.js';
import { createPanel } from './ui/panel/index.js';
import { createMarkerLayer } from './ui/markers.js';
import { createHelpPanel } from './ui/help.js';
import { installHotkeys } from './ui/hotkeys.js';
import { showClickFlash } from './ui/flash.js';
import { realSetInterval, realClearInterval, realNow } from './core/timers.js';
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
  const getRules = () => getActiveProfile(profileState).rules;
  const getScreens = () => getActiveProfile(profileState).screens;
  const getActivities = () => getActiveProfile(profileState).activities;
  const persist = () => saveProfiles(profileState);

  const store = createUiStore();

  const engine = createEngine({
    getScriptRules: getRules,
    getRerunRules: () => RERUN_RULES,
    getWorldBossRules: () => WORLD_BOSS_RULES,
    getScaleMode: () => settings.scaleMode,
    getScreens,
    getActivities,
    shouldCloseAfterRound: () => settings.closeAfterRound,
    closeGame: () => window.close(),
  });

  const editor = createRuleEditor({
    getRules,
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
  };

  const hud = createHud({ getEngineState: engine.getState, store });

  const panel = createPanel({
    store,
    editor,
    screenEditor,
    queueEditor,
    getRules,
    getScreens,
    getActivities,
    getCloseAfterRound: () => settings.closeAfterRound,
    setCloseAfterRound: (value) => {
      settings.closeAfterRound = value;
      saveSettings(settings);
    },
    getEngineState: engine.getState,
    toggleTask: engine.toggle,
    getProfileName: () => getActiveProfile(profileState).name,
    refresh: () => refresh(),
  });

  const markers = createMarkerLayer({
    getRules,
    getScaleMode: () => settings.scaleMode,
    store,
  });

  const help = createHelpPanel();

  setClickObserver(showClickFlash);
  engine.on('change', () => refresh());
  engine.on('action', (entry) => store.log(entry));
  store.subscribe(() => refresh());
  onSpeedChange(() => refresh());

  installHotkeys({
    '1': () => help.toggle(),
    '2': () => store.togglePanel(),
    '3': () => engine.toggle(TaskId.RERUN),
    '4': () => engine.toggle(TaskId.WORLD_BOSS),
    '5': () => engine.toggle(TaskId.SCRIPT),
    '6': () => engine.toggle(TaskId.RUN_ALL),
    '0': () => editor.captureAtCursor().then(refresh),
    '=': () => setSpeed(nextSpeedStep(getSpeed(), 1)),
    '+': () => setSpeed(nextSpeedStep(getSpeed(), 1)),
    '-': () => setSpeed(nextSpeedStep(getSpeed(), -1)),
  });

  refresh();
  hud.wake();
  // The countdown and the canvas readout are time-based, not event-based.
  realSetInterval(refresh, UI_REFRESH_MS);
  // Markers are positioned from the live canvas box, so a resize moves them.
  window.addEventListener('resize', () => markers.render());

  console.info('[BHB] ready — press 1 for the keyboard reference');
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
