import { hexToRgb, colorMatches, rgbToHex } from './color.js';
import { DEFAULT_COLOR_TOLERANCE } from './constants.js';
import { readPixel } from './pixel.js';
import { resolvePoint, ScaleMode } from './coords.js';

/**
 * Region matching.
 *
 * One pixel is one sample, and one sample is one animation frame away from
 * lying. A fingerprint reads a whole rectangle in a single `readPixels` and
 * scores a sparse grid of samples inside it: the match survives a particle, a
 * tooltip edge or a frame of animation dirtying a few of them.
 *
 * `pixel.js` is left alone — a step without `samples` is still a pixel step.
 *
 * @typedef {import('./color.js').Rgb} Rgb
 * @typedef {{ dx: number, dy: number, hex: string }} Sample dx/dy in 0..1
 * @typedef {{ x: number, y: number, w: number, h: number, bw?: number, bh?: number, samples: Sample[] }} Fingerprint
 * @typedef {{ listTop: number, pitch: number, bh?: number, slots: number }} Slotting a
 *   party list's geometry: row one's top edge, the gap between rows, and how
 *   many rows the boss seats
 */

/** Samples per axis when capturing. 16 in total; 4 may be wrong by default. */
export const GRID = 4;

/** Share of samples that must match before a fingerprint counts as seen. */
export const DEFAULT_MIN_RATIO = 0.75;

/**
 * Read a rectangle in buffer space (bottom-left origin), in one call.
 *
 * @param {WebGLRenderingContext} gl
 * @param {number} x @param {number} y @param {number} w @param {number} h
 * @returns {{ x: number, y: number, w: number, h: number, data: Uint8Array } | null}
 */
export function readRegion(gl, x, y, w, h) {
  const width = Math.max(1, Math.round(w));
  const height = Math.max(1, Math.round(h));
  const data = new Uint8Array(width * height * 4);

  try {
    gl.readPixels(Math.round(x), Math.round(y), width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
  } catch {
    return null;
  }
  return { x: Math.round(x), y: Math.round(y), w: width, h: height, data };
}

/**
 * The colour at a relative position inside a region.
 *
 * @param {{ w: number, h: number, data: Uint8Array }} region
 * @param {number} dx @param {number} dy in 0..1, from the region's bottom-left
 * @returns {Rgb}
 */
export function sampleRegion(region, dx, dy) {
  const col = Math.min(region.w - 1, Math.max(0, Math.round(dx * (region.w - 1))));
  const row = Math.min(region.h - 1, Math.max(0, Math.round(dy * (region.h - 1))));
  const offset = (row * region.w + col) * 4;
  return { r: region.data[offset], g: region.data[offset + 1], b: region.data[offset + 2] };
}

/** Share of pixels that must move before two readings are a different picture. */
export const DEFAULT_CHANGE_RATIO = 0.02;

/**
 * Did this rectangle change between two readings?
 *
 * Whole pixels rather than the sample grid: one redrawn digit is a few
 * hundred pixels and might not cross a single grid point.
 *
 * @param {{ w: number, h: number, data: Uint8Array } | null} left
 * @param {{ w: number, h: number, data: Uint8Array } | null} right
 * @param {number} tolerance per-channel, as a step's tolerance
 * @param {number} [changeRatio]
 * @returns {boolean}
 */
export function regionsDiffer(left, right, tolerance, changeRatio = DEFAULT_CHANGE_RATIO) {
  if (!left || !right) {
    return true;
  }
  if (left.w !== right.w || left.h !== right.h) {
    return true;
  }

  const pixels = left.w * left.h;
  if (pixels === 0) {
    return false;
  }

  let moved = 0;
  for (let offset = 0; offset < pixels * 4; offset += 4) {
    if (
      Math.abs(left.data[offset] - right.data[offset]) > tolerance ||
      Math.abs(left.data[offset + 1] - right.data[offset + 1]) > tolerance ||
      Math.abs(left.data[offset + 2] - right.data[offset + 2]) > tolerance
    ) {
      moved += 1;
    }
  }

  return moved / pixels > changeRatio;
}

/**
 * The grid of sample colours a region reads down to, split out so a caller
 * that already has its own `readRegion` reading (one that waited for the
 * region to settle, say) never pays for a second `readPixels` just to turn
 * it into a `Fingerprint`.
 *
 * @param {{ x: number, y: number, w: number, h: number, data: Uint8Array }} region
 * @param {{ bw?: number, bh?: number }} rect the buffer size the capture was taken at
 * @returns {Fingerprint}
 */
export function fingerprintFromRegion(region, rect) {
  const samples = [];
  for (let row = 0; row < GRID; row += 1) {
    for (let col = 0; col < GRID; col += 1) {
      // Half-steps keep every sample off the border, which is where a region
      // dragged a pixel too wide picks up whatever sits behind it.
      const dx = (col + 0.5) / GRID;
      const dy = (row + 0.5) / GRID;
      samples.push({ dx, dy, hex: rgbToHex(sampleRegion(region, dx, dy)) });
    }
  }

  return { x: region.x, y: region.y, w: region.w, h: region.h, bw: rect.bw, bh: rect.bh, samples };
}

/**
 * A rectangle, plus the colours of a grid of points inside it.
 *
 * @param {WebGLRenderingContext} gl
 * @param {{ x: number, y: number, w: number, h: number, bw?: number, bh?: number }} rect
 * @returns {Fingerprint | null}
 */
export function captureFingerprint(gl, rect) {
  const region = readRegion(gl, rect.x, rect.y, rect.w, rect.h);
  if (!region) {
    return null;
  }
  return fingerprintFromRegion(region, rect);
}

/**
 * Where a stored fingerprint sits on the live framebuffer.
 *
 * The origin rides the existing `resolvePoint` path, so region steps rescale
 * exactly like pixel steps; only the size needs its own ratio.
 *
 * @param {Fingerprint} fp
 * @param {{ width: number, height: number }} buffer
 * @param {string} [mode]
 */
export function resolveRect(fp, buffer, mode) {
  const origin = resolvePoint(fp, buffer, mode);
  if (!fp.bw || !fp.bh) {
    return { x: origin.x, y: origin.y, w: fp.w, h: fp.h };
  }
  return {
    x: origin.x,
    y: origin.y,
    w: Math.max(1, Math.round((fp.w / fp.bw) * buffer.width)),
    h: Math.max(1, Math.round((fp.h / fp.bh) * buffer.height)),
  };
}

/**
 * Every row of a party list, given the row one point was captured from.
 *
 * The game stacks seats at a fixed pitch and leaves the slack below the last
 * one, so a list is not its own height divided by the seat count. Two numbers
 * describe it exactly: where row one's top edge sits, and how far apart the
 * rows are. From those, the row a capture landed in is arithmetic, and every
 * other row is that same rectangle moved by whole pitches — which keeps a
 * sloppy drag sloppy in the same way on every row rather than drifting.
 *
 * @param {Fingerprint} fp
 * @param {{ width: number, height: number }} buffer
 * @param {string} [mode]
 * @param {Slotting | null} [slotting]
 * @returns {Array<{ x: number, y: number, w: number, h: number }>}
 */
export function resolveSlotRects(fp, buffer, mode, slotting) {
  const base = resolveRect(fp, buffer, mode);
  const slots = Math.max(1, Math.round((slotting && slotting.slots) || 1));
  if (!slotting || slots < 2 || !slotting.pitch) {
    return [base];
  }

  // The pitch was measured on the framebuffer the screen was calibrated on,
  // so it rescales exactly as the rectangle above it did.
  const scale =
    mode === ScaleMode.ABSOLUTE || !slotting.bh ? 1 : buffer.height / slotting.bh;
  const pitch = slotting.pitch * scale;
  if (pitch <= 0) {
    return [base];
  }
  const listTop = slotting.listTop * scale;

  const captured = Math.min(
    slots - 1,
    Math.max(0, Math.round((listTop - (base.y + base.h)) / pitch))
  );

  const rects = [];
  for (let index = 0; index < slots; index += 1) {
    rects.push({
      x: base.x,
      y: Math.round(base.y + (captured - index) * pitch),
      w: base.w,
      h: base.h,
    });
  }
  return rects;
}

/**
 * Score a fingerprint against what is on screen now.
 *
 * @param {WebGLRenderingContext} gl
 * @param {Fingerprint} fp
 * @param {{ width: number, height: number }} buffer
 * @param {string} [mode]
 * @param {number} [tolerance]
 * @param {number} [minRatio]
 * @returns {{ matched: boolean, ratio: number }}
 */
export function matchFingerprint(
  gl,
  fp,
  buffer,
  mode,
  tolerance = DEFAULT_COLOR_TOLERANCE,
  minRatio = DEFAULT_MIN_RATIO
) {
  const samples = fp.samples || [];
  if (samples.length === 0) {
    return { matched: false, ratio: 0 };
  }

  return scoreRect(gl, samples, resolveRect(fp, buffer, mode), tolerance, minRatio);
}

/**
 * Score a sample grid against one rectangle on the live framebuffer.
 *
 * Split out from `matchFingerprint` because a slotted point scores the same
 * grid against several rectangles, and resolving the fingerprint once per
 * rectangle would undo the point of knowing where the rows are.
 *
 * @returns {{ matched: boolean, ratio: number }}
 */
export function scoreRect(
  gl,
  samples,
  rect,
  tolerance = DEFAULT_COLOR_TOLERANCE,
  minRatio = DEFAULT_MIN_RATIO
) {
  const region = readRegion(gl, rect.x, rect.y, rect.w, rect.h);
  if (!region) {
    return { matched: false, ratio: 0 };
  }

  let hits = 0;
  for (const sample of samples) {
    const actual = sampleRegion(region, sample.dx, sample.dy);
    if (colorMatches(actual, hexToRgb(sample.hex), tolerance)) {
      hits += 1;
    }
  }

  const ratio = hits / samples.length;
  return { matched: ratio >= minRatio, ratio };
}

/** True when a stored point is a region rather than a single pixel. */
export function isRegionPoint(point) {
  return Array.isArray(point.samples) && point.samples.length > 0;
}

/**
 * Match one of a step's points, whichever kind it is.
 *
 * This is the whole of the engine's change: a point with `samples` is scored
 * as a region, a point without is read as a pixel, exactly as before.
 *
 * @param {WebGLRenderingContext} gl
 * @param {object} point stored point
 * @param {string} hex expected colour, for pixel points
 * @param {{ width: number, height: number }} buffer
 * @param {string} mode
 * @param {number} tolerance
 * @param {number} [minRatio]
 * @returns {{ matched: boolean, point: { x: number, y: number }, ratio: number,
 *   drift?: number, seen?: string }} `drift` is how far the worst channel was
 *   from the stored colour, which is what a near miss needs to say out loud
 */
export function matchPoint(gl, point, hex, buffer, mode, tolerance, minRatio, slotting) {
  if (isRegionPoint(point)) {
    const rects = point.perSlot
      ? resolveSlotRects(point, buffer, mode, slotting)
      : [resolveRect(point, buffer, mode)];

    let best = { matched: false, ratio: 0 };
    let bestRect = rects[0];
    for (const rect of rects) {
      const result = scoreRect(gl, point.samples, rect, tolerance, minRatio);
      if (result.matched) {
        best = result;
        bestRect = rect;
        break;
      }
      if (result.ratio > best.ratio) {
        best = result;
        bestRect = rect;
      }
    }

    return {
      matched: best.matched,
      ratio: best.ratio,
      // The click lands in the middle of the region, not on its corner — and
      // on a slotted point, in the middle of the row that actually matched.
      point: {
        x: bestRect.x + Math.round(bestRect.w / 2),
        y: bestRect.y + Math.round(bestRect.h / 2),
      },
    };
  }

  const resolved = resolvePoint(point, buffer, mode);
  const pixel = readPixel(gl, resolved.x, resolved.y);
  if (!pixel) {
    return { matched: false, ratio: 0, point: resolved };
  }
  const expected = hexToRgb(hex);
  const matched = colorMatches(pixel, expected, tolerance);
  const drift = Math.max(
    Math.abs(pixel.r - expected.r),
    Math.abs(pixel.g - expected.g),
    Math.abs(pixel.b - expected.b)
  );
  return { matched, ratio: matched ? 1 : 0, point: resolved, drift, seen: rgbToHex(pixel) };
}
