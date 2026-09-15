import { Z_TOP } from '../core/constants.js';

/**
 * One stylesheet for the whole UI.
 *
 * Everything is namespaced `.bhb-` and every rule sets what it needs
 * explicitly — the game's own stylesheet is unknown territory, and an
 * inherited font or line-height would wreck the layout silently.
 *
 * Only the panel, the HUD and the markers take pointer events. The marker
 * layer itself must not, or it would swallow every click meant for the game.
 */
const CSS = `
.bhb-hud, .bhb-panel, .bhb-markers, .bhb-flash, .bhb-drag {
  --bhb-bg: #12141c;
  --bhb-bg-soft: #1a1d29;
  --bhb-line: rgba(255, 255, 255, .09);
  --bhb-text: #e6e8f0;
  --bhb-dim: #7a8196;
  --bhb-accent: #7c5cff;
  --bhb-cyan: #22d3ee;
  --bhb-live: #3ddc97;
  --bhb-warn: #ffb457;
  --bhb-danger: #ff6b81;
  --bhb-font: ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif;
  --bhb-mono: ui-monospace, "SF Mono", Consolas, monospace;

  position: fixed;
  z-index: ${Z_TOP};
  /* Without this the browser draws selects, scrollbars and carets from the
     light palette, which looks pasted onto a dark panel. */
  color-scheme: dark;
  box-sizing: border-box;
  color: var(--bhb-text);
  font-family: var(--bhb-font);
  user-select: none;
}
.bhb-hud *, .bhb-panel *, .bhb-markers *, .bhb-drag * { box-sizing: border-box; }
.bhb-mono { font-family: var(--bhb-mono); font-variant-numeric: tabular-nums; }

/* --- HUD ---------------------------------------------------------------- */

.bhb-hud {
  top: 14px; right: 14px;
  display: flex; align-items: center; gap: 9px;
  padding: 7px 13px;
  background: linear-gradient(180deg, rgba(26, 29, 41, .96), rgba(18, 20, 28, .96));
  border: 1px solid var(--bhb-line);
  border-radius: 999px;
  box-shadow: 0 6px 22px rgba(0, 0, 0, .5);
  font-size: 12px; line-height: 1;
  cursor: pointer;
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  transition: opacity .45s ease, box-shadow .2s ease;
}
.bhb-hud--dim { opacity: .25; }
.bhb-hud:hover { opacity: 1; box-shadow: 0 6px 26px rgba(124, 92, 255, .35); }

.bhb-hud__dot {
  width: 8px; height: 8px; border-radius: 50%; flex: none;
  background: var(--bhb-dim);
}
.bhb-hud--live .bhb-hud__dot {
  background: var(--bhb-live);
  box-shadow: 0 0 0 0 rgba(61, 220, 151, .7);
  animation: bhb-pulse 1.8s ease-out infinite;
}
.bhb-hud__name { font-weight: 700; letter-spacing: .06em; }
.bhb-hud__ver { color: var(--bhb-dim); font-size: 10px; }
.bhb-hud__sep { width: 1px; height: 13px; background: var(--bhb-line); }
.bhb-hud__task { font-weight: 600; font-size: 11px; letter-spacing: .04em; }
.bhb-hud--live .bhb-hud__task { color: var(--bhb-live); }
.bhb-hud__speed {
  font-family: var(--bhb-mono); font-size: 11px; color: var(--bhb-dim);
}
.bhb-hud__speed.is-boosted { color: var(--bhb-cyan); font-weight: 700; }
.bhb-hud__screen {
  padding: 1px 7px; border-radius: 999px;
  background: rgba(61, 220, 151, .14); color: var(--bhb-live);
  font-size: 10px; letter-spacing: .04em;
}
.bhb-hud__msg {
  max-width: 190px; color: var(--bhb-dim); font-size: 10.5px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* --- Panel -------------------------------------------------------------- */

.bhb-panel {
  top: 58px; right: 14px;
  display: flex; flex-direction: column;
  width: 400px; max-width: calc(100vw - 28px);
  max-height: calc(100vh - 80px);
  background: var(--bhb-bg);
  border: 1px solid var(--bhb-line);
  border-radius: 14px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, .6);
  font-size: 12px;
  overflow: hidden;
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
}

.bhb-panel__head {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 13px;
  background: linear-gradient(90deg, rgba(124, 92, 255, .16), transparent 70%);
  border-bottom: 1px solid var(--bhb-line);
}
.bhb-panel__brand { display: flex; align-items: baseline; gap: 6px; flex: 1; }
.bhb-panel__name { font-weight: 800; letter-spacing: .08em; font-size: 13px; }
.bhb-panel__ver { color: var(--bhb-dim); font-size: 10px; }
.bhb-panel__profile { color: var(--bhb-dim); font-size: 10.5px; }

.bhb-tabs {
  display: flex; gap: 0; padding: 8px 7px 0;
  /* Six tabs will not fit at every width, and a wrapped tab strip looks
     broken — so it scrolls sideways instead, with no visible scrollbar. */
  overflow-x: auto; scrollbar-width: none;
}
.bhb-tabs::-webkit-scrollbar { display: none; }
.bhb-tabbtn {
  flex: none; padding: 7px 5px 9px; white-space: nowrap;
  background: none; border: 0; border-bottom: 2px solid transparent;
  color: var(--bhb-dim); font: inherit; font-size: 11px; font-weight: 600;
  cursor: pointer;
}
.bhb-tabbtn:hover { color: var(--bhb-text); }
/* Help is not a place to work, so it reads as a mark rather than a label. */
.bhb-tabbtn--help { margin-left: auto; padding: 7px 8px 9px; font-size: 12px; }
.bhb-tabbtn.is-active { color: var(--bhb-text); border-bottom-color: var(--bhb-accent); }

.bhb-panel__body { padding: 12px 13px 14px; overflow-y: auto; }
.bhb-tab { display: flex; flex-direction: column; gap: 13px; }
.bhb-stack { display: flex; flex-direction: column; gap: 6px; }

.bhb-label {
  color: var(--bhb-dim); font-size: 10px;
  font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
}
.bhb-note { margin: 0; color: var(--bhb-dim); font-size: 10.5px; line-height: 1.5; }
.bhb-note--warn { color: var(--bhb-warn); }
.bhb-empty { margin: 0; padding: 18px 0; color: var(--bhb-dim); font-size: 11px; text-align: center; }
.bhb-field { display: flex; flex-direction: column; gap: 7px; }
.bhb-field__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }

/* --- Task switches ------------------------------------------------------ */

.bhb-task {
  display: flex; align-items: center; gap: 9px;
  padding: 9px 11px;
  background: var(--bhb-bg-soft);
  border: 1px solid var(--bhb-line); border-radius: 10px;
  color: var(--bhb-text); font: inherit; text-align: left;
  cursor: pointer;
  transition: border-color .15s ease, background .15s ease;
}
.bhb-task:hover { border-color: rgba(124, 92, 255, .5); }
.bhb-task.is-on { background: rgba(61, 220, 151, .1); border-color: rgba(61, 220, 151, .45); }

.bhb-task__switch {
  width: 28px; height: 16px; flex: none;
  background: #2b3040; border-radius: 999px; position: relative;
  transition: background .15s ease;
}
.bhb-task__switch::after {
  content: ''; position: absolute; top: 3px; left: 3px;
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--bhb-dim);
  transition: transform .15s ease, background .15s ease;
}
.bhb-task.is-on .bhb-task__switch { background: rgba(61, 220, 151, .3); }
.bhb-task.is-on .bhb-task__switch::after { transform: translateX(12px); background: var(--bhb-live); }

.bhb-task__name { flex: 1; font-weight: 700; font-size: 11.5px; letter-spacing: .05em; }
.bhb-task__label { flex: 1; font-size: 11px; line-height: 1.4; }
.bhb-task--wrap { align-items: flex-start; }
.bhb-task--wrap .bhb-task__switch { margin-top: 1px; }

/* A switch that cannot do anything yet says so instead of pretending. */
.bhb-task.is-locked { opacity: .5; cursor: not-allowed; }
.bhb-task.is-locked:hover { border-color: var(--bhb-line); }
.bhb-task__phase { color: var(--bhb-warn); font-size: 10px; }

.bhb-kbd {
  min-width: 17px; padding: 2px 4px;
  background: rgba(255, 255, 255, .06);
  border: 1px solid var(--bhb-line); border-radius: 4px;
  color: var(--bhb-dim); font-family: var(--bhb-mono); font-size: 9.5px; text-align: center;
}

.bhb-slider { width: 100%; accent-color: var(--bhb-accent); cursor: pointer; }
.bhb-speed { font-family: var(--bhb-mono); font-size: 13px; font-weight: 700; }
.bhb-speed.is-boosted { color: var(--bhb-cyan); }

.bhb-facts {
  display: grid; grid-template-columns: auto 1fr; gap: 5px 12px;
  margin: 0; padding-top: 11px; border-top: 1px solid var(--bhb-line);
}
.bhb-facts dt { color: var(--bhb-dim); font-size: 10px; letter-spacing: .06em; text-transform: uppercase; }
.bhb-facts dd { margin: 0; color: var(--bhb-cyan); font-size: 10.5px; text-align: right; }

/* --- Buttons ------------------------------------------------------------ */

.bhb-btn {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 8px 12px;
  background: var(--bhb-bg-soft);
  border: 1px solid var(--bhb-line); border-radius: 9px;
  color: var(--bhb-text); font: inherit; font-size: 11.5px; font-weight: 600;
  cursor: pointer;
}
.bhb-btn:hover { border-color: rgba(124, 92, 255, .55); }
.bhb-btn--primary {
  background: linear-gradient(180deg, rgba(124, 92, 255, .9), rgba(98, 70, 230, .9));
  border-color: transparent;
}
.bhb-btn__dot {
  width: 7px; height: 7px; border-radius: 50%; background: #fff;
  animation: bhb-pulse 1.8s ease-out infinite;
}

.bhb-icon {
  width: 22px; height: 22px; flex: none;
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0; background: none; border: 0; border-radius: 6px;
  color: var(--bhb-dim); font: inherit; font-size: 11px; line-height: 1;
  cursor: pointer;
}
.bhb-icon:hover { background: rgba(255, 255, 255, .08); color: var(--bhb-text); }
.bhb-icon.is-on { color: var(--bhb-live); }
.bhb-icon--danger:hover { background: rgba(255, 107, 129, .18); color: var(--bhb-danger); }

/* --- Rules table -------------------------------------------------------- */

.bhb-rules { display: flex; flex-direction: column; gap: 3px; }
.bhb-rule {
  display: flex; align-items: center; gap: 7px;
  padding: 6px 7px;
  border: 1px solid transparent; border-radius: 8px;
  cursor: pointer;
}
.bhb-rule:hover, .bhb-rule.is-hovered { background: var(--bhb-bg-soft); }
.bhb-rule.is-selected { border-color: rgba(124, 92, 255, .6); background: rgba(124, 92, 255, .1); }
.bhb-rule.is-off { opacity: .45; }

.bhb-rule__n { width: 14px; color: var(--bhb-dim); font-family: var(--bhb-mono); font-size: 10px; }
.bhb-rule__swatch {
  width: 13px; height: 13px; flex: none;
  border: 1px solid rgba(255, 255, 255, .25); border-radius: 4px;
}
.bhb-rule__name {
  flex: 1; min-width: 0; padding: 3px 5px;
  background: none; border: 1px solid transparent; border-radius: 5px;
  color: var(--bhb-text); font: inherit; font-size: 11.5px;
}
.bhb-rule__name:hover { border-color: var(--bhb-line); }
.bhb-rule__name:focus { outline: none; border-color: var(--bhb-accent); background: #0d0f16; }
.bhb-rule__coord { color: var(--bhb-cyan); font-size: 10px; }
.bhb-rule__actions { display: flex; gap: 1px; margin-left: auto; }

/* A rule carries a name, a place, an activity and a screen gate. On one line
   they crush each other, so the row is two: identity above, wiring below. */
.bhb-rule--stacked { flex-direction: column; align-items: stretch; gap: 5px; }
.bhb-rule__main { display: flex; align-items: center; gap: 7px; }
.bhb-rule__meta { display: flex; align-items: center; gap: 6px; padding-left: 21px; }
.bhb-rule__meta .bhb-rule__gate { flex: 1; min-width: 0; max-width: none; }

/* --- Log ---------------------------------------------------------------- */

.bhb-log { display: flex; flex-direction: column; gap: 1px; max-height: 300px; overflow-y: auto; }
.bhb-log__row {
  display: flex; align-items: center; gap: 7px;
  padding: 4px 6px; border-radius: 6px; font-size: 11px;
}
.bhb-log__row:nth-child(odd) { background: rgba(255, 255, 255, .025); }
.bhb-log__time { color: var(--bhb-dim); font-size: 10px; }
.bhb-log__icon { width: 12px; text-align: center; color: var(--bhb-dim); }
.bhb-log__row--click .bhb-log__icon { color: var(--bhb-live); }
.bhb-log__row--task .bhb-log__icon { color: var(--bhb-accent); }
.bhb-log__text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bhb-log__coord { color: var(--bhb-dim); font-size: 10px; }

/* --- Marker layer ------------------------------------------------------- */

.bhb-markers { inset: 0; pointer-events: none; }

.bhb-mark {
  position: fixed;
  display: flex; align-items: center; gap: 3px;
  padding: 2px 5px 2px 3px;
  transform: translate(-50%, -50%);
  background: rgba(18, 20, 28, .9);
  border: 1px solid var(--bhb-accent); border-radius: 999px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .5), 0 0 12px rgba(124, 92, 255, .45);
  pointer-events: auto; cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease;
}
.bhb-mark:hover, .bhb-mark--hovered {
  transform: translate(-50%, -50%) scale(1.25);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .5), 0 0 18px rgba(124, 92, 255, .8);
}
.bhb-mark--selected { border-color: var(--bhb-cyan); box-shadow: 0 0 16px rgba(34, 211, 238, .8); }
.bhb-mark--off { opacity: .4; border-color: var(--bhb-dim); }
.bhb-mark--legacy { border-color: var(--bhb-warn); }
.bhb-mark__n { color: var(--bhb-text); font-family: var(--bhb-mono); font-size: 9px; font-weight: 700; }
.bhb-mark__swatch {
  width: 9px; height: 9px; border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, .5);
}

/* --- Screens & drag capture --------------------------------------------- */

/* Chrome draws its own select button whatever the background says, so the
   native control is turned off and the arrow drawn here instead. */
.bhb-select, .bhb-rule__gate {
  appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'><path d='M0 0h8L4 5z' fill='%237a8196'/></svg>");
  background-repeat: no-repeat; background-position: right 6px center;
  padding-right: 18px;
}
.bhb-select, .bhb-textarea {
  width: 100%; padding: 5px 18px 5px 7px;
  background-color: var(--bhb-bg-soft); color: var(--bhb-text);
  border: 1px solid var(--bhb-line); border-radius: 7px;
  font-family: var(--bhb-font); font-size: 11px;
}
.bhb-textarea { height: 72px; resize: vertical; font-family: var(--bhb-mono); font-size: 10px; }
.bhb-btnrow { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
.bhb-btn--small { flex: 1; min-width: 64px; padding: 4px 8px; font-size: 10.5px; }
.bhb-queue__row.is-active { border-color: var(--bhb-live); }
.bhb-queue__row.is-spent { opacity: .45; }
.bhb-queue__state { width: 14px; text-align: center; color: var(--bhb-live); font-size: 10px; }
.bhb-queue__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bhb-hud__activity {
  padding: 1px 7px; border-radius: 999px;
  background: rgba(124, 92, 255, .18); color: var(--bhb-accent);
  font-size: 10px; letter-spacing: .04em;
}
.bhb-rule__gate {
  max-width: 120px; padding: 2px 18px 2px 5px;
  background-color: var(--bhb-bg-soft); color: var(--bhb-dim);
  border: 1px solid var(--bhb-line); border-radius: 6px;
  font-family: var(--bhb-font); font-size: 10px;
}
.bhb-screen__wrap { display: flex; flex-direction: column; gap: 2px; }
.bhb-screen.is-active { border-color: var(--bhb-live); }
.bhb-screen.is-stopper .bhb-rule__n { color: var(--bhb-danger); }
.bhb-screen__now { color: var(--bhb-live); font-size: 10px; }
.bhb-screen__state { width: 14px; text-align: center; color: var(--bhb-dim); }
.bhb-screen__state.is-seen { color: var(--bhb-live); }
.bhb-screen__tune { display: flex; align-items: center; gap: 8px; padding: 0 8px 6px; }
.bhb-slider--thin { flex: 1; }
.bhb-icon.is-danger-on { color: var(--bhb-danger); }

/* The drag layer is alive only while a capture is running. */
.bhb-drag { inset: 0; cursor: crosshair; pointer-events: auto; background: rgba(12, 14, 20, .25); }
.bhb-drag__box {
  display: none; position: fixed;
  border: 1px solid var(--bhb-cyan); background: rgba(34, 211, 238, .14);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .5);
}
.bhb-drag__hint {
  position: fixed; left: 50%; top: 14px; transform: translateX(-50%);
  padding: 4px 10px; border-radius: 999px;
  background: var(--bhb-bg); border: 1px solid var(--bhb-line);
  font-family: var(--bhb-mono); font-size: 11px;
}

/* --- Help tab & flash --------------------------------------------------- */

.bhb-help { gap: 0; font-size: 11.5px; line-height: 1.8; }
.bhb-help__section {
  margin: 13px 0 3px;
  color: var(--bhb-accent); font-size: 10px;
  font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
}
.bhb-help__entry { display: flex; justify-content: space-between; gap: 10px; }
.bhb-help__entry b { font-family: var(--bhb-mono); font-weight: 700; color: var(--bhb-cyan); }
.bhb-help__label { flex: 1; text-align: right; color: var(--bhb-dim); }
.bhb-help__footer {
  margin-top: 11px; padding-top: 8px; border-top: 1px solid var(--bhb-line);
  color: var(--bhb-dim); font-size: 10px; text-align: center;
}

.bhb-flash {
  width: 22px; height: 22px; border-radius: 50%;
  transform: translate(-50%, -50%) scale(.4);
  border: 2px solid var(--bhb-cyan);
  box-shadow: 0 0 10px var(--bhb-cyan), 0 0 22px rgba(34, 211, 238, .55);
  pointer-events: none;
  transition: transform .35s cubic-bezier(.2, .8, .3, 1), opacity .35s ease-out;
}
.bhb-flash--out { transform: translate(-50%, -50%) scale(1.9); opacity: 0; }

@keyframes bhb-pulse {
  0% { box-shadow: 0 0 0 0 rgba(61, 220, 151, .55); }
  70% { box-shadow: 0 0 0 7px rgba(61, 220, 151, 0); }
  100% { box-shadow: 0 0 0 0 rgba(61, 220, 151, 0); }
}
`;

let installed = false;

export function installStyles() {
  if (installed) {
    return;
  }
  const style = document.createElement('style');
  style.id = 'bhb-styles';
  style.textContent = CSS;
  (document.head || document.documentElement).append(style);
  installed = true;
}
