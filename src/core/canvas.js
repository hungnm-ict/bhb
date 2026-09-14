/**
 * Canvas discovery and WebGL context access.
 *
 * `installCanvasPatch` MUST run before the game creates its context — the
 * userscript is `@run-at document-start` for exactly this reason. Once Unity
 * has a context without `preserveDrawingBuffer`, the back buffer is cleared
 * after every frame and `readPixels` returns black.
 */

/** @type {HTMLCanvasElement | null} */
let cachedCanvas = null;
/** @type {WebGLRenderingContext | WebGL2RenderingContext | null} */
let cachedContext = null;

const WEBGL_TYPES = ['webgl', 'webgl2', 'experimental-webgl'];

/** Force `preserveDrawingBuffer` on every WebGL context the page creates. */
export function installCanvasPatch() {
  const original = HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.getContext = function (type, attributes) {
    if (WEBGL_TYPES.includes(type)) {
      attributes = { ...(attributes || {}), preserveDrawingBuffer: true };
    }
    return original.call(this, type, attributes);
  };
}

/** @returns {HTMLCanvasElement | null} the game canvas, if the page has one. */
export function getCanvas() {
  return (
    document.querySelector('#unity-canvas') || document.querySelector('canvas')
  );
}

/**
 * @param {HTMLCanvasElement | null} canvas
 * @returns {WebGLRenderingContext | WebGL2RenderingContext | null}
 */
export function getGl(canvas) {
  if (!canvas) {
    return null;
  }
  if (cachedCanvas === canvas && cachedContext) {
    return cachedContext;
  }

  let context = null;
  try {
    for (const type of ['webgl2', 'webgl', 'experimental-webgl']) {
      context = canvas.getContext(type, { preserveDrawingBuffer: true });
      if (context) {
        break;
      }
    }
  } catch {
    context = null;
  }

  cachedCanvas = canvas;
  cachedContext = context;
  return context;
}

/**
 * Canvas plus context in one call, since every caller needs both.
 * @returns {{ canvas: HTMLCanvasElement, gl: WebGLRenderingContext } | null}
 */
export function getRenderTarget() {
  const canvas = getCanvas();
  if (!canvas) {
    return null;
  }
  const gl = getGl(canvas);
  if (!gl) {
    return null;
  }
  return { canvas, gl };
}
