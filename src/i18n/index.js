import vi from './vi.js';
import en from './en.js';

const BUNDLES = { vi, en };

let active = vi;
let activeCode = 'vi';

/** @param {string} code */
export function setLanguage(code) {
  active = BUNDLES[code] || vi;
  activeCode = BUNDLES[code] ? code : 'vi';
}

export function getLanguage() {
  return activeCode;
}

/**
 * Look up a string, substituting `{name}` placeholders.
 *
 * A missing key returns the key itself: a visibly wrong label beats a blank
 * panel, and it points straight at what to add.
 *
 * @param {string} key
 * @param {Record<string, string | number>} [params]
 * @returns {string}
 */
export function t(key, params) {
  const template = active[key] ?? key;
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in params ? String(params[name]) : match
  );
}
