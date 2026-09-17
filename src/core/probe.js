import { rgbToHex, hexToRgb } from './color.js';
import { resolvePoint } from './coords.js';

/**
 * Probes: throwaway points that answer "does this preset survive a resolution
 * change?"
 *
 * A step is stored with the framebuffer size it was captured at, so it already
 * scales. What nobody could see until now is whether that scaling lands where
 * the button actually moved to. A probe is one captured point plus its colour;
 * after the game's resolution changes, it says where the scaling now puts it
 * and how far the colour drifted.
 *
 * They belong to settings, not to a profile: a probe is a measurement, and a
 * profile export is something people share.
 *
 * @typedef {import('./color.js').Rgb} Rgb
 * @typedef {{ id: string, label: string, x: number, y: number, bw: number,
 *   bh: number, hex: string }} Probe
 */

/**
 * How far two aspect ratios may differ before they count as different.
 *
 * Framebuffer sizes are integers, so the same logical ratio arrives slightly
 * off — 1920x1200 and 640x400 are both 1.6, but 1024x640 is 1.6 only to three
 * places. The threshold sits well under the 1.60 → 1.50 step this was built to
 * catch.
 */
export const ASPECT_EPSILON = 0.01;

function createProbeId() {
  return `pr${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * @param {{ x: number, y: number, bw: number, bh: number, hex: string,
 *   label?: string }} captured
 * @returns {Probe}
 */
export function createProbe(captured) {
  return {
    id: createProbeId(),
    label: captured.label || '',
    x: captured.x,
    y: captured.y,
    bw: captured.bw,
    bh: captured.bh,
    hex: captured.hex,
  };
}

/**
 * Judge one probe against the framebuffer as it is now.
 *
 * `live` is the pixel read at the resolved position, or null when the read
 * failed — in which case the verdict is "unknown", never "wrong". A probe
 * cannot be scored from a lost context.
 *
 * @param {Probe} probe
 * @param {{ width: number, height: number }} buffer
 * @param {Rgb | null} live
 * @param {number} tolerance
 * @param {string} [mode]
 */
export function scoreProbe(probe, buffer, live, tolerance, mode) {
  const resolved = resolvePoint(probe, buffer, mode);
  const expected = hexToRgb(probe.hex);

  const delta = live
    ? Math.max(
        Math.abs(live.r - expected.r),
        Math.abs(live.g - expected.g),
        Math.abs(live.b - expected.b)
      )
    : null;

  const capturedAspect = probe.bw / probe.bh;
  const liveAspect = buffer.width / buffer.height;

  return {
    id: probe.id,
    resolved,
    liveHex: live ? rgbToHex(live) : null,
    delta,
    matches: delta === null ? null : delta <= tolerance,
    resized: probe.bw !== buffer.width || probe.bh !== buffer.height,
    aspectChanged: Math.abs(capturedAspect - liveAspect) > ASPECT_EPSILON,
  };
}

function isUsable(candidate) {
  return (
    candidate &&
    typeof candidate === 'object' &&
    typeof candidate.x === 'number' &&
    typeof candidate.y === 'number' &&
    typeof candidate.bw === 'number' &&
    typeof candidate.bh === 'number' &&
    typeof candidate.hex === 'string'
  );
}

/**
 * @param {unknown} stored
 * @returns {Probe[]}
 */
export function normaliseProbes(stored) {
  if (!Array.isArray(stored)) {
    return [];
  }

  return stored.filter(isUsable).map((probe) => ({
    id: typeof probe.id === 'string' && probe.id ? probe.id : createProbeId(),
    label: typeof probe.label === 'string' ? probe.label : '',
    x: probe.x,
    y: probe.y,
    bw: probe.bw,
    bh: probe.bh,
    hex: probe.hex,
  }));
}
