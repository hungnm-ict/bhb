/**
 * The strip has to stay narrow while things are going well, and speak up when
 * they are not.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createHud } from '../src/ui/hud.js';
import { AUTO_STOP_TIMEOUT } from '../src/core/constants.js';

function hudWith(engineState) {
  // mount() appends to documentElement, so a strip from an earlier test would
  // still be the one querySelector finds.
  for (const stale of document.querySelectorAll('.bhb-hud')) {
    stale.remove();
  }
  const store = {
    get: () => ({ panelOpen: false }),
    togglePanel: () => {},
  };
  const hud = createHud({ getEngineState: () => engineState, store });
  hud.render();
  return document.querySelector('.bhb-hud');
}

function engine(overrides = {}) {
  return {
    activeTask: 'solo',
    activity: 'worldbossteam',
    activityName: 'World Boss (team)',
    lastMessage: 'solo: no match',
    remainingMs: AUTO_STOP_TIMEOUT,
    ...overrides,
  };
}

beforeEach(() => {
  for (const stale of document.querySelectorAll('.bhb-hud')) {
    stale.remove();
  }
});

describe('HUD', () => {
  it('shows the activity as a badge, not its full name', () => {
    const node = hudWith(engine());
    expect(node.querySelector('.bhb-hud__code').textContent).toBe('WB-T');
    expect(node.textContent).not.toContain('World Boss (team)');
  });

  it('keeps the full name within reach on hover', () => {
    const node = hudWith(engine());
    expect(node.querySelector('.bhb-hud__code').title).toBe('World Boss (team)');
  });

  it('carries no product name or version any more', () => {
    const node = hudWith(engine());
    expect(node.textContent).not.toMatch(/BHB/);
    expect(node.textContent).not.toMatch(/v\d+\.\d+/);
  });

  it('stays quiet while steps are landing', () => {
    // A click just happened, so the countdown is still at full.
    const node = hudWith(engine({ remainingMs: AUTO_STOP_TIMEOUT }));
    expect(node.querySelector('.bhb-hud__msg')).toBeNull();
  });

  it('speaks up once nothing has been clicked for a while', () => {
    const node = hudWith(engine({ remainingMs: AUTO_STOP_TIMEOUT - 10_000 }));
    expect(node.querySelector('.bhb-hud__msg').textContent).toBe('solo: no match');
  });

  it('marks the activity so the badge can take its colour', () => {
    const node = hudWith(engine());
    expect(node.dataset.activity).toBe('worldbossteam');
  });

  it('drops the activity mark when stopped, and says nothing about a message', () => {
    const node = hudWith(engine({ activeTask: null, activity: null, remainingMs: 0 }));
    expect(node.dataset.activity).toBeUndefined();
    expect(node.querySelector('.bhb-hud__msg')).toBeNull();
    expect(node.querySelector('.bhb-hud__code').textContent).toBe('—');
  });

  it('falls back to the mode when a run has no activity of its own', () => {
    const node = hudWith(engine({ activeTask: 'script', activity: null, activityName: null }));
    expect(node.querySelector('.bhb-hud__code').textContent).toBe('SET');
  });
});
