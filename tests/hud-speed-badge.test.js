/**
 * The speed badge is the one thing a glance at the minimised strip is for:
 * what the slider is set to right now, whether a run is under way or not.
 * Hiding it whenever the bot was stopped and the slider sat at or under 1×
 * meant the one case a player actually leans in to check — "did I leave it
 * slow?" — was the one case it stayed blank.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createHud } from '../src/ui/hud.js';
import { setSpeed, setSpeedUnlocked } from '../src/core/speed.js';

function hudWith(engineState) {
  for (const stale of document.querySelectorAll('.bhb-hud')) {
    stale.remove();
  }
  const store = { get: () => ({ panelOpen: false }), togglePanel: () => {} };
  const hud = createHud({ getEngineState: () => engineState, store });
  hud.render();
  return document.querySelector('.bhb-hud');
}

const stopped = { activeTask: null, activity: null, remainingMs: 0 };

beforeEach(() => {
  setSpeedUnlocked(false);
  setSpeed(1);
  for (const stale of document.querySelectorAll('.bhb-hud')) {
    stale.remove();
  }
});

describe('HUD speed badge', () => {
  it('shows the speed even stopped and at or under 1×', () => {
    setSpeed(0.1);
    const node = hudWith(stopped);
    expect(node.querySelector('.bhb-hud__speed')?.textContent).toBe('0.1×');
  });

  it('shows 1× stopped, not just a dot', () => {
    setSpeed(1);
    const node = hudWith(stopped);
    expect(node.querySelector('.bhb-hud__speed')?.textContent).toBe('1×');
  });

  it('still marks only a speed above 1× as boosted', () => {
    setSpeed(0.5);
    const node = hudWith(stopped);
    expect(node.querySelector('.bhb-hud__speed').classList.contains('is-boosted')).toBe(false);
  });
});
