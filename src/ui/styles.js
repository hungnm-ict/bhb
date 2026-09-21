import { Z_TOP } from '../core/constants.js';

/**
 * One stylesheet for the whole UI.
 *
 * Everything is namespaced `.bhb-` and every step sets what it needs
 * explicitly — the game's own stylesheet is unknown territory, and an
 * inherited font or line-height would wreck the layout silently.
 *
 * Only the panel, the HUD and the markers take pointer events. The marker
 * layer itself must not, or it would swallow every click meant for the game.
 */
const CSS = `
.bhb-hud, .bhb-panel, .bhb-markers, .bhb-probes, .bhb-flash, .bhb-drag, .bhb-size, .bhb-fpsbadge, .bhb-toast {
  --bhb-bg: #12141c;
  --bhb-bg-soft: #1a1d29;
  --bhb-line: rgba(255, 255, 255, .09);
  --bhb-text: #e6e8f0;
  --bhb-dim: #b3bacd;
  --bhb-accent: #7c5cff;
  /* Same colour in channels, because a glow needs to fade it. */
  --bhb-accent-rgb: 124, 92, 255;
  /* The frame's halo: white, leaning far enough violet to belong to the
     accent rather than read as a stray highlight. */
  --bhb-glow-rgb: 228, 223, 255;
  --bhb-cyan: #22d3ee;
  --bhb-live: #3ddc97;
  --bhb-warn: #ffb457;
  --bhb-danger: #ff6b81;
  --bhb-font: ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif;
  --bhb-mono: ui-monospace, "SF Mono", Consolas, monospace;

  /* One type scale for the whole panel. Anything that reaches for a size not
     on this list is what let 14 different sizes accumulate here before. */
  --bhb-fs-xs: 11px;   /* hotkeys, column headers, the smallest meta */
  --bhb-fs-sm: 12px;   /* notes, secondary text */
  --bhb-fs-md: 13px;   /* row text, task names, inputs */
  --bhb-fs-lg: 15px;   /* panel title, stat values */
  --bhb-fs-xl: 17px;   /* the one number a tile exists to show */
  --bhb-fs-2xl: 20px;  /* a glyph that is the whole button, like − and + */

  /* Below this a control is fiddly to hit, whatever it looks like. */
  --bhb-hit: 28px;

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
.bhb-hud *, .bhb-panel *, .bhb-markers *, .bhb-probes *, .bhb-drag * { box-sizing: border-box; }
.bhb-mono { font-family: var(--bhb-mono); font-variant-numeric: tabular-nums; }

/* --- HUD ---------------------------------------------------------------- */

.bhb-hud {
  top: 14px; right: 14px;
  display: flex; align-items: center; gap: 7px;
  padding: 4px 9px;
  background: linear-gradient(180deg, rgba(26, 29, 41, .96), rgba(18, 20, 28, .96));
  border: 1px solid rgba(var(--bhb-glow-rgb), .38);
  border-radius: 999px;
  box-shadow:
    0 6px 22px rgba(0, 0, 0, .5),
    0 0 0 1px rgba(0, 0, 0, .5),
    0 0 16px rgba(var(--bhb-glow-rgb), .22);
  font-size: var(--bhb-fs-md); line-height: 1;
  cursor: pointer;
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  transition: opacity .45s ease, box-shadow .2s ease;
}
/* Faded out it must still answer: is it running, and how fast? */
.bhb-hud > * { transition: opacity .45s ease; }
.bhb-hud--dim {
  background: linear-gradient(180deg, rgba(26, 29, 41, .30), rgba(18, 20, 28, .30));
  border-color: rgba(var(--bhb-accent-rgb), .10);
  box-shadow: none;
}
.bhb-hud--dim > * { opacity: .16; }
.bhb-hud--dim > .bhb-hud__dot,
.bhb-hud--dim > .bhb-hud__speed { opacity: 1; }
/* The plate is nearly gone underneath, so these two carry their own contrast. */
.bhb-hud--dim > .bhb-hud__speed { color: var(--bhb-text); text-shadow: 0 1px 3px rgba(0, 0, 0, .9); }
.bhb-hud--dim > .bhb-hud__dot { box-shadow: 0 0 0 2px rgba(0, 0, 0, .55); }
.bhb-hud:hover { opacity: 1; box-shadow: 0 6px 26px rgba(124, 92, 255, .35); }
.bhb-hud:hover > * { opacity: 1; }

.bhb-hud__dot {
  width: 8px; height: 8px; border-radius: 50%; flex: none;
  background: var(--bhb-dim);
}
.bhb-hud--live .bhb-hud__dot {
  background: var(--bhb-live);
  box-shadow: 0 0 0 0 rgba(61, 220, 151, .7);
  animation: bhb-pulse 1.8s ease-out infinite;
}
/* The badge carries the activity's colour, so the strip is readable at a
   glance without reading it: shape in the corner of the eye, not a word. */
.bhb-hud__code {
  padding: 1px 7px; border-radius: 6px;
  background: rgba(var(--bhb-code-rgb, 179, 186, 205), .16);
  color: rgb(var(--bhb-code-rgb, 179, 186, 205));
  font-weight: 700; font-size: var(--bhb-fs-sm); letter-spacing: .06em;
}
.bhb-hud[data-activity="pvp"]           { --bhb-code-rgb: 255, 107, 129; }
.bhb-hud[data-activity="gvg"]           { --bhb-code-rgb: 255, 180, 87; }
.bhb-hud[data-activity="invasion"]      { --bhb-code-rgb: 255, 140, 200; }
.bhb-hud[data-activity="expedition"]    { --bhb-code-rgb: 124, 92, 255; }
.bhb-hud[data-activity="trials"]        { --bhb-code-rgb: 34, 211, 238; }
.bhb-hud[data-activity="worldboss"]     { --bhb-code-rgb: 61, 220, 151; }
.bhb-hud[data-activity="worldbossteam"] { --bhb-code-rgb: 120, 230, 120; }
.bhb-hud[data-activity="raid"]          { --bhb-code-rgb: 255, 120, 90; }
.bhb-hud[data-activity="dungeon"]       { --bhb-code-rgb: 150, 160, 255; }
.bhb-hud__speed {
  font-family: var(--bhb-mono); font-size: var(--bhb-fs-sm); color: var(--bhb-dim);
}
.bhb-hud__speed.is-boosted { color: var(--bhb-cyan); font-weight: 700; }
/* Nothing is landing. The frame carries it, so the strip keeps its width. */
.bhb-hud--stuck {
  border-color: rgba(255, 180, 87, .85);
  box-shadow:
    0 6px 22px rgba(0, 0, 0, .5),
    0 0 0 1px rgba(0, 0, 0, .5),
    0 0 18px rgba(255, 180, 87, .45);
}
.bhb-hud--stuck .bhb-hud__dot { background: var(--bhb-warn); }
/* The strip fades after a few seconds, which is exactly when nobody is
   watching it — so the warning has to outlast the fade. */
.bhb-hud--dim.bhb-hud--stuck {
  border-color: rgba(255, 180, 87, .85);
  box-shadow: 0 0 18px rgba(255, 180, 87, .45);
}
.bhb-hud--dim.bhb-hud--stuck > .bhb-hud__dot { opacity: 1; }


/* --- Panel -------------------------------------------------------------- */

/* The HUD hides while this is open, so the panel takes the top of the screen. */
.bhb-panel {
  top: 14px; right: 14px;
  display: flex; flex-direction: column;
  width: 400px; max-width: calc(100vw - 28px);
  max-height: calc(100vh - 28px);
  background: var(--bhb-bg);
  /* The dark ring is the load-bearing one: a glow over the game's bright
     pixel art cancels itself out without something to sit against. */
  border: 1px solid rgba(var(--bhb-glow-rgb), .38);
  border-radius: 14px;
  box-shadow:
    0 18px 50px rgba(0, 0, 0, .6),
    0 0 0 1px rgba(0, 0, 0, .55),
    0 0 24px rgba(var(--bhb-glow-rgb), .24);
  font-size: var(--bhb-fs-md);
  overflow: hidden;
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
}

.bhb-panel__name { font-weight: 800; letter-spacing: .06em; font-size: var(--bhb-fs-xl); }
.bhb-panel__ver { color: var(--bhb-dim); font-size: var(--bhb-fs-sm); }

/* The tab strip is the title bar now, so it carries the frame's rounded top. */
.bhb-panel__profile {
  flex: none; max-width: 96px;
  padding: 3px 8px;
  background: rgba(255, 255, 255, .06);
  border: 1px solid var(--bhb-line); border-radius: 999px;
  color: var(--bhb-dim); font: inherit; font-size: var(--bhb-fs-xs);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  cursor: pointer;
}
.bhb-panel__profile:hover { color: var(--bhb-text); border-color: rgba(124, 92, 255, .5); }

.bhb-tabs {
  flex: none;
  display: flex; align-items: center; gap: 0; padding: 7px 34px 0 9px;
  border-radius: 14px 14px 0 0;
  background: linear-gradient(90deg, rgba(124, 92, 255, .14), transparent 70%);
  background-color: var(--bhb-bg);
  /* Six tabs will not fit at every width, and a wrapped tab strip looks
     broken — so it scrolls sideways instead, with no visible scrollbar. */
  overflow-x: auto; scrollbar-width: none;
}
.bhb-tabs::-webkit-scrollbar { display: none; }
.bhb-tabbtn {
  flex: none; padding: 7px 5px 9px; white-space: nowrap;
  background: none; border: 0; border-bottom: 2px solid transparent;
  color: var(--bhb-text); font: inherit; font-size: var(--bhb-fs-md); font-weight: 600;
  cursor: pointer;
}
.bhb-tabbtn:hover { color: var(--bhb-warn); }
/* Help is not a place to work, so it reads as a mark rather than a label. */
.bhb-tabbtn--help { padding: 7px 7px 9px; font-size: var(--bhb-fs-md); }
/* Pushed to the far end: these are not places to go, they are the way out. */
/* The strip scrolls, and close is not something to have to scroll for: this
   group stays pinned to the right edge while the tabs slide under it. Longer
   labels in another language were enough to push ✕ out of sight. */
/* The frame's own corner, above the strip: close never scrolls away and never
   moves when a language makes the tab labels longer. */
.bhb-panel__close {
  position: absolute; top: 5px; right: 6px; z-index: 2;
  color: var(--bhb-text);
}
.bhb-panel__close:hover { color: var(--bhb-danger); }

.bhb-tabs__end {
  position: sticky; right: 0;
  flex: none;
  margin-left: auto; padding-bottom: 2px; padding-left: 8px;
  display: flex; align-items: center; gap: 5px;
  background: linear-gradient(90deg, transparent, var(--bhb-bg) 8px);
}
.bhb-tabbtn.is-active { color: var(--bhb-warn); border-bottom-color: var(--bhb-warn); }

.bhb-panel__body {
  /* min-height:0 is what lets a flex item actually scroll instead of growing. */
  flex: 1 1 auto; min-height: 0;
  padding: 12px 13px 14px; overflow-y: auto;
}
.bhb-tab { display: flex; flex-direction: column; gap: 13px; }

.bhb-label {
  color: var(--bhb-dim); font-size: var(--bhb-fs-sm);
  font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
}
.bhb-note { margin: 0; color: var(--bhb-dim); font-size: var(--bhb-fs-sm); line-height: 1.5; }
.bhb-note--warn { color: var(--bhb-warn); }
.bhb-empty { margin: 0; padding: 18px 0; color: var(--bhb-dim); font-size: var(--bhb-fs-sm); text-align: center; }
.bhb-field { display: flex; flex-direction: column; gap: 7px; }
.bhb-field__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }

/* --- Collapsible settings sections -------------------------------------- */

.bhb-tab--folds { gap: 5px; }

.bhb-fold {
  border: 1px solid var(--bhb-line); border-radius: 10px;
  background: var(--bhb-bg-soft);
  overflow: hidden;
}
.bhb-fold.is-open { border-color: rgba(124, 92, 255, .4); }

.bhb-fold__head {
  width: 100%;
  display: flex; align-items: center; gap: 8px;
  padding: 9px 11px;
  background: none; border: 0;
  color: var(--bhb-text); font: inherit; text-align: left;
  cursor: pointer;
}
.bhb-fold__head:hover { background: rgba(255, 255, 255, .04); }
.bhb-fold__head .bhb-label { flex: none; }
.bhb-fold__caret { color: var(--bhb-dim); font-size: var(--bhb-fs-xs); }

/* The state, readable without opening the section it belongs to. */
.bhb-fold__summary {
  flex: 1; min-width: 0;
  color: var(--bhb-dim); font-size: var(--bhb-fs-sm); text-align: right;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.bhb-fold__body { padding: 2px 11px 12px; }

/* --- Alerts ------------------------------------------------------------- */

.bhb-input {
  width: 100%; padding: 6px 8px;
  background: var(--bhb-bg-soft);
  border: 1px solid var(--bhb-line); border-radius: 7px;
  color: var(--bhb-text); font-family: var(--bhb-mono); font-size: var(--bhb-fs-sm);
}
.bhb-input:focus { outline: none; border-color: rgba(124, 92, 255, .6); }

/* --- Session stats ------------------------------------------------------ */

.bhb-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.bhb-stats__cell {
  display: flex; flex-direction: column; gap: 2px;
  padding: 7px 9px;
  background: var(--bhb-bg-soft);
  border: 1px solid var(--bhb-line); border-radius: 9px;
}
.bhb-stats__value { font-size: var(--bhb-fs-xl); font-weight: 700; }
.bhb-stats__label { color: var(--bhb-dim); font-size: var(--bhb-fs-xs); line-height: 1.3; }

.bhb-stats__rows { display: flex; flex-direction: column; gap: 1px; }
.bhb-stats__row {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 2px; border-bottom: 1px solid var(--bhb-line);
  font-size: var(--bhb-fs-sm);
}
.bhb-stats__name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bhb-stats__num { color: var(--bhb-dim); font-size: var(--bhb-fs-xs); }
.bhb-stats__num.is-spent { color: var(--bhb-warn); }

/* --- Task switches ------------------------------------------------------ */

.bhb-taskgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }

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

.bhb-task__name { flex: 1; font-weight: 600; font-size: var(--bhb-fs-md); }
.bhb-task__label { flex: 1; font-size: var(--bhb-fs-sm); line-height: 1.4; }
.bhb-task--wrap { align-items: flex-start; }
.bhb-task--wrap .bhb-task__switch { margin-top: 1px; }

/* A switch that cannot do anything yet says so instead of pretending. */
.bhb-task.is-locked { opacity: .62; cursor: not-allowed; }
.bhb-task.is-locked:hover { border-color: var(--bhb-line); }
.bhb-task__phase { color: var(--bhb-warn); font-size: var(--bhb-fs-xs); }

/* Tile variant: everything on one row — a tile this small needs no second. */
.bhb-task--tile { gap: 8px; padding: 8px 9px; }
.bhb-task--tile .bhb-task__name {
  flex: 1; min-width: 0;
  font-size: var(--bhb-fs-md); line-height: 1.2;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.bhb-task__warn { color: var(--bhb-warn); font-size: var(--bhb-fs-md); cursor: help; }

.bhb-kbd {
  min-width: 17px; padding: 2px 4px;
  background: rgba(255, 255, 255, .06);
  border: 1px solid var(--bhb-line); border-radius: 4px;
  color: var(--bhb-text); font-family: var(--bhb-mono); font-size: var(--bhb-fs-xs); text-align: center;
}

/*
 * Hand-built, because accent-color only colours the fill and leaves the rest
 * of the track to the browser — which paints it near-white, the brightest thing
 * on a dark panel, for a control that is not the point of the tab.
 *
 * The fill cannot be expressed in CSS alone, so the track is a gradient and
 * --bhb-fill carries the percentage; whoever owns the value sets it.
 */
.bhb-slider {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: var(--bhb-hit);
  background: transparent; cursor: pointer;
  --bhb-fill: 0%;
}
.bhb-slider::-webkit-slider-runnable-track {
  height: 6px; border-radius: 999px;
  background: linear-gradient(
    to right,
    var(--bhb-accent) 0 var(--bhb-fill),
    #262b3b var(--bhb-fill) 100%
  );
}
.bhb-slider::-moz-range-track {
  height: 6px; border-radius: 999px;
  background: linear-gradient(
    to right,
    var(--bhb-accent) 0 var(--bhb-fill),
    #262b3b var(--bhb-fill) 100%
  );
}
.bhb-slider::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 15px; height: 15px; margin-top: -4.5px;
  background: #eef0f7; border: 0; border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .55);
  transition: box-shadow .15s ease;
}
.bhb-slider::-moz-range-thumb {
  width: 15px; height: 15px;
  background: #eef0f7; border: 0; border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .55);
}
.bhb-slider:hover::-webkit-slider-thumb { box-shadow: 0 0 0 5px rgba(124, 92, 255, .28); }
.bhb-slider:hover::-moz-range-thumb { box-shadow: 0 0 0 5px rgba(124, 92, 255, .28); }
.bhb-slider:active::-webkit-slider-thumb { box-shadow: 0 0 0 7px rgba(124, 92, 255, .38); }
.bhb-speedrow { display: flex; align-items: center; gap: 8px; }
.bhb-speedrow .bhb-slider { flex: 1; min-width: 0; }
.bhb-speedticks {
  /* The inset clears the −/+ buttons, so a tick sits over the track it marks. */
  position: relative; height: 5px; margin-inline: calc(34px + 8px);
}
.bhb-speedticks__tick {
  position: absolute; top: 0;
  width: 1px; height: 5px;
  background: var(--bhb-line);
  transform: translateX(-50%);
}
/* 1× is the stop people aim for, so it is the one that reads as a stop. */
.bhb-speedticks__tick.is-major { height: 8px; width: 2px; background: var(--bhb-dim); }

.bhb-speedscale {
  position: relative; height: 15px;
  margin-top: 1px; margin-inline: calc(34px + 8px);
  color: var(--bhb-dim); font-size: var(--bhb-fs-sm);
}
.bhb-speedscale__mark { position: absolute; transform: translateX(-50%); white-space: nowrap; }
.bhb-speedscale__mark.is-unity { color: var(--bhb-text); font-weight: 700; }
.bhb-speed { font-family: var(--bhb-mono); font-size: var(--bhb-fs-lg); font-weight: 700; }
.bhb-speed.is-boosted { color: var(--bhb-cyan); }

.bhb-facts {
  display: grid; grid-template-columns: auto 1fr; gap: 5px 12px;
  margin: 0; padding-top: 11px; border-top: 1px solid var(--bhb-line);
}
.bhb-facts dt { color: var(--bhb-dim); font-size: var(--bhb-fs-xs); letter-spacing: .06em; text-transform: uppercase; }
.bhb-facts dd {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  margin: 0; color: var(--bhb-cyan); font-size: var(--bhb-fs-sm); text-align: right;
}

/* --- Buttons ------------------------------------------------------------ */

.bhb-btn {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 8px 12px;
  background: var(--bhb-bg-soft);
  border: 1px solid var(--bhb-line); border-radius: 9px;
  color: var(--bhb-text); font: inherit; font-size: var(--bhb-fs-md); font-weight: 600;
  cursor: pointer;
}
.bhb-btn:hover { border-color: rgba(124, 92, 255, .55); }
.bhb-btn.is-busy { border-color: rgba(124, 92, 255, .6); color: var(--bhb-text); }
.bhb-btn--primary {
  background: linear-gradient(180deg, rgba(124, 92, 255, .9), rgba(98, 70, 230, .9));
  border-color: transparent;
}
.bhb-btn__dot {
  width: 7px; height: 7px; border-radius: 50%; background: #fff;
  animation: bhb-pulse 1.8s ease-out infinite;
}

.bhb-icon {
  width: var(--bhb-hit); height: var(--bhb-hit); flex: none;
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0; background: none; border: 0; border-radius: 6px;
  color: var(--bhb-dim); font: inherit; font-size: var(--bhb-fs-sm); line-height: 1;
  cursor: pointer;
}
/* Must follow .bhb-icon: same specificity, so order is what decides the size. */
.bhb-icon--wide {
  min-width: 34px;
  color: var(--bhb-text); font-size: var(--bhb-fs-2xl); font-weight: 700; line-height: 1;
}
.bhb-icon:hover { background: rgba(255, 255, 255, .08); color: var(--bhb-text); }
.bhb-icon.is-on { color: var(--bhb-live); }
.bhb-icon--danger:hover { background: rgba(255, 107, 129, .18); color: var(--bhb-danger); }

/* --- Steps table -------------------------------------------------------- */

.bhb-steps { display: flex; flex-direction: column; gap: 3px; }
.bhb-step {
  display: flex; align-items: center; gap: 7px;
  padding: 6px 7px;
  border: 1px solid transparent; border-radius: 8px;
  cursor: pointer;
}
.bhb-step:hover, .bhb-step.is-hovered { background: var(--bhb-bg-soft); }
.bhb-step.is-selected { border-color: rgba(124, 92, 255, .6); background: rgba(124, 92, 255, .1); }
.bhb-step.is-off { opacity: .45; }
/* The step the runner is waiting for, so a stuck sequence is visible. */
.bhb-step.is-next { border-color: rgba(61, 220, 151, .5); }
.bhb-step.is-next .bhb-step__n { color: var(--bhb-live); }

.bhb-rule__n { width: 14px; color: var(--bhb-dim); font-family: var(--bhb-mono); font-size: var(--bhb-fs-xs); }
.bhb-rule__swatch {
  width: 13px; height: 13px; flex: none;
  border: 1px solid rgba(255, 255, 255, .25); border-radius: 4px;
}
.bhb-rule__name {
  flex: 1; min-width: 0; padding: 3px 5px;
  background: none; border: 1px solid transparent; border-radius: 5px;
  color: var(--bhb-text); font: inherit; font-size: var(--bhb-fs-md);
}
.bhb-rule__name:hover { border-color: var(--bhb-line); }
.bhb-rule__name:focus { outline: none; border-color: var(--bhb-accent); background: #0d0f16; }
.bhb-rule__meta-coord { display: inline-flex; align-items: center; }
/* Seconds to sit still after a click; 0 reads as off. */
.bhb-rest {
  width: 46px; padding: 3px 5px;
  background: var(--bhb-bg-soft);
  border: 1px solid var(--bhb-line); border-radius: 6px;
  color: var(--bhb-dim); font-size: var(--bhb-fs-xs); text-align: right;
}
.bhb-rest:focus { outline: none; border-color: rgba(124, 92, 255, .6); color: var(--bhb-text); }

.bhb-rule__coord { color: var(--bhb-cyan); font-size: var(--bhb-fs-xs); }
/* A step that cannot be rescaled clicks the wrong place after any resize, so
   the mark is a badge rather than a glyph hiding at the end of a number. */
.bhb-rule__drift { color: var(--bhb-warn); font-size: var(--bhb-fs-xs); }
.bhb-drift--far { color: var(--bhb-warn); }
.bhb-btn--tiny {
  display: inline-flex; flex: none;
  min-height: 0; padding: 2px 7px;
  font-size: var(--bhb-fs-xs);
}
.bhb-rule__legacy {
  display: inline-flex; align-items: center; gap: 3px;
  margin-left: 5px; padding: 1px 5px;
  background: rgba(255, 180, 87, .16);
  border: 1px solid rgba(255, 180, 87, .5); border-radius: 5px;
  color: var(--bhb-warn); font-size: var(--bhb-fs-xs); font-weight: 700;
}
.bhb-rule__actions { display: flex; gap: 1px; margin-left: auto; }

/* A step carries a name, a place, an activity and a screen gate. On one line
   they crush each other, so the row is two: identity above, wiring below. */
.bhb-step--stacked { flex-direction: column; align-items: stretch; gap: 5px; }
.bhb-rule__main { display: flex; align-items: center; gap: 7px; }
.bhb-rule__meta { display: flex; align-items: center; gap: 6px; padding-left: 21px; }
.bhb-rule__meta .bhb-tabs__ver {
  color: var(--bhb-dim); font-size: var(--bhb-fs-xs); opacity: .75;
  padding-right: 2px; white-space: nowrap;
}
.bhb-rule__gate { flex: 1; min-width: 0; max-width: none; }

/* --- Log ---------------------------------------------------------------- */

.bhb-log { display: flex; flex-direction: column; gap: 1px; max-height: 300px; overflow-y: auto; }
.bhb-log__row {
  display: flex; align-items: center; gap: 7px;
  padding: 4px 6px; border-radius: 6px; font-size: var(--bhb-fs-sm);
}
.bhb-log__row:nth-child(odd) { background: rgba(255, 255, 255, .025); }
.bhb-log__time { color: var(--bhb-dim); font-size: var(--bhb-fs-xs); }
.bhb-log__icon { width: 12px; text-align: center; color: var(--bhb-dim); }
.bhb-log__row--click .bhb-log__icon { color: var(--bhb-live); }
.bhb-log__row--task .bhb-log__icon { color: var(--bhb-accent); }
.bhb-log__text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bhb-log__coord { color: var(--bhb-dim); font-size: var(--bhb-fs-xs); }

/* --- Canvas size badge -------------------------------------------------- */

.bhb-fpsbadge {
  padding: 2px 6px;
  background: rgba(18, 20, 28, .72);
  border: 1px solid var(--bhb-line); border-radius: 6px;
  color: var(--bhb-dim); font-size: var(--bhb-fs-xs); line-height: 1.3;
  /* It sits over the game: taking a click here would be worse than no badge. */
  pointer-events: none;
}
.bhb-fpsbadge.is-good { color: var(--bhb-live); border-color: rgba(61, 220, 151, .35); }
.bhb-fpsbadge.is-low { color: var(--bhb-warn); border-color: rgba(255, 180, 87, .45); }

.bhb-size {
  right: 10px; bottom: 10px;
  padding: 3px 8px;
  background: rgba(18, 20, 28, .72);
  border: 1px solid var(--bhb-line); border-radius: 7px;
  color: var(--bhb-dim); font-size: var(--bhb-fs-xs);
  /* It sits over the game: taking a click here would be worse than no badge. */
  pointer-events: none;
  transition: opacity .25s ease, color .25s ease, border-color .25s ease;
}
.bhb-size--dim { opacity: .28; }
.bhb-size--near {
  opacity: 1;
  background: rgba(18, 20, 28, .92);
  border-color: rgba(124, 92, 255, .5);
  color: var(--bhb-text);
}

/* --- Probe layer -------------------------------------------------------- */

.bhb-probes { inset: 0; pointer-events: none; }

/* A crosshair, not a badge: a probe judges one pixel, and a badge would sit
   on top of the thing being judged. */
.bhb-probe {
  position: fixed;
  width: 21px; height: 21px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.bhb-probe::before, .bhb-probe::after {
  content: ''; position: absolute;
  background: var(--bhb-cyan);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .7);
}
.bhb-probe::before { left: 0; right: 0; top: 10px; height: 1px; }
.bhb-probe::after { top: 0; bottom: 0; left: 10px; width: 1px; }
.bhb-probe__dot {
  position: absolute; left: 7px; top: 7px;
  width: 7px; height: 7px; border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, .7);
}

.bhb-probe-table { display: flex; flex-direction: column; gap: 2px; }

.bhb-probe-row {
  display: grid;
  grid-template-columns: 1fr auto auto 14px 14px auto 20px;
  align-items: center; gap: 6px;
  padding: 3px 6px;
  background: rgba(255, 255, 255, .03);
  border-radius: 6px;
  font-size: var(--bhb-fs-xs);
}
.bhb-probe-row__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bhb-probe-row__size, .bhb-probe-row__pos { color: var(--bhb-dim); }
.bhb-probe-row__swatch {
  width: 14px; height: 14px; border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, .2);
}
.bhb-probe-row__delta.is-match { color: var(--bhb-live); }
.bhb-probe-row__delta.is-miss { color: var(--bhb-danger); }

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

/* Dry-run verdicts: what the matcher found, on the marker it found it on. */
.bhb-mark--match { border-color: var(--bhb-live); box-shadow: 0 0 0 2px rgba(61, 220, 151, .35); }
.bhb-mark--miss { border-color: var(--bhb-danger); opacity: .75; }
.bhb-mark--gated { border-color: var(--bhb-dim); opacity: .45; }
.bhb-mark--waiting { border-color: var(--bhb-warn); box-shadow: 0 0 0 2px rgba(255, 180, 87, .3); }
.bhb-mark--testing { transform: translate(-50%, -50%) scale(1.45); z-index: 1; }
.bhb-mark__n { color: var(--bhb-text); font-family: var(--bhb-mono); font-size: var(--bhb-fs-xs); font-weight: 700; }
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
  font-family: var(--bhb-font); font-size: var(--bhb-fs-sm);
}
.bhb-textarea { height: 72px; resize: vertical; font-family: var(--bhb-mono); font-size: var(--bhb-fs-xs); }
.bhb-btnrow { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
.bhb-btn--small { flex: 1; min-width: 64px; padding: 6px 10px; font-size: var(--bhb-fs-sm); }
.bhb-queue__row.is-active { border-color: var(--bhb-live); }
.bhb-queue__row.is-spent { opacity: .45; }
.bhb-queue__state { width: 14px; text-align: center; color: var(--bhb-live); font-size: var(--bhb-fs-xs); }
.bhb-queue__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bhb-rule__gate {
  max-width: 120px; padding: 2px 18px 2px 5px;
  background-color: var(--bhb-bg-soft); color: var(--bhb-dim);
  border: 1px solid var(--bhb-line); border-radius: 6px;
  font-family: var(--bhb-font); font-size: var(--bhb-fs-xs);
}
.bhb-screen__wrap { display: flex; flex-direction: column; gap: 2px; }
.bhb-screen.is-active { border-color: var(--bhb-live); }
.bhb-screen.is-stopper .bhb-rule__n { color: var(--bhb-danger); }
.bhb-screen__now { color: var(--bhb-live); font-size: var(--bhb-fs-xs); }
.bhb-screen__state { width: 14px; text-align: center; color: var(--bhb-dim); }
.bhb-screen__state.is-seen { color: var(--bhb-live); }
.bhb-screen__tune { display: flex; align-items: center; gap: 8px; padding: 0 8px 6px; }
.bhb-slider--thin { flex: 1; height: 20px; }
.bhb-slider--thin::-webkit-slider-runnable-track { height: 4px; }
.bhb-slider--thin::-moz-range-track { height: 4px; }
.bhb-slider--thin::-webkit-slider-thumb { width: 12px; height: 12px; margin-top: -4px; }
.bhb-slider--thin::-moz-range-thumb { width: 12px; height: 12px; }
.bhb-icon.is-danger-on { color: var(--bhb-danger); }
.bhb-icon.is-notify-on { color: var(--bhb-warn); }

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
  font-family: var(--bhb-mono); font-size: var(--bhb-fs-sm);
}

/* --- Help tab & flash --------------------------------------------------- */

.bhb-help { gap: 0; font-size: var(--bhb-fs-md); line-height: 1.8; }
.bhb-help__section {
  margin: 13px 0 3px;
  color: var(--bhb-accent); font-size: var(--bhb-fs-xs);
  font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
}
.bhb-help__entry { display: flex; justify-content: space-between; gap: 10px; }
.bhb-help__entry b { font-family: var(--bhb-mono); font-weight: 700; color: var(--bhb-cyan); }
.bhb-help__label { flex: 1; text-align: right; color: var(--bhb-dim); }
.bhb-help__footer {
  margin-top: 11px; padding-top: 8px; border-top: 1px solid var(--bhb-line);
  color: var(--bhb-dim); font-size: var(--bhb-fs-xs); text-align: center;
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

/* --- Toast -------------------------------------------------------------- */

.bhb-toast {
  display: flex; align-items: center; gap: 7px;
  padding: 6px 11px;
  transform: translate(-50%, 6px);
  background: rgba(18, 20, 28, .96);
  border: 1px solid rgba(61, 220, 151, .55); border-radius: 999px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, .5);
  color: var(--bhb-text); font-size: var(--bhb-fs-sm); font-weight: 600;
  white-space: nowrap; pointer-events: none; opacity: 0;
  transition: opacity .3s ease, transform .3s cubic-bezier(.2, .8, .3, 1);
}
.bhb-toast--in { opacity: 1; transform: translate(-50%, 0); }
.bhb-toast--warn { border-color: rgba(255, 180, 87, .6); color: var(--bhb-warn); }
.bhb-toast__swatch {
  width: 13px; height: 13px; flex: none;
  border: 1px solid rgba(255, 255, 255, .35); border-radius: 4px;
}

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
