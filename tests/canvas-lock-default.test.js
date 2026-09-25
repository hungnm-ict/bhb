/**
 * The canvas lock is on unless it has been turned off.
 *
 * A step set only means the same thing on another machine if the game
 * rendered at the same resolution, so the lock is what makes one shareable —
 * and that is the normal case, not the experiment it started as.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { loadSettings, saveSettings } from '../src/core/storage.js';

beforeEach(() => {
  window.localStorage.clear();
});

describe('the canvas lock default', () => {
  it('is on for someone who has never touched it', () => {
    expect(loadSettings().canvasLock.enabled).toBe(true);
  });

  it('stays off once it has been turned off', () => {
    const settings = loadSettings();
    settings.canvasLock = { ...settings.canvasLock, enabled: false };
    saveSettings(settings);

    expect(loadSettings().canvasLock.enabled).toBe(false);
  });

  it('comes back on when turned back on', () => {
    const settings = loadSettings();
    settings.canvasLock = { ...settings.canvasLock, enabled: true };
    saveSettings(settings);

    expect(loadSettings().canvasLock.enabled).toBe(true);
  });
});

describe('the lock section', () => {
  it('no longer calls itself an experiment', async () => {
    const { t, setLanguage } = await import('../src/i18n/index.js');
    for (const language of ['en', 'vi']) {
      setLanguage(language);
      expect(t('lock.title').toLowerCase()).not.toContain('experiment');
      expect(t('lock.title').toLowerCase()).not.toContain('thử nghiệm');
    }
  });

  it('warns about what is lost while it is off', async () => {
    const { t, setLanguage } = await import('../src/i18n/index.js');
    for (const language of ['en', 'vi']) {
      setLanguage(language);
      expect(t('lock.offWarning').length).toBeGreaterThan(20);
      expect(t('lock.offWarning')).not.toBe('lock.offWarning');
    }
    setLanguage('vi');
  });
});

describe('the Escape key', () => {
  it('is off unless asked for', async () => {
    window.localStorage.clear();
    const { loadSettings } = await import('../src/core/storage.js');
    expect(loadSettings().panicEscape).toBe(false);
  });
});
