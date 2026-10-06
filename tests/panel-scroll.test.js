/**
 * The panel is rebuilt on every engine tick, so anything the user was in the
 * middle of has to survive the rebuild. The scroll position is one of those:
 * losing it dragged the scrollbar back to the top a second after they scrolled.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPanel } from '../src/ui/panel/index.js';
import { createUiStore, Tab } from '../src/ui/store.js';

function build() {
  const store = createUiStore();
  const panel = createPanel({
    store,
    getEngineState: () => ({ activeTask: null, phase: 'hunting', round: 0, remainingMs: 0 }),
    toggleTask: () => {},
    getRunTarget: () => 'script',
    setRunTarget: () => {},
    runSelected: () => {},
    getSteps: () => [],
    getScreens: () => [],
    getActivities: () => [],
    getStats: () => ({
      startedAt: Date.now(),
      clicks: 0,
      rounds: 0,
      resyncs: 0,
      hangs: 0,
      drops: 0,
      runningMs: 0,
      activities: {},
    }),
    resetStats: () => {},
    getProfileName: () => 'Default',
    refresh: () => panel.render(),
  });
  return { store, panel };
}

function body() {
  return document.querySelector('.bhb-panel__body');
}

beforeEach(() => {
  document.documentElement.replaceChildren(document.createElement('body'));
});

describe('panel scroll', () => {
  it('keeps the scroll position across a rebuild', () => {
    const { store, panel } = build();
    store.openPanel();
    panel.render();

    body().scrollTop = 140;
    panel.render();

    expect(body().scrollTop).toBe(140);
  });

  it('starts a different tab at the top', () => {
    const { store, panel } = build();
    store.openPanel();
    panel.render();
    body().scrollTop = 140;

    store.setTab(Tab.LOG);
    panel.render();

    expect(body().scrollTop).toBe(0);
  });

  it('forgets the position once the panel closes', () => {
    const { store, panel } = build();
    store.openPanel();
    panel.render();
    body().scrollTop = 140;

    store.closePanel();
    panel.render();
    store.openPanel();
    panel.render();

    expect(body().scrollTop).toBe(0);
  });

  it('skips a timed rebuild while a wheel gesture is still in flight', () => {
    // Every rebuild swaps in a new body node; inertia tied to the old one
    // cuts short mid-gesture, which read as the scrollbar refusing to
    // move. Pausing the rebuild for a moment after the last wheel event
    // lets the gesture land first.
    const { store, panel } = build();
    store.openPanel();
    panel.render();
    const firstBody = body();

    firstBody.dispatchEvent(new Event('scroll'));
    panel.render();

    expect(body(), 'same node, no rebuild mid-gesture').toBe(firstBody);
  });

  it('rebuilds again once the wheel has been still for a while', () => {
    vi.useFakeTimers();
    try {
      const { store, panel } = build();
      store.openPanel();
      panel.render();
      const firstBody = body();

      firstBody.dispatchEvent(new Event('scroll'));
      panel.render();
      expect(body()).toBe(firstBody);

      vi.advanceTimersByTime(500);
      panel.render();
      expect(body(), 'the guard window has passed').not.toBe(firstBody);
    } finally {
      vi.useRealTimers();
    }
  });

  it('skips a timed rebuild while the scrollbar thumb is being dragged', () => {
    // Dragging the scrollbar thumb never fires a wheel event, only `scroll` —
    // a guard keyed on wheel alone let a drag get cut mid-gesture the same
    // way, snapping the body back to its last known offset under the user's
    // hand.
    const { store, panel } = build();
    store.openPanel();
    panel.render();
    const firstBody = body();

    // `scroll` does not bubble; the guard relies on a capturing listener to
    // still see it land on the body.
    firstBody.dispatchEvent(new Event('scroll'));
    panel.render();

    expect(body(), 'same node, no rebuild mid-drag').toBe(firstBody);
  });
});
