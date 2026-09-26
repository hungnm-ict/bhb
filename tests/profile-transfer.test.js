/**
 * Moving whole profiles between windows.
 *
 * Selecting a wall of JSON by hand is how half of it gets left behind.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderSettingsTab } from '../src/ui/panel/settings.js';
import { createUiStore } from '../src/ui/store.js';

const PROFILES = [{ id: 'p1', name: 'Main' }];

function build(hooks = {}) {
  document.body.replaceChildren();
  const node = renderSettingsTab({
    store: createUiStore(),
    getEngineState: () => ({ activity: null, spent: [] }),
    getActivities: () => [],
    getProbes: () => [],
    getSteps: () => [],
    getScreens: () => [],
    probeEditor: { scoreAll: () => ({ buffer: null, scores: [] }), clear: () => {}, remove: () => {} },
    queueEditor: { move: () => {}, toggle: () => {}, rename: () => {}, sortToDefault: () => {} },
    getReloadCount: () => 0,
    settings: {
      scaleMode: 'scale', language: 'vi', watchdog: false, keepAlive: true, sizeBadge: true,
      fpsBadge: true, multiplyFrames: true, closeAfterRound: false, showScreens: false,
      keepLog: true, panicEscape: false, openSection: 'transfer', lagWindows: [],
      notify: { enabled: false, discordWebhook: '', telegramToken: '', telegramChat: '', withShot: true, events: [] },
      canvasLock: { enabled: true, width: 800, height: 500 },
    },
    updateSettings: () => {},
    sendTestAlert: () => Promise.resolve(false),
    profiles: {
      list: () => PROFILES,
      activeId: () => 'p1',
      activeName: () => 'Main',
      exportAll: () => '{"profiles":[]}',
      importAll: hooks.importAll || (() => {}),
    },
    refresh: () => {},
  });
  document.body.append(node);
  return node;
}

/** The fold's own header carries the section's name too, so match exactly. */
function findButton(node, label) {
  return [...node.querySelectorAll('button')].find((button) => button.textContent === label);
}

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined), readText: vi.fn() },
    configurable: true,
  });
});

describe('profile export', () => {
  it('puts the whole export on the clipboard, not just on screen', async () => {
    const node = build();
    findButton(node, 'Xuất').click();
    await Promise.resolve();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('{"profiles":[]}');
  });

  it('says so, so nobody wonders whether it worked', async () => {
    const node = build();
    findButton(node, 'Xuất').click();
    await Promise.resolve();
    await Promise.resolve();

    expect(node.textContent).toMatch(/chép|copied/i);
  });
});

describe('profile import', () => {
  it('loads what is pasted straight into the box', () => {
    const importAll = vi.fn();
    const node = build({ importAll });

    const box = node.querySelector('textarea');
    const paste = new Event('paste', { bubbles: true, cancelable: true });
    paste.clipboardData = { getData: () => '{"profiles":[1]}' };
    box.dispatchEvent(paste);

    expect(importAll).toHaveBeenCalledWith('{"profiles":[1]}');
  });

  it('says what went wrong rather than overwriting the text with the error', () => {
    const importAll = vi.fn(() => {
      throw new Error('not a BHB profile export');
    });
    const node = build({ importAll });

    const box = node.querySelector('textarea');
    const paste = new Event('paste', { bubbles: true, cancelable: true });
    paste.clipboardData = { getData: () => 'rubbish' };
    box.dispatchEvent(paste);

    expect(box.value, 'the text stays put so it can be fixed').toBe('rubbish');
    expect(node.textContent).toContain('not a BHB profile export');
  });
});
