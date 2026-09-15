/**
 * The panel is rebuilt on every engine tick, so anything the user was in the
 * middle of has to survive the rebuild. The scroll position is one of those:
 * losing it dragged the scrollbar back to the top a second after they scrolled.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createPanel } from '../src/ui/panel/index.js';
import { createUiStore, Tab } from '../src/ui/store.js';

function build() {
  const store = createUiStore();
  const panel = createPanel({
    store,
    getEngineState: () => ({ activeTask: null, phase: 'hunting', round: 0, remainingMs: 0 }),
    toggleTask: () => {},
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
});
