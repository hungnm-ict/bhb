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
    lagWindows: [],
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

function sizeChips(node) {
  return [...node.querySelectorAll('.bhb-chips .bhb-chip')].find((chip) =>
    chip.textContent.includes('800')
  )?.closest('.bhb-chips');
}

function chipLabels(chips) {
  return [...chips.querySelectorAll('.bhb-chip')].map((chip) => chip.textContent);
}

function activeChip(chips) {
  return chips.querySelector('.bhb-chip.is-active');
}

describe('the pinned size picker', () => {
  it('offers the three sizes, smallest first', () => {
    const chips = sizeChips(renderSettings({ enabled: true, width: 640, height: 400 }));
    expect(chipLabels(chips)).toEqual(['560×350', '640×400', '800×500']);
  });

  it('shows the size the profile is on', () => {
    const chips = sizeChips(renderSettings({ enabled: true, width: 800, height: 500 }));
    expect(activeChip(chips).textContent).toBe('800×500');
  });

  it('saves the chosen size as numbers', () => {
    const saved = [];
    const chips = sizeChips(
      renderSettings({ enabled: true, width: 640, height: 400 }, (changes) => saved.push(changes))
    );

    [...chips.querySelectorAll('.bhb-chip')]
      .find((chip) => chip.textContent === '560×350')
      .click();

    expect(saved).toEqual([{ canvasLock: { enabled: true, width: 560, height: 350 } }]);
  });

  it('cannot be used while the lock is off', () => {
    const chips = sizeChips(renderSettings({ enabled: false, width: 640, height: 400 }));
    expect([...chips.querySelectorAll('.bhb-chip')].every((chip) => chip.disabled)).toBe(true);
  });

  it('falls back to the default for a profile saved before there was a choice', () => {
    const chips = sizeChips(renderSettings({ enabled: true }));
    expect(activeChip(chips).textContent).toBe(`${LOCK_SIZE.width}×${LOCK_SIZE.height}`);
  });
});
