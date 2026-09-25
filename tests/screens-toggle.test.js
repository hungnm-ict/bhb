/**
 * The screens tab is off by default.
 *
 * It is a refinement most sessions never need, and a tab strip that does not
 * fit is the one thing the strip cannot survive — so it is earned, not given.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { createPanel } from '../src/ui/panel/index.js';
import { createUiStore, Tab } from '../src/ui/store.js';
import { loadSettings } from '../src/core/storage.js';

function build(showScreens) {
  const store = createUiStore();
  const panel = createPanel({
    store,
    getEngineState: () => ({ activeTask: null, phase: 'hunting', round: 0, remainingMs: 0, expectedStepId: null, screen: null, screenName: null }),
    toggleTask: () => {},
    getRunTarget: () => 'script',
    setRunTarget: () => {},
    runSelected: () => {},
    getSteps: () => [],
    getProbes: () => [],
    probeEditor: { scoreAll: () => ({ buffer: null, scores: [] }), clear: () => {}, remove: () => {} },
    getScreens: () => [],
    getActivities: () => [],
    getStats: () => ({ startedAt: Date.now(), clicks: 0, rounds: 0, resyncs: 0, hangs: 0, drops: 0, runningMs: 0, activities: {} }),
    resetStats: () => {},
    getReloadCount: () => 0,
    getProfileName: () => 'Default',
    profiles: { list: () => [{ id: 'p', name: 'Default' }], activeId: () => 'p', activeName: () => 'Default', exportAll: () => '' },
    settings: { scaleMode: 'scale', showScreens, watchdog: false, keepAlive: true, sizeBadge: true, closeAfterRound: false, notify: { enabled: false, discordWebhook: '', telegramToken: '', telegramChat: '', withShot: true, events: [] }, canvasLock: { enabled: false, width: 800, height: 520 } },
    updateSettings: () => {},
    sendTestAlert: () => Promise.resolve(false),
    stepEditor: {},
    screenEditor: { probe: () => null },
    queueEditor: {},
    dryRunner: { start: () => {}, stop: () => {} },
    refresh: () => {},
  });
  store.openPanel();
  return { store, panel };
}

function tabLabels() {
  return [...document.querySelectorAll('.bhb-tabbtn')].map((button) => button.textContent);
}

describe('the screens toggle', () => {
  it('defaults to off', () => {
    expect(loadSettings().showScreens).toBe(false);
  });

  it('keeps the tab out of the strip while off', () => {
    document.body.replaceChildren();
    const { panel } = build(false);
    panel.render();
    expect(tabLabels()).not.toContain('Màn hình');
  });

  it('shows the tab once switched on', () => {
    document.body.replaceChildren();
    const { panel } = build(true);
    panel.render();
    expect(tabLabels()).toContain('Màn hình');
  });

  it('falls back to tasks when the hidden tab is the selected one', () => {
    document.body.replaceChildren();
    const { store, panel } = build(false);
    store.setTab(Tab.SCREENS);
    panel.render();
    expect(document.querySelector('.bhb-panel__body').children.length).toBeGreaterThan(0);
  });
});
