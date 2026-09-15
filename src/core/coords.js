/**
 * Coordinate handling.
 *
 * Two spaces are in play:
 *
 * - **client space** — CSS pixels, origin top-left. What mouse events use.
 * - **buffer space** — WebGL framebuffer pixels, origin **bottom-left**.
 *   What `gl.readPixels` uses. This is why every conversion flips Y.
 *
 * Steps are stored in buffer space together with the buffer size they were
 * captured at (`bw`/`bh`). That extra pair is what makes a step portable:
 * upstream stored bare pixels, which only worked because macOS pinned the
 * canvas to a fixed minimum size. On Windows the framebuffer tracks the
 * window and device pixel ratio, so a bare pixel points somewhere else the
 * moment either changes.
 */

/**
 * @typedef {{ width: number, height: number }} BufferSize
 * @typedef {{ x: number, y: number, bw?: number, bh?: number }} StoredPoint
 * @typedef {{ x: number, y: number }} Point
 */

/**
 * How a stored point maps onto the live framebuffer.
 *
 * `SCALE` is correct when the game stretches to fill the canvas. If the game
 * turns out to letterbox, or to anchor UI to screen edges, that becomes a new
 * mode here — stored steps keep working, because `bw`/`bh` records enough to
 * re-derive the position under any model.
 */
export const ScaleMode = Object.freeze({
  ABSOLUTE: 'absolute',
  SCALE: 'scale',
});

/** @param {HTMLCanvasElement} canvas @returns {BufferSize} */
export function getBufferSize(canvas) {
  return { width: canvas.width, height: canvas.height };
}

/**
 * Map a stored point onto the current framebuffer.
 *
 * @param {StoredPoint} point
 * @param {BufferSize} buffer
 * @param {string} [mode]
 * @returns {Point}
 */
export function resolvePoint(point, buffer, mode = ScaleMode.SCALE) {
  // A point with no capture size predates this scheme; scaling it would be a
  // guess, so it is used as-is and the UI flags it for re-capture.
  if (mode === ScaleMode.ABSOLUTE || !point.bw || !point.bh) {
    return { x: point.x, y: point.y };
  }

  return {
    x: Math.round((point.x / point.bw) * buffer.width),
    y: Math.round((point.y / point.bh) * buffer.height),
  };
}

/** True when the point cannot be scaled and should be re-captured. */
export function isLegacyPoint(point) {
  return !point.bw || !point.bh;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} clientX
 * @param {number} clientY
 * @returns {Point} buffer-space, bottom-left origin
 */
export function clientToBuffer(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const relX = (clientX - rect.left) / rect.width;
  const relY = (rect.bottom - clientY) / rect.height; // flip to bottom-left
  return {
    x: Math.round(relX * canvas.width),
    y: Math.round(relY * canvas.height),
  };
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} bufferX
 * @param {number} bufferY
 * @param {DOMRect} [knownRect] the canvas box, when the caller already has it —
 *   one marker layer asking per marker is one forced layout per marker
 * @returns {{ clientX: number, clientY: number }}
 */
export function bufferToClient(canvas, bufferX, bufferY, knownRect) {
  const rect = knownRect || canvas.getBoundingClientRect();
  return {
    clientX: rect.left + (bufferX / canvas.width) * rect.width,
    clientY: rect.bottom - (bufferY / canvas.height) * rect.height,
  };
}

/** @returns {boolean} whether a client point lies inside the canvas. */
export function isInsideCanvas(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}
