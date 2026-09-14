import { Z_TOP } from '../core/constants.js';

/**
 * One stylesheet for every panel.
 *
 * All selectors are namespaced `.bhb-` and the sheet is scoped to our own
 * elements, so nothing here can reach into the game's DOM.
 */
const CSS = `
.bhb-panel {
  position: fixed;
  z-index: ${Z_TOP};
  box-sizing: border-box;
  background: rgba(12, 14, 18, 0.92);
  color: #ddd;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9px;
  font: 11px/1.5 Consolas, Monaco, monospace;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
  pointer-events: none;
  user-select: none;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.bhb-overlay { top: 12px; right: 12px; padding: 8px 12px; }
.bhb-overlay--expanded { width: 250px; padding: 10px 12px; }
.bhb-overlay--party { width: 250px; padding: 10px 12px; border: 2px solid #a6d339; }

.bhb-row { display: flex; align-items: center; gap: 6px; }
.bhb-row--between { justify-content: space-between; }
.bhb-row--compact { gap: 10px; white-space: nowrap; }

.bhb-version { color: #6b7688; font-size: 10px; margin-left: 5px; }
.bhb-title { color: #fff; font-size: 12px; font-weight: 700; letter-spacing: .3px; }
.bhb-muted { color: #777; font-size: 10px; }
.bhb-hint { color: #8ec8ff; font-size: 10px; }
.bhb-key { color: #666; font-size: 9px; }

.bhb-dot {
  width: 7px; height: 7px; border-radius: 50%; flex: none;
  background: currentColor; box-shadow: 0 0 6px currentColor;
}
.bhb-dot--sm { width: 6px; height: 6px; box-shadow: 0 0 5px currentColor; }

.bhb-task { font-weight: 700; font-size: 11.5px; flex: 1; }
.bhb-task--on { color: #70e0a8; }
.bhb-task--off { color: #ff9966; }

.bhb-speed { font-weight: 700; font-size: 12.5px; }
.bhb-speed--boosted { color: #66ff66; }
.bhb-speed--normal { color: #ddd; }

.bhb-section {
  margin-top: 6px; padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, .10);
}
.bhb-section__label { color: #aaa; font-size: 10px; margin-bottom: 3px; }

.bhb-rule { display: flex; justify-content: space-between; gap: 6px; font-size: 10px; }
.bhb-rule--ready { color: #70e0a8; }
.bhb-rule--pending { color: #ffaa33; }
.bhb-rule--disabled { color: #666; }
.bhb-rule--legacy { color: #ff9966; }
.bhb-rule__coord { color: #8ec8ff; }

.bhb-message {
  color: #9aa; font-size: 10px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.bhb-help {
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 340px; padding: 16px 18px;
  font-size: 11.5px; line-height: 1.7;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.bhb-help__header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px; padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, .15);
}
.bhb-help__title { color: #fff; font-size: 14px; font-weight: 700; letter-spacing: .4px; }
.bhb-help__section {
  color: #8ec8ff; font-size: 10.5px; font-weight: 700;
  margin: 10px 0 4px;
}
.bhb-help__entry { display: flex; justify-content: space-between; gap: 10px; }
.bhb-help__entry b { font-weight: 700; }
.bhb-help__label { flex: 1; text-align: right; color: #ccc; }
.bhb-help__footer {
  margin-top: 12px; padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, .12);
  color: #888; font-size: 10px; text-align: center;
}

.bhb-addmode {
  top: 12px; left: 12px; padding: 10px 14px;
  background: rgba(255, 100, 50, 0.92);
  color: #fff; border: 2px solid #fff; border-radius: 8px;
  font-weight: 700; line-height: 1.5;
  box-shadow: 0 0 16px rgba(255, 100, 50, 0.8);
}
.bhb-addmode__title { font-size: 13px; }
.bhb-addmode__keys { font-size: 10px; margin-top: 4px; color: #ffe; font-weight: 400; }

.bhb-marker {
  position: fixed; width: 24px; height: 24px;
  transform: translate(-50%, -50%);
  border: 2px dashed #ffaa33; border-radius: 50%;
  box-shadow: 0 0 10px rgba(255, 170, 51, .8);
  pointer-events: none; z-index: ${Z_TOP};
  animation: bhb-pulse 1s ease-in-out infinite;
}

.bhb-flash {
  position: fixed; border-radius: 50%;
  pointer-events: none; z-index: ${Z_TOP};
}
.bhb-flash--ring {
  width: 22px; height: 22px;
  transform: translate(-50%, -50%) scale(0.4);
  border: 2px solid #00d4ff;
  box-shadow: 0 0 10px #00d4ff, 0 0 20px rgba(0, 212, 255, .6);
  transition: transform .35s cubic-bezier(.2, .8, .3, 1), opacity .35s ease-out;
}
.bhb-flash--ring.bhb-flash--out {
  transform: translate(-50%, -50%) scale(1.8); opacity: 0;
}

@keyframes bhb-pulse {
  0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: .5; transform: translate(-50%, -50%) scale(1.3); }
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
