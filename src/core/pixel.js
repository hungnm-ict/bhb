import { hexToRgb, colorMatches } from './color.js';

/**
 * @typedef {import('./color.js').Rgb} Rgb
 */

/**
 * Read one pixel in buffer space (bottom-left origin).
 *
 * @param {WebGLRenderingContext} gl
 * @param {number} x
 * @param {number} y
 * @returns {Rgb | null} null when the read fails (context lost, out of range)
 */
export function readPixel(gl, x, y) {
  const data = new Uint8Array(4);
  try {
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
  } catch {
    return null;
  }
  return { r: data[0], g: data[1], b: data[2] };
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {{ x: number, y: number }} point
 * @param {string} hex
 * @param {number} tolerance
 * @returns {boolean}
 */
export function pixelMatches(gl, point, hex, tolerance) {
  const pixel = readPixel(gl, point.x, point.y);
  if (!pixel) {
    return false;
  }
  return colorMatches(pixel, hexToRgb(hex), tolerance);
}
