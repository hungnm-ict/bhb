/**
 * The strip fades out of the way when nothing is happening, and does not
 * while something is: a run in progress is exactly when the one badge saying
 * which mode is running is worth reading.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';

let now = 1_000_000;

vi.mock('../src/core/timers.js', () => ({
  realNow: () => now,
  realPerformanceNow: () => 0,
  realSetTimeout: (fn) => {
    // Fire at once: the test is about whether the class is allowed to stick.
    fn();
    return 1;
  },
  realClearTimeout: () => {},
  realSetInterval: () => 0,
  realClearInterval: () => {},
  realRequestAnimationFrame: () => 0,
}));

vi.mock('../src/core/canvas.js', () => ({
  getCanvas: () => ({
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 800, bottom: 500, width: 800, height: 500 }),
  }),
}));

const { createHud } = await import('../src/ui/hud.js');
const { createUiStore } = await import('../src/ui/store.js');

function build(engineState) {
  document.body.replaceChildren();
  for (const stale of document.querySelectorAll('.bhb-hud')) {
    stale.remove();
  }
  const store = createUiStore();
  const hud = createHud({
    store,
    getEngineState: () => engineState,
    toggleTask: () => {},
    refresh: () => {},
  });
  hud.render();
  return { hud, node: document.querySelector('.bhb-hud') };
}

const IDLE = {
  activeTask: null,
  activity: null,
  activityName: null,
  lastMessage: '',
  remainingMs: 0,
};

const RUNNING = {
  activeTask: 'solo',
  activity: 'dungeon',
  activityName: 'Dungeon',
  lastMessage: '',
  remainingMs: 180000,
};

describe('the HUD strip', () => {
  it('fades once nothing is running', () => {
    const { hud, node } = build(IDLE);
    hud.wake();
    hud.render();
    expect(node.className).toContain('bhb-hud--dim');
  });

  it('stays readable while a run is going', () => {
    const { hud, node } = build(RUNNING);
    hud.wake();
    hud.render();
    expect(node.className).not.toContain('bhb-hud--dim');
  });

  it('shows which mode is running', () => {
    const { node } = build(RUNNING);
    expect(node.querySelector('.bhb-hud__code').textContent).toBe('DUN');
  });
});
