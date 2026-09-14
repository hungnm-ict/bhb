/**
 * @typedef {{ r: number, g: number, b: number }} Rgb
 */

/** @param {number} value @returns {string} */
function toHexByte(value) {
  return value.toString(16).padStart(2, '0');
}

/**
 * @param {Rgb} rgb
 * @returns {string} lowercase `#rrggbb`
 */
export function rgbToHex(rgb) {
  return '#' + toHexByte(rgb.r) + toHexByte(rgb.g) + toHexByte(rgb.b);
}

/**
 * @param {string} hex `#rrggbb` or `rrggbb`
 * @returns {Rgb}
 */
export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/**
 * Chebyshev distance per channel — matches upstream's behaviour, and is
 * deliberately not perceptual: we compare flat UI colours, not photos.
 *
 * @param {Rgb} actual
 * @param {Rgb} expected
 * @param {number} tolerance
 * @returns {boolean}
 */
export function colorMatches(actual, expected, tolerance) {
  return (
    Math.abs(actual.r - expected.r) <= tolerance &&
    Math.abs(actual.g - expected.g) <= tolerance &&
    Math.abs(actual.b - expected.b) <= tolerance
  );
}
