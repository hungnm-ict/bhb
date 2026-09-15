import { NOTIFY_COOLDOWN_MS, NOTIFY_SHOT_QUALITY } from './constants.js';
import { realNow } from './timers.js';

/**
 * Discord and Telegram alerts.
 *
 * The script is `@grant none`, so this is plain `fetch` — both APIs answer
 * cross-origin requests from a page, which is the whole reason those two are
 * the ones supported.
 *
 * A screenshot is worth more than the text: "legendary" means nothing without
 * the popup under it. The canvas can be read directly because the canvas patch
 * forces `preserveDrawingBuffer` on every context the game creates.
 *
 * Failures are swallowed on purpose. A webhook that 404s must not take down the
 * farming loop that called it — it reports and the bot carries on.
 *
 * @typedef {object} NotifyConfig
 * @property {boolean} enabled
 * @property {string} discordWebhook
 * @property {string} telegramToken
 * @property {string} telegramChat
 * @property {boolean} withShot attach a canvas screenshot
 * @property {string[]} events action kinds worth an alert
 */

/** Event kinds a user can subscribe to, in the order the settings list them. */
export const NOTIFY_EVENTS = Object.freeze(['notify', 'resource', 'hang', 'task']);

export function createDefaultNotifyConfig() {
  return {
    enabled: false,
    discordWebhook: '',
    telegramToken: '',
    telegramChat: '',
    withShot: true,
    events: ['notify'],
  };
}

/** @param {unknown} candidate @returns {NotifyConfig} */
export function normaliseNotifyConfig(candidate) {
  const base = createDefaultNotifyConfig();
  if (!candidate || typeof candidate !== 'object') {
    return base;
  }

  for (const key of ['discordWebhook', 'telegramToken', 'telegramChat']) {
    if (typeof candidate[key] === 'string') {
      base[key] = candidate[key].trim();
    }
  }
  base.enabled = candidate.enabled === true;
  base.withShot = candidate.withShot !== false;
  if (Array.isArray(candidate.events)) {
    base.events = candidate.events.filter((kind) => NOTIFY_EVENTS.includes(kind));
  }
  return base;
}

/** Nothing to send to means nothing is sent, however enabled the switch is. */
export function hasNotifyTarget(config) {
  return Boolean(
    config &&
      (config.discordWebhook || (config.telegramToken && config.telegramChat))
  );
}

/**
 * The canvas as a JPEG blob.
 *
 * @param {HTMLCanvasElement | null} canvas
 * @returns {Promise<Blob | null>} null whenever the frame cannot be read
 */
export function captureShot(canvas) {
  return new Promise((resolve) => {
    if (!canvas || typeof canvas.toBlob !== 'function') {
      resolve(null);
      return;
    }
    try {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', NOTIFY_SHOT_QUALITY);
    } catch (error) {
      console.warn('[BHB] could not capture the canvas', error);
      resolve(null);
    }
  });
}

/**
 * @param {NotifyConfig} config
 * @param {string} text
 * @param {Blob | null} shot
 * @returns {{ url: string, body: FormData | string, headers?: Record<string,string> }}
 */
function discordRequest(config, text, shot) {
  if (!shot) {
    return {
      url: config.discordWebhook,
      body: JSON.stringify({ content: text }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
  // Multipart sets its own boundary, so the Content-Type header is left off.
  const form = new FormData();
  form.append('payload_json', JSON.stringify({ content: text }));
  form.append('files[0]', shot, 'bhb.jpg');
  return { url: config.discordWebhook, body: form };
}

/** @returns {{ url: string, body: FormData | string, headers?: Record<string,string> }} */
function telegramRequest(config, text, shot) {
  const base = `https://api.telegram.org/bot${config.telegramToken}`;
  if (!shot) {
    return {
      url: `${base}/sendMessage`,
      body: JSON.stringify({ chat_id: config.telegramChat, text }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
  const form = new FormData();
  form.append('chat_id', config.telegramChat);
  form.append('caption', text);
  form.append('photo', shot, 'bhb.jpg');
  return { url: `${base}/sendPhoto`, body: form };
}

/**
 * @param {object} deps
 * @param {() => NotifyConfig} deps.getConfig
 * @param {() => HTMLCanvasElement | null} deps.getCanvas
 * @param {typeof fetch} [deps.fetch]
 * @param {() => number} [deps.now]
 * @param {(message: string) => void} [deps.report]
 */
export function createNotifier(deps) {
  const send = deps.fetch || ((...args) => fetch(...args));
  const now = deps.now || realNow;
  const report = deps.report || (() => {});

  /** Last send per event kind, so a flapping screen cannot spam a channel. */
  const lastSentAt = new Map();

  function post(request) {
    return send(request.url, {
      method: 'POST',
      body: request.body,
      ...(request.headers ? { headers: request.headers } : {}),
    });
  }

  /**
   * Send one alert to every configured channel.
   *
   * @param {string} text
   * @param {string} [kind] the event kind, for the cooldown
   * @param {{ force?: boolean }} [options] force ignores the on/off switch, so
   *   a test alert reports what the channel did rather than what the switch is
   * @returns {Promise<boolean>} whether anything went out
   */
  async function notify(text, kind = 'manual', options = {}) {
    const config = deps.getConfig();
    if (!config || (!config.enabled && !options.force) || !hasNotifyTarget(config)) {
      return false;
    }

    const at = now();
    const previous = lastSentAt.get(kind);
    if (previous !== undefined && at - previous < NOTIFY_COOLDOWN_MS) {
      return false;
    }
    lastSentAt.set(kind, at);

    const shot = config.withShot ? await captureShot(deps.getCanvas()) : null;

    const requests = [];
    if (config.discordWebhook) {
      requests.push(discordRequest(config, text, shot));
    }
    if (config.telegramToken && config.telegramChat) {
      requests.push(telegramRequest(config, text, shot));
    }

    const results = await Promise.all(
      requests.map((request) =>
        post(request).then(
          (response) => response && response.ok !== false,
          (error) => {
            console.warn('[BHB] alert failed', error);
            return false;
          }
        )
      )
    );

    const sent = results.some(Boolean);
    if (!sent) {
      report('alert failed — check the webhook');
    }
    return sent;
  }

  /** Forget the cooldowns, so a test alert always goes out. */
  function clearCooldown() {
    lastSentAt.clear();
  }

  return { notify, clearCooldown };
}
