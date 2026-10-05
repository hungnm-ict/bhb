/**
 * The strip has to stay narrow while things are going well, and speak up when
 * they are not.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createHud } from '../src/ui/hud.js';
import { AUTO_STOP_TIMEOUT } from '../src/core/constants.js';

function hudWith(engineState, { runTarget = null, activities = [] } = {}) {
  // mount() appends to documentElement, so a strip from an earlier test would
  // still be the one querySelector finds.
  for (const stale of document.querySelectorAll('.bhb-hud')) {
    stale.remove();
  }
  const store = {
    get: () => ({ panelOpen: false }),
    togglePanel: () => {},
  };
  const hud = createHud({
    getEngineState: () => engineState,
    store,
    getRunTarget: () => runTarget,
    getActivities: () => activities,
  });
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

  it('stays as it is while steps are landing', () => {
    // A click just happened, so the countdown is still at full.
    const node = hudWith(engine({ remainingMs: AUTO_STOP_TIMEOUT }));
    expect(node.classList.contains('bhb-hud--stuck')).toBe(false);
    expect(node.querySelector('.bhb-hud__msg')).toBeNull();
  });

  it('stays calm while a step is resting out a battle on purpose', () => {
    // Dungeon and Raid can sit through a fight for tens of seconds to a
    // couple of minutes at a low tier, all of it inside one step's restSec —
    // which is the bot working exactly as told, not stuck.
    const node = hudWith(engine({ remainingMs: AUTO_STOP_TIMEOUT - 90_000, restingMs: 60_000 }));
    expect(node.classList.contains('bhb-hud--stuck')).toBe(false);
  });

  it('turns its frame amber once nothing has been clicked for a while', () => {
    const node = hudWith(engine({ remainingMs: AUTO_STOP_TIMEOUT - 10_000 }));
    expect(node.classList.contains('bhb-hud--stuck')).toBe(true);
  });

  it('says why in the tooltip rather than on screen, which costs no width', () => {
    const node = hudWith(engine({ remainingMs: AUTO_STOP_TIMEOUT - 10_000 }));
    expect(node.querySelector('.bhb-hud__msg'), 'no text, only the frame').toBeNull();
    expect(node.title).toBe('solo: no match');
  });

  it('marks the activity so the badge can take its colour', () => {
    const node = hudWith(engine());
    expect(node.dataset.activity).toBe('worldbossteam');
  });

  it('drops the activity mark when stopped, and is not stuck either', () => {
    const node = hudWith(engine({ activeTask: null, activity: null, remainingMs: 0 }));
    expect(node.dataset.activity).toBeUndefined();
    expect(node.classList.contains('bhb-hud--stuck'), 'stopped is not stuck').toBe(false);
    expect(
      node.querySelector('.bhb-hud__code'),
      'a mode that is not running is a plan, and plans live in the panel'
    ).toBeNull();
  });

  it('falls back to the mode when a run has no activity of its own', () => {
    const node = hudWith(engine({ activeTask: 'script', activity: null, activityName: null }));
    expect(node.querySelector('.bhb-hud__code').textContent).toBe('SET');
  });

  it('shows the Run target as a badge while idle, if it names an activity', () => {
    // A real click on a mapped icon can quietly update the Run target even
    // while idle; the strip saying so is only ever a label, never a reason
    // to start anything by itself.
    const node = hudWith(
      engine({ activeTask: null, activity: null, remainingMs: 0 }),
      { runTarget: 'worldbossteam', activities: [{ id: 'worldbossteam', name: 'World Boss (team)' }] }
    );
    expect(node.querySelector('.bhb-hud__code').textContent).toBe('WB-T');
    expect(node.querySelector('.bhb-hud__code').title).toBe('World Boss (team)');
  });

  it('shows nothing idle when the Run target is a task, not an activity', () => {
    const node = hudWith(
      engine({ activeTask: null, activity: null, remainingMs: 0 }),
      { runTarget: 'runAll', activities: [{ id: 'worldbossteam', name: 'World Boss (team)' }] }
    );
    expect(node.querySelector('.bhb-hud__code')).toBeNull();
  });

  it('shows the learned fight length once one exists', () => {
    const node = hudWith(engine({ activityRestSeconds: 42 }));
    expect(node.querySelector('.bhb-hud__rest')?.textContent).toBe('~42s');
  });

  it('shows nothing before any fight has been measured', () => {
    const node = hudWith(engine({ activityRestSeconds: 0 }));
    expect(node.querySelector('.bhb-hud__rest')).toBeNull();
  });

  it('rounds a fractional learned length for display', () => {
    const node = hudWith(engine({ activityRestSeconds: 42.7 }));
    expect(node.querySelector('.bhb-hud__rest')?.textContent).toBe('~43s');
  });

  it('falls back to the learned round length for an activity with no restAuto step', () => {
    const node = hudWith(engine({ activityRestSeconds: 0, activityAvgRoundSeconds: 70 }));
    expect(node.querySelector('.bhb-hud__rest')?.textContent).toBe('~70s');
  });

  it('prefers the more precise fight length over the round length when both exist', () => {
    const node = hudWith(engine({ activityRestSeconds: 42, activityAvgRoundSeconds: 70 }));
    expect(node.querySelector('.bhb-hud__rest')?.textContent).toBe('~42s');
  });
});
