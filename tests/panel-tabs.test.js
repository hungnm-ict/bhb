/**
 * Every tab must actually build.
 *
 * A tab that throws while rendering does not look broken — the panel simply
 * keeps the previous tab's contents, so the tab button reads as unclickable.
 * A missing import shipped exactly that way once, because the bundler treats an
 * unknown name as a global and no test had ever built this tab.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { createPanel } from '../src/ui/panel/index.js';
import { createUiStore, Tab } from '../src/ui/store.js';

describe('every tab renders', () => {
  for (const tab of Object.values(Tab)) {
    it(`renders ${tab}`, () => {
      const store = createUiStore();
      const panel = createPanel({
        store,
        getEngineState: () => ({ activeTask: null, phase: 'hunting', round: 0, remainingMs: 0, expectedStepId: null, screen: null, screenName: null }),
        toggleTask: () => {},
        getSteps: () => [],
        getScreens: () => [],
        getActivities: () => [],
        getStats: () => ({ startedAt: Date.now(), clicks: 0, rounds: 0, resyncs: 0, hangs: 0, drops: 0, runningMs: 0, activities: {} }),
        resetStats: () => {},
        getReloadCount: () => 0,
        getProfileName: () => 'Default',
        profiles: { list: () => [{ id: 'p', name: 'Default' }], activeId: () => 'p', activeName: () => 'Default', exportAll: () => '' },
        settings: { scaleMode: 'scale', watchdog: false, keepAlive: true, sizeBadge: true, closeAfterRound: false, notify: { enabled: false, discordWebhook: '', telegramToken: '', telegramChat: '', withShot: true, events: [] } },
        updateSettings: () => {},
        sendTestAlert: () => Promise.resolve(false),
        stepEditor: {},
        screenEditor: { probe: () => null },
        queueEditor: {},
        dryRunner: { start: () => {}, stop: () => {} },
        refresh: () => {},
      });
      store.openPanel();
      store.setTab(tab);
      panel.render();
      expect(document.querySelector('.bhb-panel__body').children.length).toBeGreaterThan(0);
    });
  }
});
