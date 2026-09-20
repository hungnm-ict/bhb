/**
 * Choosing the pinned size from the Settings tab.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderSettingsTab } from '../src/ui/panel/settings.js';
import { LOCK_SIZE } from '../src/core/canvas-lock.js';
import { createUiStore } from '../src/ui/store.js';

function renderSettings(canvasLock, onUpdate = () => {}) {
  const settings = {
    scaleMode: 'scale',
    watchdog: true,
    keepAlive: true,
    sizeBadge: true,
    closeAfterRound: false,
    canvasLock,
    notify: {
      enabled: false,
      discordWebhook: '',
      telegramToken: '',
      telegramChat: '',
      withShot: true,
      events: [],
    },
    openSection: 'lock',
    probes: [],
  };

  return renderSettingsTab({
    store: createUiStore(),
    settings,
    profiles: {
      list: () => [{ id: 'p', name: 'Main' }],
      activeId: () => 'p',
      activeName: () => 'Main',
      exportAll: () => '',
    },
    getActivities: () => [],
    getSteps: () => [],
    getProbes: () => settings.probes,
    probeEditor: { scoreAll: () => ({ buffer: null, scores: [] }), clear: () => {}, remove: () => {} },
    getEngineState: () => ({ activity: null, round: 0, spent: [] }),
    getReloadCount: () => 0,
    updateSettings: onUpdate,
    sendTestAlert: () => Promise.resolve(false),
    refresh: () => {},
  });
}

function sizeSelect(node) {
  return [...node.querySelectorAll('select')].find((select) =>
    [...select.options].some((option) => option.value === '800x500')
  );
}

describe('the pinned size picker', () => {
  it('offers the three sizes, smallest first', () => {
    const select = sizeSelect(renderSettings({ enabled: true, width: 640, height: 400 }));
    expect([...select.options].map((option) => option.text)).toEqual([
      '560×350',
      '640×400',
      '800×500',
    ]);
  });

  it('shows the size the profile is on', () => {
    const select = sizeSelect(renderSettings({ enabled: true, width: 800, height: 500 }));
    expect(select.value).toBe('800x500');
  });

  it('saves the chosen size as numbers', () => {
    const saved = [];
    const select = sizeSelect(
      renderSettings({ enabled: true, width: 640, height: 400 }, (changes) => saved.push(changes))
    );

    select.value = '560x350';
    select.dispatchEvent(new Event('change'));

    expect(saved).toEqual([{ canvasLock: { enabled: true, width: 560, height: 350 } }]);
  });

  it('cannot be used while the lock is off', () => {
    const select = sizeSelect(renderSettings({ enabled: false, width: 640, height: 400 }));
    expect(select.disabled).toBe(true);
  });

  it('falls back to the default for a profile saved before there was a choice', () => {
    const select = sizeSelect(renderSettings({ enabled: true }));
    expect(select.value).toBe(`${LOCK_SIZE.width}x${LOCK_SIZE.height}`);
  });
});
