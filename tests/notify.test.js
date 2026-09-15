/**
 * Alerts go over the network, so the network is the thing faked: these tests
 * assert what would have been sent, never that anything was.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import {
  createNotifier,
  normaliseNotifyConfig,
  hasNotifyTarget,
  NOTIFY_EVENTS,
} from '../src/core/notify.js';
import { NOTIFY_COOLDOWN_MS } from '../src/core/constants.js';

const DISCORD = 'https://discord.com/api/webhooks/1/abc';

function config(overrides = {}) {
  return {
    enabled: true,
    discordWebhook: DISCORD,
    telegramToken: '',
    telegramChat: '',
    withShot: false,
    events: ['notify'],
    ...overrides,
  };
}

/** A notifier whose fetch records calls and always succeeds. */
function harness(overrides = {}, clock = () => 1000) {
  const calls = [];
  const fetchStub = vi.fn((url, init) => {
    calls.push({ url, init });
    return Promise.resolve({ ok: true });
  });
  const notifier = createNotifier({
    getConfig: () => config(overrides),
    getCanvas: () => null,
    fetch: fetchStub,
    now: clock,
  });
  return { notifier, calls, fetchStub };
}

describe('config', () => {
  it('drops event kinds it does not know', () => {
    const normalised = normaliseNotifyConfig({ events: ['notify', 'nonsense'] });
    expect(normalised.events).toEqual(['notify']);
    expect(NOTIFY_EVENTS).toContain('notify');
  });

  it('trims pasted tokens, which arrive with whitespace more often than not', () => {
    expect(normaliseNotifyConfig({ discordWebhook: `  ${DISCORD}\n` }).discordWebhook).toBe(DISCORD);
  });

  it('is off, with no target, by default', () => {
    const fresh = normaliseNotifyConfig(null);
    expect(fresh.enabled).toBe(false);
    expect(hasNotifyTarget(fresh)).toBe(false);
  });

  it('needs both halves of a Telegram target', () => {
    expect(hasNotifyTarget(config({ discordWebhook: '', telegramToken: 't' }))).toBe(false);
    expect(
      hasNotifyTarget(config({ discordWebhook: '', telegramToken: 't', telegramChat: '5' }))
    ).toBe(true);
  });
});

describe('sending', () => {
  it('posts JSON to the Discord webhook when there is no screenshot', async () => {
    const { notifier, calls } = harness();

    expect(await notifier.notify('legendary drop', 'notify')).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(DISCORD);
    expect(JSON.parse(calls[0].init.body).content).toBe('legendary drop');
  });

  it('sends to both channels when both are configured', async () => {
    const { notifier, calls } = harness({ telegramToken: 'tok', telegramChat: '42' });

    await notifier.notify('drop', 'notify');

    expect(calls.map((call) => call.url)).toEqual([
      DISCORD,
      'https://api.telegram.org/bottok/sendMessage',
    ]);
  });

  it('sends nothing while the switch is off', async () => {
    const { notifier, fetchStub } = harness({ enabled: false });

    expect(await notifier.notify('drop', 'notify')).toBe(false);
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it('lets a forced test alert past the on/off switch, but not past a missing channel', async () => {
    const off = harness({ enabled: false });
    expect(await off.notifier.notify('test', 'manual', { force: true })).toBe(true);

    const targetless = harness({ enabled: false, discordWebhook: '' });
    expect(await targetless.notifier.notify('test', 'manual', { force: true })).toBe(false);
  });

  it('sends nothing when no channel is configured', async () => {
    const { notifier, fetchStub } = harness({ discordWebhook: '' });

    expect(await notifier.notify('drop', 'notify')).toBe(false);
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it('reports failure instead of throwing into the farming loop', async () => {
    const report = vi.fn();
    const notifier = createNotifier({
      getConfig: () => config(),
      getCanvas: () => null,
      fetch: () => Promise.reject(new Error('CORS')),
      now: () => 1000,
      report,
    });

    await expect(notifier.notify('drop', 'notify')).resolves.toBe(false);
    expect(report).toHaveBeenCalled();
  });
});

describe('cooldown', () => {
  it('holds a repeat of the same kind inside the quiet window', async () => {
    let time = 1000;
    const { notifier, calls } = harness({}, () => time);

    await notifier.notify('drop', 'notify');
    time += NOTIFY_COOLDOWN_MS - 1;
    await notifier.notify('drop again', 'notify');

    expect(calls).toHaveLength(1);
  });

  it('lets the same kind through once the window has passed', async () => {
    let time = 1000;
    const { notifier, calls } = harness({}, () => time);

    await notifier.notify('drop', 'notify');
    time += NOTIFY_COOLDOWN_MS;
    await notifier.notify('drop again', 'notify');

    expect(calls).toHaveLength(2);
  });

  it('counts each kind separately, so an alert never mutes another', async () => {
    const { notifier, calls } = harness();

    await notifier.notify('drop', 'notify');
    await notifier.notify('out of tickets', 'resource');

    expect(calls).toHaveLength(2);
  });

  it('clearCooldown lets a test alert straight through', async () => {
    const { notifier, calls } = harness();

    await notifier.notify('drop', 'notify');
    notifier.clearCooldown();
    await notifier.notify('test', 'notify');

    expect(calls).toHaveLength(2);
  });
});
