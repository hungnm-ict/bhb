/**
 * BHB — Bit Heroes Bot
 *
 * Entry point. Load order matters and is enforced here:
 *
 *  1. `installCanvasPatch` before Unity creates its WebGL context, or the
 *     framebuffer cannot be read at all.
 *  2. `timers.js` (imported by `speed.js`) captures the native timers before
 *     the speed hack replaces the globals.
 *  3. Everything else once the DOM is ready.
 */

import { installCanvasPatch } from './core/canvas.js';
import { installFocusPatch } from './core/focus.js';
import { installSpeedHack, getSpeed, setSpeed, onSpeedChange } from './core/speed.js';
import { createEngine, TaskId } from './core/engine.js';
import { setClickObserver } from './core/input.js';
import {
  loadProfiles,
  saveProfiles,
  getActiveProfile,
  loadSettings,
} from './core/storage.js';
import { RERUN_RULES, WORLD_BOSS_RULES } from './rules/builtin.js';
import { createRuleCapture } from './rules/capture.js';
import { setLanguage } from './i18n/index.js';
import { installStyles } from './ui/styles.js';
import { createOverlay } from './ui/overlay.js';
import { createHelpPanel } from './ui/help.js';
import { createAddModeBadge } from './ui/addmode.js';
import { installHotkeys } from './ui/hotkeys.js';
import { showPendingMarker, removePendingMarker, showClickFlash } from './ui/marker.js';
import { realSetInterval } from './core/timers.js';

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

  let profileState = loadProfiles();
  const getRules = () => getActiveProfile(profileState).rules;
  const persist = () => saveProfiles(profileState);

  const engine = createEngine({
    getScriptRules: getRules,
    getRerunRules: () => RERUN_RULES,
    getWorldBossRules: () => WORLD_BOSS_RULES,
    getScaleMode: () => settings.scaleMode,
  });

  const overlay = createOverlay({
    getEngineState: engine.getState,
    getRules,
    getProfileName: () => getActiveProfile(profileState).name,
  });

  const help = createHelpPanel();
  const addModeBadge = createAddModeBadge();

  const capture = createRuleCapture({
    getRules,
    persist,
    report: engine.setMessage,
    markers: { showPendingMarker, removePendingMarker },
  });

  setClickObserver(showClickFlash);
  engine.on('change', overlay.render);
  onSpeedChange(overlay.render);

  installHotkeys({
    '1': () => help.toggle(),
    '2': () => overlay.cycle(),
    '3': () => engine.toggle(TaskId.RERUN),
    '4': () => engine.toggle(TaskId.WORLD_BOSS),
    '5': () => engine.toggle(TaskId.SCRIPT),
    '6': () => addModeBadge.setVisible(capture.toggle()),
    '0': () => capture.isActive() && capture.savePosition(),
    '9': () => capture.isActive() && capture.saveColor(),
    '8': () => capture.isActive() && capture.deleteLast(),
    '=': () => setSpeed(getSpeed() + 1),
    '+': () => setSpeed(getSpeed() + 1),
    '-': () => setSpeed(getSpeed() - 1),
  });

  overlay.render();
  realSetInterval(overlay.render, UI_REFRESH_MS);

  console.info('[BHB] ready — press 1 for the keyboard reference');
}

// --- Phase 2: wire up the UI once there is a DOM to attach it to -----------
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
