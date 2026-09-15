import { VERSION } from './constants.js';

/**
 * Checking whether a newer build is published.
 *
 * Tampermonkey does this on its own schedule, and the schedule is the problem:
 * it keeps a minimum interval per script, so pressing its own "check for
 * updates" right after a release often reports nothing. This reads the
 * published header directly and says what is actually there.
 *
 * The cache-buster is not optional. raw.githubusercontent.com is served from
 * edge caches that hold a stale copy for minutes, which is exactly long enough
 * to tell someone their brand new release does not exist.
 */

export const SCRIPT_URL =
  'https://raw.githubusercontent.com/hungnm-ict/bhb/master/dist/bhb.user.js';

/** Only the header is needed, and it is the first few hundred bytes. */
const HEADER_BYTES = 2048;

/** @param {string} source @returns {string | null} */
export function parseVersion(source) {
  const match = /^\/\/\s*@version\s+(\S+)/m.exec(source || '');
  return match ? match[1] : null;
}

/**
 * @returns {number} 1 when `a` is newer, -1 when older, 0 when the same
 */
export function compareVersions(a, b) {
  const left = String(a).split('.').map((part) => parseInt(part, 10) || 0);
  const right = String(b).split('.').map((part) => parseInt(part, 10) || 0);

  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] || 0) - (right[index] || 0);
    if (difference !== 0) {
      return difference > 0 ? 1 : -1;
    }
  }
  return 0;
}

/**
 * @param {object} [deps]
 * @param {typeof fetch} [deps.fetch]
 * @param {string} [deps.current]
 * @returns {Promise<{ ok: boolean, latest: string | null, hasUpdate: boolean }>}
 */
export async function checkForUpdate(deps = {}) {
  const send = deps.fetch || ((...args) => fetch(...args));
  const current = deps.current || VERSION;

  try {
    const response = await send(`${SCRIPT_URL}?at=${Date.now()}`, {
      cache: 'no-store',
      headers: { Range: `bytes=0-${HEADER_BYTES}` },
    });
    if (!response || response.ok === false) {
      return { ok: false, latest: null, hasUpdate: false };
    }

    const latest = parseVersion(await response.text());
    if (!latest) {
      return { ok: false, latest: null, hasUpdate: false };
    }
    return { ok: true, latest, hasUpdate: compareVersions(latest, current) > 0 };
  } catch (error) {
    console.warn('[BHB] update check failed', error);
    return { ok: false, latest: null, hasUpdate: false };
  }
}
