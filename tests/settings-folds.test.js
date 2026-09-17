/**
 * The settings tab is read far more often than it is changed, so what is
 * pinned here is that a closed section still says what it is set to, and that
 * opening one cannot grow the tab back into the page it used to be.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderSettingsTab } from '../src/ui/panel/settings.js';
import { createUiStore } from '../src/ui/store.js';

function build(overrides = {}) {
  const settings = {
    scaleMode: 'scale',
    watchdog: true,
    keepAlive: true,
    sizeBadge: true,
    closeAfterRound: false,
    canvasLock: { enabled: false },
    notify: {
      enabled: false,
      discordWebhook: '',
      telegramToken: '',
      telegramChat: '',
      withShot: true,
      events: [],
    },
    openSection: null,
    probes: [],
    ...overrides,
  };

  const deps = {
    store: createUiStore(),
    settings,
    profiles: {
      list: () => [{ id: 'p', name: 'Main' }],
      activeId: () => 'p',
      activeName: () => 'Main',
      exportAll: () => '',
    },
    getActivities: () => [
      { id: 'pvp', name: 'PVP', enabled: true },
      { id: 'raid', name: 'Raid', enabled: false },
    ],
    getSteps: () => [],
    getProbes: () => settings.probes,
    probeEditor: {
      scoreAll: () => ({ buffer: null, scores: [] }),
      clear: () => {},
      remove: () => {},
    },
    getEngineState: () => ({ activity: null, round: 0, spent: [] }),
    getReloadCount: () => 0,
    updateSettings: (changes) => Object.assign(settings, changes),
    sendTestAlert: () => Promise.resolve(false),
    refresh: () => {},
  };

  return { deps, node: renderSettingsTab(deps) };
}

const heads = (node) => [...node.querySelectorAll('.bhb-fold__head')];
const summaries = (node) =>
  heads(node).map((head) => head.querySelector('.bhb-fold__summary').textContent);

describe('settings sections', () => {
  it('starts with every section closed', () => {
    const { node } = build();

    expect(heads(node).length).toBeGreaterThan(4);
    expect(node.querySelectorAll('.bhb-fold__body')).toHaveLength(0);
  });

  it('says what each section is set to without being opened', () => {
    const { node } = build();
    const text = summaries(node).join('|');

    expect(text, 'the active profile').toContain('Main');
    expect(text, 'how many behaviour switches are on').toContain('3/5');
    expect(text, 'only the enabled activities count').toContain('1');
  });

  it('opens exactly the section asked for', () => {
    const { node } = build({ openSection: 'behaviour' });

    expect(node.querySelectorAll('.bhb-fold__body')).toHaveLength(1);
    expect(node.querySelector('.bhb-fold.is-open .bhb-label').textContent).toBeTruthy();
  });

  it('clicking a head records the choice, and clicking it again closes it', () => {
    const { deps, node } = build();

    heads(node)[0].click();
    expect(deps.settings.openSection).toBe('profiles');

    const reopened = renderSettingsTab(deps);
    heads(reopened)[0].click();
    expect(deps.settings.openSection, 'a second click folds it away').toBe(null);
  });

  it('names the channel an alert would go to, when one is set up', () => {
    const { node } = build({
      notify: {
        enabled: true,
        discordWebhook: 'https://discord.com/api/webhooks/1/a',
        telegramToken: '',
        telegramChat: '',
        withShot: true,
        events: ['notify'],
      },
    });

    expect(summaries(node).join('|')).toContain('Discord');
  });
});
