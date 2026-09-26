/**
 * The panel leaves a field alone while it is being typed in.
 *
 * It rebuilds twice a second, and a rebuilt field is a new element — the
 * caret goes with the old one.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { createPanel } from '../src/ui/panel/index.js';
import { createUiStore, Tab } from '../src/ui/store.js';
import { createStep } from '../src/bot/step.js';

function build() {
  document.body.replaceChildren();
  for (const stale of document.querySelectorAll('.bhb-panel')) {
    stale.remove();
  }
  const store = createUiStore();
  const step = createStep({ label: 'one', hex: '#ff0000', points: [{ x: 1, y: 2 }] });
  const panel = createPanel({
    store,
    getEngineState: () => ({ expectedStepId: null, activeTask: null, phase: '', round: 0, remainingMs: 0, screen: null, screenName: null }),
    toggleTask: () => {},
    getRunTarget: () => 'script',
    setRunTarget: () => {},
    runSelected: () => {},
    getSteps: () => [step],
    getProbes: () => [],
    probeEditor: { scoreAll: () => ({ buffer: null, scores: [] }), clear: () => {}, remove: () => {} },
    getScreens: () => [],
    getActivities: () => [],
    getCanvasLock: () => ({ width: 640, height: 400 }),
    getStats: () => ({ startedAt: Date.now(), clicks: 0, rounds: 0, resyncs: 0, hangs: 0, drops: 0, runningMs: 0, activities: {} }),
    resetStats: () => {},
    getReloadCount: () => 0,
    getProfileName: () => 'Default',
    profiles: { list: () => [{ id: 'p', name: 'Default' }], activeId: () => 'p', activeName: () => 'Default', exportAll: () => '' },
    settings: { scaleMode: 'scale', showScreens: false, watchdog: false, keepAlive: true, sizeBadge: true, closeAfterRound: false, notify: { enabled: false, discordWebhook: '', telegramToken: '', telegramChat: '', withShot: true, events: [] }, canvasLock: { enabled: false, width: 800, height: 520 } },
    updateSettings: () => {},
    sendTestAlert: () => Promise.resolve(false),
    stepEditor: {},
    screenEditor: { probe: () => null },
    queueEditor: {},
    dryRunner: { start: () => {}, stop: () => {} },
    refresh: () => {},
  });
  store.openPanel();
  store.setTab(Tab.STEPS);
  panel.render();
  return { panel, store };
}

describe('typing in the panel', () => {
  it('keeps the very element the caret is in across a tick', () => {
    const { panel } = build();
    const field = document.querySelector('.bhb-rule__name');
    field.focus();
    field.value = 'half a na';

    panel.render();

    expect(document.querySelector('.bhb-rule__name')).toBe(field);
    expect(document.activeElement).toBe(field);
    expect(field.value).toBe('half a na');
  });

  it('rebuilds once the caret has left', () => {
    const { panel } = build();
    const field = document.querySelector('.bhb-rule__name');
    field.focus();
    panel.render();
    field.blur();

    panel.render();
    expect(document.querySelector('.bhb-rule__name')).not.toBe(field);
  });

  it('rebuilds anyway when a change asked it to', () => {
    const { panel } = build();
    const field = document.querySelector('.bhb-rule__name');
    field.focus();

    panel.render({ force: true });
    expect(document.querySelector('.bhb-rule__name')).not.toBe(field);
  });
});
