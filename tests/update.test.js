/**
 * The update check exists because Tampermonkey's own has a minimum interval
 * per script, so it reports nothing right after a release — and because the
 * CDN serving the file holds a stale copy for minutes, which is long enough
 * to tell someone their new release does not exist.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { checkForUpdate, parseVersion, compareVersions, SCRIPT_URL } from '../src/core/update.js';

const header = (version) => `// ==UserScript==
// @name         BHB
// @version      ${version}
// @description  whatever
// ==/UserScript==`;

function fetchStub(body, { ok = true } = {}) {
  const calls = [];
  const stub = vi.fn((url, init) => {
    calls.push({ url, init });
    return Promise.resolve({ ok, text: () => Promise.resolve(body) });
  });
  return { stub, calls };
}

describe('parsing the published header', () => {
  it('finds the version line', () => {
    expect(parseVersion(header('1.2.3'))).toBe('1.2.3');
  });

  it('returns nothing for a body that is not a userscript', () => {
    expect(parseVersion('<html>404</html>')).toBe(null);
    expect(parseVersion('')).toBe(null);
  });
});

describe('comparing versions', () => {
  it('orders by each part, not as text', () => {
    // As strings, "0.9.0" sorts after "0.12.0" — which would hide every
    // release for the rest of the 0.x line.
    expect(compareVersions('0.12.0', '0.9.0')).toBe(1);
    expect(compareVersions('0.9.0', '0.12.0')).toBe(-1);
    expect(compareVersions('1.0.0', '0.99.99')).toBe(1);
  });

  it('calls equal versions equal, however they are written', () => {
    expect(compareVersions('1.2.0', '1.2.0')).toBe(0);
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
  });
});

describe('checking', () => {
  it('reports a newer build', async () => {
    const { stub } = fetchStub(header('0.13.0'));

    const result = await checkForUpdate({ fetch: stub, current: '0.12.1' });

    expect(result).toMatchObject({ ok: true, latest: '0.13.0', hasUpdate: true });
  });

  it('reports no update when the published build is the one running', async () => {
    const { stub } = fetchStub(header('0.12.1'));

    expect(await checkForUpdate({ fetch: stub, current: '0.12.1' })).toMatchObject({
      ok: true,
      hasUpdate: false,
    });
  });

  it('never lets a CDN cache answer for the current release', async () => {
    const { stub, calls } = fetchStub(header('0.13.0'));

    await checkForUpdate({ fetch: stub, current: '0.12.1' });

    expect(calls[0].url.startsWith(SCRIPT_URL)).toBe(true);
    expect(calls[0].url, 'a cache-buster, or a stale edge answers').not.toBe(SCRIPT_URL);
    expect(calls[0].init.cache).toBe('no-store');
  });

  it('says it could not check rather than claiming to be current', async () => {
    const failed = await checkForUpdate({
      fetch: () => Promise.reject(new Error('offline')),
      current: '0.12.1',
    });
    expect(failed).toMatchObject({ ok: false, hasUpdate: false });

    const { stub } = fetchStub('<html>404</html>');
    expect(await checkForUpdate({ fetch: stub, current: '0.12.1' })).toMatchObject({ ok: false });
  });
});
