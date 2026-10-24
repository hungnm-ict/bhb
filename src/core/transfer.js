import { deflateSync, inflateSync, strToU8, strFromU8 } from 'fflate';

/**
 * The text every export copies and every import reads.
 *
 * Deflated and base64'd: a screen list is mostly repeated keys and hex
 * samples, and a JSON wall that long makes a chat box stutter on paste.
 * Plain JSON still imports, so an export copied before this keeps working.
 */

const PREFIX = 'BHB1:';

/** @param {unknown} value @returns {string} */
export function packTransfer(value) {
  const bytes = deflateSync(strToU8(JSON.stringify(value)), { level: 9 });
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return PREFIX + btoa(binary);
}

/**
 * @param {string} text a packed export, or the plain JSON older builds wrote
 * @returns {any}
 * @throws {Error} when the text is neither
 */
export function unpackTransfer(text) {
  const trimmed = String(text).trim();
  if (!trimmed.startsWith(PREFIX)) {
    return JSON.parse(trimmed);
  }
  const binary = atob(trimmed.slice(PREFIX.length).replace(/\s+/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return JSON.parse(strFromU8(inflateSync(bytes)));
}
