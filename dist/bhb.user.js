// ==UserScript==
// @name         BHB
// @namespace    https://github.com/hungnm-ict/bhb
// @version      0.15.2
// @description  Automation userscript for a casual Gacha + Pokemon-catching + Fashion game
// @author       hungnm-ict
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAJu0lEQVR4nO2bXYxkVRHHf1Xn3u6ez53umWUWZmbBEINCWDUSEkxEkEBMMGIImGCMLxp9w8QH8cGP+AbBxBcT34wfwWzwQaJC0ATfRFGjIu4aDB9hd9ld2PnY6emZnul77ykf7u3e7p7umbnN9swmbiW92emue+pfdc+pqlN1jtCfHJAAzM7OjsVx4R4Tux/jdsSOglR2eHa/yYCqwdsCfzd41kf6u9XVUyvZ7y1dukn6DOiA5NCh66dcmDyKyBcE3p+yG2Z2+VW4DCRySR0zOwXytBg/WFo6fRZQUkN1gO82gGQfXzk89zAm3xfVo5hhqda+jaef8Q6KmoqlGEVURfDelsT49tLS6R9lv0sbb4cSl5SfmX9cRB/L3nZMaj29/Jib4ocyowxIQAIRwZv/ycri5FfhZIM2IzQRCOm0jyvTc78Q5x4x74eoOAiC4TEzVAIMPwwxkBlCVAPz/g8TY+7+t956KyKdKdZUToG4MjP3RKZ8BAQMUfnYbyESELgSsa8jw1tRAgTmfaSqn1yrxT8mdYhK9o8Dkkpl7kER94025YeGJ7GYkcIMD93xaz7/8ReYGrsxNchw3UrovY9E3SOVmbmvkRrBKeArlcqkCT/M3LtjiA5ORImTDa6Z+jDz08eYPXQDC9N3EicbiAxlwrVTYOYTkMfL5WuPAj4NDVp6VJ271rDW1BguCWYxUeyJEo+3pl/aB8FgIlpC9TuA6fz8/AjIl8ybsS/Kt8MREBlODOhPzswbwuempxeu09qmv0fQG2A/DWCoFghUcCIEWmRIobAXCeBVdMLEPxSIyWdRYaD0zqz3zDXSt9vzEY/TIourJ1iuvU0pnODcyl9xWsLbDqFwAFm7kBnygJSn519WlWNm5tnjDDDziCiqromgGxFmHu+TDsdm5lEXICixrzNWPILTAtWNUwRuBPAkSZKOlik1qKzdVADEsGWpzMwtg5R7jN6DBLOEUmmcyfIsKg7rMXWbadba6gU21ldbOfqh8hFKI+OYGSKK9xFGOiNSRYXGVp2Ly+cwS5OkUmksh6yLuSNJkCnfHGsXSoFPlmcJw1Jq9T6PqQiTU7Nsba4Txw3GJiqMT0yTJFHLIEFQSkfNDALG6NgUUbRF9eI7qAa5ZaUJ7N6XRM6Ex1ANsrfnW9/15DRDRFDnsMhwLiRdZdbB0z2+mce5EABVzSdLHUkS53IJ+xj28vjY/QuM+xv3r0C6aoCDBnDQdNUABw3goCmnAaQVymSXWNP83bxHkCxT2z0+pWEvLeCmYTKHrJ1S6T6U2wDeJ6ytLrZA9iMzY231AnEcoc5RX69S36juIlLZ2qyxUVtBxQ0gq7EnI3doVJmZzx10m8mKuoDeMVswn2SAtAVSVAkKxa66bNtTAnGjgU+SjreaV1YeGqj0JaLEcQOLtvrzQAY6+9spvh6xuVKjf6pqaDFEx4rgbWBZeWjg2t/4RCVNb3tuUNKlsrG+ivcJ6pRko8HorfNM3nVTn0TPwCm1l96k9ufX0ZFCVqLIJyvvEshtADPPVOU6xicqmdPpLVBEKJbGWF56G19Plb/x518mmBrFfI+9fbYXtTjhza/8jOoL/0HHChyaOrJ3WYun86qzkwFk+5qyBHUhxZFxkiRmt5y9UBwjKBTZXF5n8q6bcOVRGudXkcD15LfYE14zwaH7bmH1+X+jQZBPVlAkjhqIdo1vvufsgT4GkKx0Hcf1TmYtEOpoVp3Zy1Sz5oBZe8KQwCFuB2flLf20mkZ7l9XEnUS1LtxFnBZ6GmGbAZpNi5HCDLOH78RnzkhVWFp7lfWt88ig+dNe9BiwONzEXQrLHCkf68L9X9bqZwjcyLZcYZsBDE/gSjxw+3Hmp28lyuoLTmGldo5f/ulTeGsQyMgV1CWWS7hvO87CzLEO3Bdr5zn+x3upNxZRCWlfTkGvgVQcpbCCU/AuCzMCpbDcdyodJAngMURchrELd6GM0zDLRVrBBdhmgLRRGcU1nvnLQyzM3EGSTSWnwvmVl6nWTzNWvvkKevtgHbgf5ujhj3Xh/hfV+mlCN7qHJWCeQEtcXH+DC9UTHQ3sQAsUw4lWpTYnyr0XegawbTvuxbWTXbiLhD3WP/SJAoYRaInQjXR9n4UTabr1/khT5y0tFBJoFuf7b1gs9mm1PtCuIwx7kaUpblekEIxu06ffRqlvHpD27rd/731MtFVndGwKs4R+3QoRZWtznSTaQksBay+9zjXR3YSHJ3o3OZoRs+BYe/E1JFB8EhM19i4rjhspRtt589ROuTdDZoaqY3yismP+bd5Tqy2TxFErFZ68+wMcuu+WVp7fpQcSKGsvvsbF376MFEMwj0g+WfuyGwR23aICWTenKUnw61tYlOwY68UpOl7qcNW5ZeWggTZD6RY12NERmhnex5d4zJCxAkGwk0jBJxH4S3n/QLJyUE4DvLfW2NTUpdZYz9F7tsbyyBqoNZaHLm9rrNf4/1etsV7jX22N5eZ9b3S1LH7QAA6arhrgoAEcNF01QD72y90a237qft9bY4ZVs//vIfZcvtaYNOs4lrTVGA+gNVaemTuhojfnPSbnXLjjBsSbJ2lvV2VbYBcUEFGSZIvAlRAJaMRrBC7dAMVxo5XYDCxrDyqQHpOrBgL/AD5IjuwjnaZxVq/fma/tDwCSKMJbRCks85nbjjMSTvLMXx5hZf0NAlfMWKVjjNyydieT9BbFK2robxjoCowgsvOn51PqiP0Ws+WPsjDzIWbL72Ph8CdIfB2Vfpn5YLJ2oHQ6Ks8qSfi89/589oqGdm2jm7xF6Wnx2ON9xy2WYZMBaj6px+jTurLyxqoIT4nsrwGAgzotnoiomMhz1QunX1dAAo2eNPOrpE5wH4xgqIS4/T8tnjo/855EvguIAvruu+++Y2aPiajS54LhZUOQla+X1k5ysXaW9a0q51b+htPSfjRcYlF1Bk+srJw+Qdo3AbJ7Q+WZ+Z+q6heze0PhsFCkfbxNRouz6Wnx+ilCHRm2ASIRDb35F1YWz9xLNtvbr80p3OwqM9XnRfXutstTQ7nLIqIkvgFmOFccKIvbIxkQi2ho5k/EDe6sVs+s0Lw40cbk4WQ0WuJ+88lTIhpmTLs35wdBZR4nYdprHI7y2cVJENXQm/99YzO5q1o9s0yzncj2t9uKReWZha8LfE9Uxi0tSfk2nivt2myT2ltIKqKY+VjgyaXFM98i1aHD0fdSpHWFdvLwwo2B999E9EERKtDriPuVRWk0F8z8GsJzCf7x1Qtn/0nbkYsO/h3Gal05n5o6cr0G7gFDPi3wEWB6l2cPggxYxXhFVJ7DJ79aWjr7avZb3+vz/wMKZXY7ePMQhQAAAABJRU5ErkJggg==
// @match        *://*.kongregate.com/*
// @match        *://*.bitheroesgame.com/*
// @run-at       document-start
// @grant        none
// @updateURL    https://raw.githubusercontent.com/hungnm-ict/bhb/master/dist/bhb.user.js
// @downloadURL  https://raw.githubusercontent.com/hungnm-ict/bhb/master/dist/bhb.user.js
// ==/UserScript==

(() => {
  // src/core/constants.js
  var VERSION = true ? "0.15.2" : "dev";
  var STORAGE_KEY_PROFILES = "bhb.profiles.v2";
  var STORAGE_KEY_SETTINGS = "bhb.settings.v2";
  var STORAGE_KEY_RESUME = "bhb.resume.v1";
  var STORAGE_KEY_STATS = "bhb.stats.v1";
  var STORAGE_KEY_LEGACY_RULES = "bh_script_rules_v1";
  var DEFAULT_COLOR_TOLERANCE = 15;
  var INTERVAL_SCRIPT = 3e3;
  var INTERVAL_AUTO_STOP_CHECK = 5e3;
  var INTERVAL_RUN_ALL = 1500;
  var SCRIPT_PACE_LADDER = Object.freeze([300, 600, 1200, 2e3, 3e3]);
  var IDLE_ADVANCE_TICKS = 8;
  var RESYNC_AFTER_MS = 9e3;
  var AUTO_STOP_TIMEOUT = 3 * 60 * 1e3;
  var RESUME_MAX_AGE = 15 * 60 * 1e3;
  var RESUME_DELAY = 45 * 1e3;
  var MAX_RELOADS = 3;
  var CLICK_LOCKOUT_MS = 200;
  var CLICK_HOVER_RESET_MS = 100;
  var HOVER_RESET_POINT = { x: 5, y: 5 };
  var SPEED_STEPS = [0.1, 0.25, 0.5, 0.75, 1, 2, 3, 4, 5, 7, 10, 15, 20];
  var DRY_RUN_STEP_MS = 700;
  var NOTIFY_COOLDOWN_MS = 60 * 1e3;
  var NOTIFY_SHOT_QUALITY = 0.7;
  var Z_TOP = "2147483647";

  // src/core/keys.js
  var Keys = Object.freeze({
    PANEL: "`",
    CLOSE_PANEL: "Escape",
    RUN: "r",
    CAPTURE: "x",
    SPEED_RESET: "0",
    SPEED_UP: "=",
    SPEED_UP_ALT: "+",
    SPEED_DOWN: "-"
  });
  function keyLabel(key) {
    return key.length === 1 ? key.toUpperCase() : key;
  }

  // src/core/canvas.js
  var cachedCanvas = null;
  var cachedContext = null;
  var WEBGL_TYPES = ["webgl", "webgl2", "experimental-webgl"];
  function installCanvasPatch() {
    const original2 = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, attributes) {
      if (WEBGL_TYPES.includes(type)) {
        attributes = { ...attributes || {}, preserveDrawingBuffer: true };
      }
      return original2.call(this, type, attributes);
    };
  }
  function getCanvas() {
    return document.querySelector("#unity-canvas") || document.querySelector("canvas");
  }
  function getGl(canvas) {
    if (!canvas) {
      return null;
    }
    if (cachedCanvas === canvas && cachedContext) {
      return cachedContext;
    }
    let context = null;
    try {
      for (const type of ["webgl2", "webgl", "experimental-webgl"]) {
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
  function getRenderTarget() {
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

  // src/core/focus.js
  var SUPPRESSED_EVENTS = [
    "visibilitychange",
    "webkitvisibilitychange",
    "blur",
    "focusout",
    "pagehide"
  ];
  function defineAlways(target, property, value) {
    try {
      Object.defineProperty(target, property, {
        get: () => value,
        configurable: true
      });
    } catch {
    }
  }
  function installFocusPatch() {
    try {
      Object.defineProperty(document, "hasFocus", {
        value: () => true,
        configurable: true,
        writable: true
      });
    } catch {
    }
    defineAlways(document, "hidden", false);
    defineAlways(document, "visibilityState", "visible");
    for (const type of SUPPRESSED_EVENTS) {
      const swallow = (event) => {
        event.stopImmediatePropagation();
        event.preventDefault();
      };
      window.addEventListener(type, swallow, true);
      document.addEventListener(type, swallow, true);
    }
  }

  // src/core/timers.js
  var realNow = Date.now.bind(Date);
  var realPerformanceNow = performance.now.bind(performance);
  var realSetTimeout = window.setTimeout.bind(window);
  var realClearTimeout = window.clearTimeout.bind(window);
  var realSetInterval = window.setInterval.bind(window);
  var realClearInterval = window.clearInterval.bind(window);
  var realRequestAnimationFrame = window.requestAnimationFrame.bind(window);

  // src/core/speed.js
  var STALL_MS = 250;
  var driveStalledFrame = () => false;
  function pumpFrame() {
    return driveStalledFrame();
  }
  var speed = 1;
  var listeners = [];
  function getSpeed() {
    return speed;
  }
  function setSpeed(next) {
    const snapped = snapSpeed(next);
    if (snapped === speed) {
      return;
    }
    speed = snapped;
    for (const listener of listeners) {
      listener(speed);
    }
  }
  function snapSpeed(value) {
    return SPEED_STEPS.reduce(
      (best, stop) => Math.abs(stop - value) < Math.abs(best - value) ? stop : best
    );
  }
  function stepSpeed(current, direction) {
    const index = speedIndex(current) + direction;
    return SPEED_STEPS[Math.max(0, Math.min(SPEED_STEPS.length - 1, index))];
  }
  function speedIndex(value) {
    return SPEED_STEPS.indexOf(snapSpeed(value));
  }
  function formatSpeed(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  function onSpeedChange(listener) {
    listeners.push(listener);
  }
  function createVirtualClock(readReal) {
    let virtual = null;
    let previous = null;
    return function read2() {
      const real = readReal();
      if (virtual === null) {
        virtual = real;
        previous = real;
        return virtual;
      }
      virtual += (real - previous) * speed;
      previous = real;
      return virtual;
    };
  }
  function installSpeedHack() {
    const virtualDateNow = createVirtualClock(realNow);
    const virtualPerformanceNow = createVirtualClock(realPerformanceNow);
    Date.now = () => Math.floor(virtualDateNow());
    performance.now = () => virtualPerformanceNow();
    window.setTimeout = (handler, delay = 0, ...args) => realSetTimeout(handler, delay / speed, ...args);
    window.setInterval = (handler, delay = 0, ...args) => realSetInterval(handler, delay / speed, ...args);
    installFrameMultiplier();
  }
  function installFrameMultiplier() {
    const FRAME_BUDGET_MS = 15;
    let pending = null;
    let bursting = false;
    let owed = 0;
    let waiting = null;
    let lastFrameAt = realPerformanceNow();
    let frameSeq = 0;
    let drivenUpTo = 0;
    window.requestAnimationFrame = function(callback) {
      if (bursting) {
        pending = callback;
        return 1;
      }
      const id = frameSeq += 1;
      waiting = { id, callback };
      return realRequestAnimationFrame(() => {
        if (id <= drivenUpTo) {
          return;
        }
        lastFrameAt = realPerformanceNow();
        waiting = null;
        runBurst(callback);
      });
    };
    driveStalledFrame = function() {
      if (!waiting || bursting) {
        return false;
      }
      if (realPerformanceNow() - lastFrameAt < STALL_MS) {
        return false;
      }
      const { id, callback } = waiting;
      waiting = null;
      drivenUpTo = id;
      lastFrameAt = realPerformanceNow();
      runBurst(callback);
      return true;
    };
    function runBurst(callback) {
      if (speed <= 1) {
        owed = 0;
        callback(performance.now());
        return;
      }
      owed += speed;
      const startedAt = realPerformanceNow();
      pending = null;
      bursting = true;
      try {
        while (owed >= 1) {
          const next = pending;
          pending = null;
          const current = next || callback;
          try {
            current(performance.now());
          } catch (error) {
            console.error("[BHB] frame callback threw", error);
          }
          owed -= 1;
          if (!pending) {
            break;
          }
          if (realPerformanceNow() - startedAt > FRAME_BUDGET_MS) {
            owed = 0;
            break;
          }
        }
      } finally {
        bursting = false;
      }
      if (pending) {
        const next = pending;
        pending = null;
        realRequestAnimationFrame(() => runBurst(next));
      }
    }
  }

  // src/core/keepalive.js
  var BUFFER_SIZE = 4096;
  var FALLBACK_MS = 100;
  function installKeepAlive(tick) {
    realSetInterval(tick, FALLBACK_MS);
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return { audio: false };
    }
    try {
      const context = new AudioContextClass();
      const processor = context.createScriptProcessor(BUFFER_SIZE, 1, 1);
      const silence = context.createGain();
      silence.gain.value = 0;
      processor.onaudioprocess = () => tick();
      processor.connect(silence);
      silence.connect(context.destination);
      if (context.state === "suspended") {
        const resume = () => context.resume().catch(() => {
        });
        for (const type of ["pointerdown", "keydown"]) {
          window.addEventListener(type, resume, { once: true, capture: true });
        }
      }
      return { audio: true };
    } catch (error) {
      console.warn("[BHB] could not start the audio clock", error);
      return { audio: false };
    }
  }

  // src/core/color.js
  function toHexByte(value) {
    return value.toString(16).padStart(2, "0");
  }
  function rgbToHex(rgb) {
    return "#" + toHexByte(rgb.r) + toHexByte(rgb.g) + toHexByte(rgb.b);
  }
  function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16)
    };
  }
  function colorMatches(actual, expected, tolerance) {
    return Math.abs(actual.r - expected.r) <= tolerance && Math.abs(actual.g - expected.g) <= tolerance && Math.abs(actual.b - expected.b) <= tolerance;
  }

  // src/core/pixel.js
  function readPixel(gl, x, y) {
    const data = new Uint8Array(4);
    try {
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
    } catch {
      return null;
    }
    return { r: data[0], g: data[1], b: data[2] };
  }

  // src/core/coords.js
  var ScaleMode = Object.freeze({
    ABSOLUTE: "absolute",
    SCALE: "scale"
  });
  function getBufferSize(canvas) {
    return { width: canvas.width, height: canvas.height };
  }
  function resolvePoint(point, buffer, mode = ScaleMode.SCALE) {
    if (mode === ScaleMode.ABSOLUTE || !point.bw || !point.bh) {
      return { x: point.x, y: point.y };
    }
    return {
      x: Math.round(point.x / point.bw * buffer.width),
      y: Math.round(point.y / point.bh * buffer.height)
    };
  }
  function isLegacyPoint(point) {
    return !point.bw || !point.bh;
  }
  function clientToBuffer(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const relX = (clientX - rect.left) / rect.width;
    const relY = (rect.bottom - clientY) / rect.height;
    return {
      x: Math.round(relX * canvas.width),
      y: Math.round(relY * canvas.height)
    };
  }
  function bufferToClient(canvas, bufferX, bufferY, knownRect) {
    const rect = knownRect || canvas.getBoundingClientRect();
    return {
      clientX: rect.left + bufferX / canvas.width * rect.width,
      clientY: rect.bottom - bufferY / canvas.height * rect.height
    };
  }
  function isInsideCanvas(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }

  // src/core/region.js
  var GRID = 4;
  var DEFAULT_MIN_RATIO = 0.75;
  function readRegion(gl, x, y, w, h) {
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
  function sampleRegion(region, dx, dy) {
    const col = Math.min(region.w - 1, Math.max(0, Math.round(dx * (region.w - 1))));
    const row = Math.min(region.h - 1, Math.max(0, Math.round(dy * (region.h - 1))));
    const offset = (row * region.w + col) * 4;
    return { r: region.data[offset], g: region.data[offset + 1], b: region.data[offset + 2] };
  }
  function captureFingerprint(gl, rect) {
    const region = readRegion(gl, rect.x, rect.y, rect.w, rect.h);
    if (!region) {
      return null;
    }
    const samples = [];
    for (let row = 0; row < GRID; row += 1) {
      for (let col = 0; col < GRID; col += 1) {
        const dx = (col + 0.5) / GRID;
        const dy = (row + 0.5) / GRID;
        samples.push({ dx, dy, hex: rgbToHex(sampleRegion(region, dx, dy)) });
      }
    }
    return { x: region.x, y: region.y, w: region.w, h: region.h, bw: rect.bw, bh: rect.bh, samples };
  }
  function resolveRect(fp, buffer, mode) {
    const origin = resolvePoint(fp, buffer, mode);
    if (!fp.bw || !fp.bh) {
      return { x: origin.x, y: origin.y, w: fp.w, h: fp.h };
    }
    return {
      x: origin.x,
      y: origin.y,
      w: Math.max(1, Math.round(fp.w / fp.bw * buffer.width)),
      h: Math.max(1, Math.round(fp.h / fp.bh * buffer.height))
    };
  }
  function matchFingerprint(gl, fp, buffer, mode, tolerance = DEFAULT_COLOR_TOLERANCE, minRatio = DEFAULT_MIN_RATIO) {
    const samples = fp.samples || [];
    if (samples.length === 0) {
      return { matched: false, ratio: 0 };
    }
    const rect = resolveRect(fp, buffer, mode);
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
  function isRegionPoint(point) {
    return Array.isArray(point.samples) && point.samples.length > 0;
  }
  function matchPoint(gl, point, hex, buffer, mode, tolerance, minRatio) {
    if (isRegionPoint(point)) {
      const rect = resolveRect(point, buffer, mode);
      const result = matchFingerprint(gl, point, buffer, mode, tolerance, minRatio);
      return {
        matched: result.matched,
        ratio: result.ratio,
        // The click lands in the middle of the region, not on its corner.
        point: { x: rect.x + Math.round(rect.w / 2), y: rect.y + Math.round(rect.h / 2) }
      };
    }
    const resolved = resolvePoint(point, buffer, mode);
    const pixel = readPixel(gl, resolved.x, resolved.y);
    if (!pixel) {
      return { matched: false, ratio: 0, point: resolved };
    }
    const matched = colorMatches(pixel, hexToRgb(hex), tolerance);
    return { matched, ratio: matched ? 1 : 0, point: resolved };
  }

  // src/core/input.js
  var locked = false;
  var clickObserver = null;
  function setClickObserver(observer) {
    clickObserver = observer;
  }
  function pointerInit(x, y, buttons) {
    return {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: x,
      clientY: y,
      screenX: window.screenX + x,
      screenY: window.screenY + y,
      button: 0,
      buttons,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      pressure: buttons ? 0.5 : 0,
      width: 1,
      height: 1
    };
  }
  function mouseInit(x, y, buttons) {
    return {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: x,
      clientY: y,
      screenX: window.screenX + x,
      screenY: window.screenY + y,
      button: 0,
      buttons,
      detail: 1
    };
  }
  var CLICK_SEQUENCE = [
    ["pointerover", "pointer", 0],
    ["pointerenter", "pointer", 0],
    ["pointermove", "pointer", 0],
    ["mouseover", "mouse", 0],
    ["mousemove", "mouse", 0],
    ["pointerdown", "pointer", 1],
    ["mousedown", "mouse", 1],
    ["pointerup", "pointer", 0],
    ["mouseup", "mouse", 0],
    ["click", "mouse", 0],
    ["pointerout", "pointer", 0],
    ["pointerleave", "pointer", 0],
    ["mouseout", "mouse", 0],
    ["mouseleave", "mouse", 0]
  ];
  function dispatchClickAt(canvas, clientX, clientY) {
    dispatchSequence(canvas, CLICK_SEQUENCE, clientX, clientY);
  }
  function dispatchSequence(canvas, sequence, clientX, clientY) {
    const targets = [canvas, document, window];
    for (const [type, family, buttons] of sequence) {
      const Ctor = family === "pointer" ? PointerEvent : MouseEvent;
      const init = family === "pointer" ? pointerInit(clientX, clientY, buttons) : mouseInit(clientX, clientY, buttons);
      for (const target of targets) {
        try {
          target.dispatchEvent(new Ctor(type, init));
        } catch {
        }
      }
    }
  }
  var MOVE_SEQUENCE = [
    ["pointerover", "pointer", 0],
    ["pointerenter", "pointer", 0],
    ["pointermove", "pointer", 0],
    ["mouseover", "mouse", 0],
    ["mousemove", "mouse", 0]
  ];
  function dispatchMoveTo(canvas, clientX, clientY) {
    dispatchSequence(canvas, MOVE_SEQUENCE, clientX, clientY);
  }
  function resetHover(canvas) {
    const pos = bufferToClient(canvas, HOVER_RESET_POINT.x, HOVER_RESET_POINT.y);
    dispatchMoveTo(canvas, pos.clientX, pos.clientY);
  }
  function clickBufferPoint(canvas, point) {
    if (locked) {
      return false;
    }
    const pos = bufferToClient(canvas, point.x, point.y);
    if (!isInsideCanvas(canvas, pos.clientX, pos.clientY)) {
      return false;
    }
    locked = true;
    dispatchClickAt(canvas, pos.clientX, pos.clientY);
    clickObserver?.(pos.clientX, pos.clientY);
    realSetTimeout(() => resetHover(canvas), CLICK_HOVER_RESET_MS);
    realSetTimeout(() => {
      locked = false;
    }, CLICK_LOCKOUT_MS);
    return true;
  }

  // src/bot/step.js
  var StepKind = Object.freeze({
    CLICK: "click",
    WAIT: "wait"
  });
  function createStepId() {
    return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }
  function createStep(overrides = {}) {
    return {
      id: createStepId(),
      label: "",
      points: [],
      hex: null,
      tolerance: DEFAULT_COLOR_TOLERANCE,
      enabled: true,
      screens: [],
      activity: null,
      /**
       * Seconds to sit still after this step clicks.
       *
       * A dungeon run takes a minute; polling three times a second through it
       * reads the same frame over and over. This is what the hard-coded Re-run
       * mode used to do after clicking, kept as a property of the step that
       * starts the fight rather than a mode of its own.
       */
      restSec: 0,
      kind: StepKind.CLICK,
      /**
       * For a wait step: how many of its points may still match before it lets
       * the sequence through. Waiting on four empty party slots with this at 2
       * is "wait until three players are here", whichever seats they took.
       */
      maxMatches: 0,
      /** Skip instead of waiting when it does not match — a box already ticked. */
      optional: false,
      ...overrides
    };
  }
  function isStepReady(step) {
    if (!step.enabled || step.points.length === 0) {
      return false;
    }
    return Boolean(step.hex) || step.points.every(isRegionPoint);
  }
  function colorForPoint(step, point) {
    return point.hex || step.hex;
  }
  function pointsByPlace(step) {
    const places = /* @__PURE__ */ new Map();
    for (const point of step.points) {
      const key = `${point.x},${point.y},${point.bw || 0},${point.bh || 0}`;
      const group = places.get(key);
      if (group) {
        group.push(point);
      } else {
        places.set(key, [point]);
      }
    }
    return [...places.values()];
  }

  // src/bot/screen.js
  function createScreenId() {
    return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }
  function createScreen(overrides = {}) {
    return {
      id: createScreenId(),
      name: "",
      anchors: [],
      minRatio: DEFAULT_MIN_RATIO,
      tolerance: DEFAULT_COLOR_TOLERANCE,
      stopsTask: false,
      notify: false,
      ...overrides
    };
  }
  function isScreenReady(screen) {
    return Boolean(screen && screen.anchors && screen.anchors.length > 0);
  }
  function scoreScreen(gl, screen, buffer, mode) {
    if (!isScreenReady(screen)) {
      return { matched: false, ratio: 0 };
    }
    let weakest = 1;
    for (const anchor of screen.anchors) {
      const result = matchFingerprint(gl, anchor, buffer, mode, screen.tolerance, screen.minRatio);
      weakest = Math.min(weakest, result.ratio);
      if (!result.matched) {
        return { matched: false, ratio: weakest };
      }
    }
    return { matched: true, ratio: weakest };
  }
  function detectScreen(gl, screens, buffer, mode) {
    for (const screen of screens || []) {
      if (scoreScreen(gl, screen, buffer, mode).matched) {
        return screen;
      }
    }
    return null;
  }
  function stepAllowedOn(step, screenId) {
    if (!step.screens || step.screens.length === 0) {
      return true;
    }
    return screenId !== null && step.screens.includes(screenId);
  }

  // src/bot/activity.js
  var DEFAULT_ACTIVITIES = Object.freeze([
    { id: "pvp", name: "PVP", enabled: true },
    { id: "gvg", name: "GVG", enabled: true },
    { id: "invasion", name: "Invasion", enabled: true },
    { id: "expedition", name: "Expedition", enabled: true },
    { id: "trials", name: "Trials / Gauntlet", enabled: true },
    // Solo and team are two different sequences, not one with a setting: the
    // team lobby has a party to wait for and a Private box to get right.
    { id: "worldboss", name: "World Boss (solo)", enabled: true },
    { id: "worldbossteam", name: "World Boss (team)", enabled: false },
    { id: "raid", name: "Raid", enabled: true },
    { id: "dungeon", name: "Dungeon", enabled: true }
  ]);
  function createDefaultActivities() {
    return DEFAULT_ACTIVITIES.map((activity) => ({ ...activity }));
  }
  function stepsForActivity(steps, activityId) {
    return steps.filter((step) => step.activity === activityId);
  }
  function looseSteps(steps) {
    return steps.filter((step) => !step.activity);
  }

  // src/core/events.js
  function createEmitter() {
    const handlers = /* @__PURE__ */ new Map();
    return {
      /** @returns {() => void} unsubscribe */
      on(event, handler) {
        if (!handlers.has(event)) {
          handlers.set(event, /* @__PURE__ */ new Set());
        }
        handlers.get(event).add(handler);
        return () => handlers.get(event)?.delete(handler);
      },
      emit(event, payload) {
        const listeners2 = handlers.get(event);
        if (!listeners2) {
          return;
        }
        for (const handler of listeners2) {
          try {
            handler(payload);
          } catch (error) {
            console.error(`[BHB] handler for "${event}" threw`, error);
          }
        }
      }
    };
  }

  // src/core/pace.js
  var FIRST_PACE = SCRIPT_PACE_LADDER[0];
  function nextPace(current, clicked) {
    if (clicked) {
      return FIRST_PACE;
    }
    const elapsed = Number(current) || FIRST_PACE;
    const index = SCRIPT_PACE_LADDER.findIndex((pace) => pace >= elapsed);
    if (index < 0) {
      return SCRIPT_PACE_LADDER[SCRIPT_PACE_LADDER.length - 1];
    }
    const step = SCRIPT_PACE_LADDER[index] === elapsed ? index + 1 : index;
    return SCRIPT_PACE_LADDER[Math.min(step, SCRIPT_PACE_LADDER.length - 1)];
  }

  // src/core/engine.js
  var TaskId = Object.freeze({
    SCRIPT: "script",
    SOLO: "solo",
    RUN_ALL: "runAll"
  });
  function resolveRunTarget(target, activities = []) {
    if (target === TaskId.RUN_ALL) {
      return { taskId: TaskId.RUN_ALL, activityId: null };
    }
    if (target && target !== TaskId.SCRIPT && activities.some((one) => one.id === target)) {
      return { taskId: TaskId.SOLO, activityId: target };
    }
    return { taskId: TaskId.SCRIPT, activityId: null };
  }
  function createEngine(deps) {
    const emitter = createEmitter();
    const state = {
      /** @type {string | null} */
      activeTask: null,
      lastActionAt: 0,
      lastMessage: "",
      /** @type {string | null} id of the screen detected on the last tick */
      screen: null,
      /** @type {string | null} */
      screenName: null,
      /** @type {string | null} id of the activity Run-All is on */
      activity: null,
      /** @type {string | null} */
      activityName: null,
      /** @type {string | null} id of the step the runner is waiting for */
      expectedStepId: null,
      round: 0
    };
    let spent = /* @__PURE__ */ new Set();
    let queueIndex = 0;
    let idleTicks = 0;
    const cursor = { key: null, index: 0, missingSince: 0 };
    let restingUntil = 0;
    let pace = FIRST_PACE;
    let pollTimer = null;
    let autoStopTimer = null;
    const TASKS = {
      [TaskId.SCRIPT]: { interval: INTERVAL_SCRIPT, getSteps: () => looseSteps(deps.getScriptSteps()) },
      [TaskId.SOLO]: { interval: INTERVAL_RUN_ALL, getSteps: soloSteps },
      [TaskId.RUN_ALL]: { interval: INTERVAL_RUN_ALL, getSteps: runAllRules }
    };
    function soloSteps() {
      return state.activity ? stepsForActivity(deps.getScriptSteps(), state.activity) : [];
    }
    function activities() {
      return (deps.getActivities ? deps.getActivities() : []).filter((a) => a.enabled);
    }
    function runAllRules() {
      const current = currentActivity();
      return current ? stepsForActivity(deps.getScriptSteps(), current.id) : [];
    }
    function currentActivity() {
      const queue = activities();
      return queue.length > 0 ? queue[queueIndex % queue.length] : null;
    }
    function setActivity(activity) {
      state.activity = activity ? activity.id : null;
      state.activityName = activity ? activity.name : null;
    }
    function advanceQueue(why) {
      const queue = activities();
      if (queue.length === 0) {
        return;
      }
      const leaving = currentActivity();
      if (why === "spent" && leaving) {
        spent.add(leaving.id);
      }
      idleTicks = 0;
      cursor.key = null;
      for (let step = 1; step <= queue.length; step += 1) {
        const index = (queueIndex + step) % queue.length;
        if (index === 0) {
          if (spent.size >= queue.length) {
            report("resource", { label: leaving ? leaving.name : "run all" });
            stop();
            setMessage("run all: everything is spent");
            return;
          }
          state.round += 1;
          spent = /* @__PURE__ */ new Set();
          if (deps.shouldCloseAfterRound && deps.shouldCloseAfterRound() && deps.closeGame) {
            deps.closeGame();
          }
        }
        if (!spent.has(queue[index].id)) {
          queueIndex = index;
          setActivity(queue[index]);
          report("activity", {
            label: queue[index].name,
            activityId: queue[index].id,
            why,
            round: state.round,
            // Who ran dry is the activity being left, never the one announced.
            ...why === "spent" && leaving ? { spentId: leaving.id, spentName: leaving.name } : {}
          });
          setMessage(`${queue[index].name}: ${why === "spent" ? "next" : "nothing to do, next"}`);
          return;
        }
      }
    }
    function report(kind, detail = {}) {
      emitter.emit("action", { at: realNow(), kind, task: state.activeTask, ...detail });
    }
    function setMessage(message) {
      state.lastMessage = message;
      emitter.emit("change", getState());
    }
    function getState() {
      return {
        activeTask: state.activeTask,
        lastMessage: state.lastMessage,
        screen: state.screen,
        screenName: state.screenName,
        activity: state.activity,
        activityName: state.activityName,
        expectedStepId: state.expectedStepId,
        round: state.round,
        restingMs: Math.max(0, restingUntil - realNow()),
        spent: [...spent],
        remainingMs: state.activeTask ? Math.max(0, AUTO_STOP_TIMEOUT - (realNow() - state.lastActionAt)) : 0
      };
    }
    function matchStep(step, gl, screenId, buffer, scaleMode) {
      if (!isStepReady(step)) {
        return null;
      }
      if (!stepAllowedOn(step, screenId)) {
        return null;
      }
      for (const storedPoint of step.points) {
        const hit = matchPoint(
          gl,
          storedPoint,
          colorForPoint(step, storedPoint),
          buffer,
          scaleMode,
          step.tolerance
        );
        if (hit.matched) {
          return hit.point;
        }
      }
      return null;
    }
    function countPlaces(step, gl, screenId, buffer, scaleMode) {
      if (!isStepReady(step) || !stepAllowedOn(step, screenId)) {
        return 0;
      }
      let seen = 0;
      for (const place of pointsByPlace(step)) {
        const matched = place.some(
          (storedPoint) => matchPoint(
            gl,
            storedPoint,
            colorForPoint(step, storedPoint),
            buffer,
            scaleMode,
            step.tolerance
          ).matched
        );
        if (matched) {
          seen += 1;
        }
      }
      return seen;
    }
    function tryStep(step, canvas, gl, screenId, buffer, scaleMode) {
      const point = matchStep(step, gl, screenId, buffer, scaleMode);
      if (!point) {
        return null;
      }
      return { step, point, clicked: clickBufferPoint(canvas, point) };
    }
    function runSteps(steps, canvas, gl, screenId) {
      const buffer = getBufferSize(canvas);
      const scaleMode = deps.getScaleMode();
      for (let index = 0; index < steps.length; index += 1) {
        const hit = tryStep(steps[index], canvas, gl, screenId, buffer, scaleMode);
        if (hit) {
          return { ...hit, index };
        }
      }
      return null;
    }
    function runSequence(steps, canvas, gl, screenId) {
      const key = sequenceKey();
      if (key === null || steps.length === 0) {
        return runSteps(steps, canvas, gl, screenId);
      }
      if (cursor.key !== key) {
        cursor.key = key;
        cursor.index = 0;
        cursor.missingSince = 0;
      }
      const buffer = getBufferSize(canvas);
      const scaleMode = deps.getScaleMode();
      for (let hops = 0; hops < steps.length; hops += 1) {
        const expected = steps[cursor.index % steps.length];
        state.expectedStepId = expected ? expected.id : null;
        const point = matchStep(expected, gl, screenId, buffer, scaleMode);
        if (expected.kind === StepKind.WAIT) {
          const stillThere = countPlaces(expected, gl, screenId, buffer, scaleMode);
          if (stillThere > (expected.maxMatches || 0)) {
            cursor.missingSince = 0;
            setMessage(
              `${expected.label || expected.id}: waiting (${stillThere} left)`
            );
            return null;
          }
          cursor.index = (cursor.index + 1) % steps.length;
          continue;
        }
        if (point) {
          cursor.index = (cursor.index + 1) % steps.length;
          cursor.missingSince = 0;
          return { step: expected, point, clicked: clickBufferPoint(canvas, point) };
        }
        if (expected.optional) {
          cursor.index = (cursor.index + 1) % steps.length;
          continue;
        }
        if (!cursor.missingSince) {
          cursor.missingSince = realNow();
        }
        break;
      }
      if (!cursor.missingSince || realNow() - cursor.missingSince < RESYNC_AFTER_MS) {
        return null;
      }
      const scan = runSteps(steps, canvas, gl, screenId);
      if (!scan) {
        return null;
      }
      report("resync", { label: scan.step.label || scan.step.id });
      cursor.index = (scan.index + 1) % steps.length;
      cursor.missingSince = 0;
      return scan;
    }
    function sequenceKey() {
      if (state.activeTask === TaskId.RUN_ALL || state.activeTask === TaskId.SOLO) {
        return state.activity;
      }
      if (state.activeTask === TaskId.SCRIPT) {
        return "script";
      }
      return null;
    }
    function updateScreen(canvas, gl) {
      const screens = deps.getScreens ? deps.getScreens() : [];
      if (screens.length === 0) {
        return null;
      }
      const screen = detectScreen(gl, screens, getBufferSize(canvas), deps.getScaleMode());
      const id = screen ? screen.id : null;
      if (id !== state.screen) {
        state.screen = id;
        state.screenName = screen ? screen.name : null;
        report("screen", { label: screen ? screen.name || screen.id : "unknown", screenId: id });
        if (screen && screen.notify) {
          report("notify", { label: screen.name || screen.id, screenId: id });
        }
      }
      return screen;
    }
    function tick() {
      if (!state.activeTask) {
        return false;
      }
      if (restingUntil > realNow()) {
        return false;
      }
      const target = getRenderTarget();
      if (!target) {
        setMessage("waiting for game canvas");
        return false;
      }
      const screen = updateScreen(target.canvas, target.gl);
      if (screen && screen.stopsTask && state.activeTask === TaskId.RUN_ALL) {
        advanceQueue("spent");
        return false;
      }
      if (screen && screen.stopsTask) {
        const stopped = state.activeTask;
        const label = screen.name || screen.id;
        report("resource", { label });
        stop();
        setMessage(`${stopped} stopped: ${label}`);
        return false;
      }
      const task = TASKS[state.activeTask];
      const hit = runSequence(task.getSteps(), target.canvas, target.gl, state.screen);
      if (!hit) {
        if (state.activeTask === TaskId.RUN_ALL) {
          idleTicks += 1;
          if (idleTicks >= IDLE_ADVANCE_TICKS) {
            advanceQueue("idle");
            return false;
          }
          setMessage(`${state.activityName || "run all"}: no match`);
          return false;
        }
        setMessage(`${state.activeTask}: no match`);
        return false;
      }
      idleTicks = 0;
      if (hit.clicked) {
        state.lastActionAt = realNow();
        const rest = Number(hit.step.restSec) || 0;
        if (rest > 0) {
          restingUntil = realNow() + rest * 1e3;
          setMessage(`${hit.step.label || hit.step.id}: resting ${rest}s`);
        }
      }
      report(hit.clicked ? "click" : "busy", {
        stepId: hit.step.id,
        label: hit.step.label || hit.step.id,
        point: hit.point
      });
      setMessage(`${hit.step.label || hit.step.id} → ${hit.clicked ? "click" : "busy"}`);
      return Boolean(hit.clicked);
    }
    function schedulePoll() {
      const adaptive = state.activeTask === TaskId.SCRIPT;
      const resting = restingUntil > realNow();
      const delay = adaptive ? resting ? SCRIPT_PACE_LADDER[SCRIPT_PACE_LADDER.length - 1] : pace : TASKS[state.activeTask].interval;
      pollTimer = realSetTimeout(() => {
        const wasResting = restingUntil > realNow();
        const clicked = tick();
        if (adaptive && !wasResting) {
          pace = nextPace(pace, clicked);
        }
        if (state.activeTask) {
          schedulePoll();
        }
      }, delay);
    }
    function clearInterval_(id) {
      if (id !== null && id !== void 0) {
        realClearInterval(id);
      }
    }
    function checkAutoStop() {
      if (!state.activeTask) {
        return;
      }
      if (realNow() - state.lastActionAt < AUTO_STOP_TIMEOUT) {
        return;
      }
      const stalled = state.activeTask;
      if (deps.shouldRecoverFromHang && deps.shouldRecoverFromHang() && deps.recoverFromHang) {
        report("hang", { label: stalled });
        setMessage(`${stalled} looks stuck — reloading`);
        if (deps.recoverFromHang(stalled)) {
          return;
        }
        stop();
        setMessage(`${stalled} stopped: reloading did not help`);
        return;
      }
      stop();
      setMessage(`${stalled} auto-stopped (idle ${AUTO_STOP_TIMEOUT / 6e4}m)`);
    }
    function start2(taskId, activityId = null) {
      if (!TASKS[taskId]) {
        throw new Error(`unknown task: ${taskId}`);
      }
      if (state.activeTask) {
        stop();
      }
      state.activeTask = taskId;
      state.lastActionAt = realNow();
      restingUntil = 0;
      spent = /* @__PURE__ */ new Set();
      queueIndex = 0;
      idleTicks = 0;
      cursor.key = null;
      state.expectedStepId = null;
      state.round = taskId === TaskId.RUN_ALL ? 1 : 0;
      if (taskId === TaskId.SOLO) {
        const solo = (deps.getActivities ? deps.getActivities() : []).find(
          (activity) => activity.id === activityId
        );
        setActivity(solo || null);
      } else {
        setActivity(taskId === TaskId.RUN_ALL ? currentActivity() : null);
      }
      pace = FIRST_PACE;
      schedulePoll();
      autoStopTimer = realSetInterval(checkAutoStop, INTERVAL_AUTO_STOP_CHECK);
      report("task", { started: true, label: taskId });
      setMessage(`${taskId} started`);
      tick();
    }
    function stop() {
      if (!state.activeTask) {
        return;
      }
      const stopped = state.activeTask;
      state.activeTask = null;
      restingUntil = 0;
      state.screen = null;
      state.screenName = null;
      state.expectedStepId = null;
      cursor.key = null;
      setActivity(null);
      realClearTimeout(pollTimer);
      clearInterval_(autoStopTimer);
      pollTimer = autoStopTimer = null;
      report("task", { started: false, label: stopped });
      setMessage(`${stopped} stopped`);
    }
    function toggle(taskId) {
      if (state.activeTask === taskId) {
        stop();
      } else {
        start2(taskId);
      }
    }
    return { start: start2, stop, toggle, tick, checkIdle: checkAutoStop, getState, on: emitter.on, setMessage };
  }

  // src/core/notify.js
  var NOTIFY_EVENTS = Object.freeze(["notify", "resource", "hang", "task"]);
  function createDefaultNotifyConfig() {
    return {
      enabled: false,
      discordWebhook: "",
      telegramToken: "",
      telegramChat: "",
      withShot: true,
      events: ["notify"]
    };
  }
  function normaliseNotifyConfig(candidate) {
    const base = createDefaultNotifyConfig();
    if (!candidate || typeof candidate !== "object") {
      return base;
    }
    for (const key of ["discordWebhook", "telegramToken", "telegramChat"]) {
      if (typeof candidate[key] === "string") {
        base[key] = candidate[key].trim();
      }
    }
    base.enabled = candidate.enabled === true;
    base.withShot = candidate.withShot !== false;
    if (Array.isArray(candidate.events)) {
      base.events = candidate.events.filter((kind) => NOTIFY_EVENTS.includes(kind));
    }
    return base;
  }
  function hasNotifyTarget(config) {
    return Boolean(
      config && (config.discordWebhook || config.telegramToken && config.telegramChat)
    );
  }
  function captureShot(canvas) {
    return new Promise((resolve) => {
      if (!canvas || typeof canvas.toBlob !== "function") {
        resolve(null);
        return;
      }
      try {
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", NOTIFY_SHOT_QUALITY);
      } catch (error) {
        console.warn("[BHB] could not capture the canvas", error);
        resolve(null);
      }
    });
  }
  function discordRequest(config, text, shot) {
    if (!shot) {
      return {
        url: config.discordWebhook,
        body: JSON.stringify({ content: text }),
        headers: { "Content-Type": "application/json" }
      };
    }
    const form = new FormData();
    form.append("payload_json", JSON.stringify({ content: text }));
    form.append("files[0]", shot, "bhb.jpg");
    return { url: config.discordWebhook, body: form };
  }
  function telegramRequest(config, text, shot) {
    const base = `https://api.telegram.org/bot${config.telegramToken}`;
    if (!shot) {
      return {
        url: `${base}/sendMessage`,
        body: JSON.stringify({ chat_id: config.telegramChat, text }),
        headers: { "Content-Type": "application/json" }
      };
    }
    const form = new FormData();
    form.append("chat_id", config.telegramChat);
    form.append("caption", text);
    form.append("photo", shot, "bhb.jpg");
    return { url: `${base}/sendPhoto`, body: form };
  }
  function createNotifier(deps) {
    const send = deps.fetch || ((...args) => fetch(...args));
    const now = deps.now || realNow;
    const report = deps.report || (() => {
    });
    const lastSentAt = /* @__PURE__ */ new Map();
    function post(request) {
      return send(request.url, {
        method: "POST",
        body: request.body,
        ...request.headers ? { headers: request.headers } : {}
      });
    }
    async function notify(text, kind = "manual", options = {}) {
      const config = deps.getConfig();
      if (!config || !config.enabled && !options.force || !hasNotifyTarget(config)) {
        return false;
      }
      const at = now();
      const previous = lastSentAt.get(kind);
      if (previous !== void 0 && at - previous < NOTIFY_COOLDOWN_MS) {
        return false;
      }
      lastSentAt.set(kind, at);
      const shot = config.withShot ? await captureShot(deps.getCanvas()) : null;
      const requests = [];
      if (config.discordWebhook) {
        requests.push(discordRequest(config, text, shot));
      }
      if (config.telegramToken && config.telegramChat) {
        requests.push(telegramRequest(config, text, shot));
      }
      const results = await Promise.all(
        requests.map(
          (request) => post(request).then(
            (response) => response && response.ok !== false,
            (error) => {
              console.warn("[BHB] alert failed", error);
              return false;
            }
          )
        )
      );
      const sent = results.some(Boolean);
      if (!sent) {
        report("alert failed — check the webhook");
      }
      return sent;
    }
    function clearCooldown() {
      lastSentAt.clear();
    }
    return { notify, clearCooldown };
  }

  // src/core/probe.js
  var ASPECT_EPSILON = 0.01;
  function createProbeId() {
    return `pr${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }
  function createProbe(captured) {
    return {
      id: createProbeId(),
      label: captured.label || "",
      x: captured.x,
      y: captured.y,
      bw: captured.bw,
      bh: captured.bh,
      hex: captured.hex
    };
  }
  function scoreProbe(probe, buffer, live, tolerance, mode) {
    const resolved = resolvePoint(probe, buffer, mode);
    const expected = hexToRgb(probe.hex);
    const delta = live ? Math.max(
      Math.abs(live.r - expected.r),
      Math.abs(live.g - expected.g),
      Math.abs(live.b - expected.b)
    ) : null;
    const capturedAspect = probe.bw / probe.bh;
    const liveAspect = buffer.width / buffer.height;
    return {
      id: probe.id,
      resolved,
      liveHex: live ? rgbToHex(live) : null,
      delta,
      matches: delta === null ? null : delta <= tolerance,
      resized: probe.bw !== buffer.width || probe.bh !== buffer.height,
      aspectChanged: Math.abs(capturedAspect - liveAspect) > ASPECT_EPSILON
    };
  }
  function isUsable(candidate) {
    return candidate && typeof candidate === "object" && typeof candidate.x === "number" && typeof candidate.y === "number" && typeof candidate.bw === "number" && typeof candidate.bh === "number" && typeof candidate.hex === "string";
  }
  function normaliseProbes(stored) {
    if (!Array.isArray(stored)) {
      return [];
    }
    return stored.filter(isUsable).map((probe) => ({
      id: typeof probe.id === "string" && probe.id ? probe.id : createProbeId(),
      label: typeof probe.label === "string" ? probe.label : "",
      x: probe.x,
      y: probe.y,
      bw: probe.bw,
      bh: probe.bh,
      hex: probe.hex
    }));
  }

  // src/core/storage.js
  var SCHEMA_VERSION = 5;
  function createDefaultState() {
    return {
      version: SCHEMA_VERSION,
      activeProfileId: "default",
      profiles: [
        {
          id: "default",
          name: "Default",
          steps: [],
          screens: [],
          activities: createDefaultActivities()
        }
      ]
    };
  }
  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn(`[BHB] could not read ${key}`, error);
      return null;
    }
  }
  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`[BHB] could not write ${key}`, error);
      return false;
    }
  }
  function importLegacySteps() {
    const legacy = readJson(STORAGE_KEY_LEGACY_RULES);
    if (!Array.isArray(legacy)) {
      return [];
    }
    return legacy.filter((entry) => entry && typeof entry.x === "number").map(
      (entry) => createStep({
        label: "imported",
        points: [{ x: entry.x, y: entry.y }],
        hex: entry.hex ?? null,
        tolerance: entry.tol ?? DEFAULT_COLOR_TOLERANCE,
        enabled: entry.enabled !== false
      })
    );
  }
  function mergeActivities(stored) {
    if (!Array.isArray(stored) || stored.length === 0) {
      return createDefaultActivities();
    }
    const merged = [...stored];
    const has = (id) => merged.some((activity) => activity && activity.id === id);
    DEFAULT_ACTIVITIES.forEach((activity, index) => {
      if (has(activity.id)) {
        return;
      }
      let at = merged.length;
      for (let before = index - 1; before >= 0; before -= 1) {
        const anchor = merged.findIndex((entry) => entry && entry.id === DEFAULT_ACTIVITIES[before].id);
        if (anchor !== -1) {
          at = anchor + 1;
          break;
        }
      }
      merged.splice(at, 0, { ...activity, enabled: false });
    });
    return merged;
  }
  function normaliseState(candidate) {
    if (!candidate || typeof candidate !== "object" || !Array.isArray(candidate.profiles) || candidate.profiles.length === 0) {
      return createDefaultState();
    }
    const profiles = candidate.profiles.filter((profile) => profile && typeof profile.id === "string").map((profile) => ({
      id: profile.id,
      name: typeof profile.name === "string" ? profile.name : profile.id,
      // v4 and earlier called them rules; the same objects, under the old name.
      steps: Array.isArray(profile.steps) ? profile.steps : Array.isArray(profile.rules) ? profile.rules : [],
      screens: Array.isArray(profile.screens) ? profile.screens : [],
      activities: mergeActivities(profile.activities)
    }));
    if (profiles.length === 0) {
      return createDefaultState();
    }
    const active2 = profiles.some((p) => p.id === candidate.activeProfileId) ? candidate.activeProfileId : profiles[0].id;
    return { version: SCHEMA_VERSION, activeProfileId: active2, profiles };
  }
  function loadProfiles() {
    const stored = readJson(STORAGE_KEY_PROFILES);
    if (stored) {
      return normaliseState(stored);
    }
    const state = createDefaultState();
    const imported = importLegacySteps();
    if (imported.length > 0) {
      state.profiles[0].steps = imported;
      console.info(`[BHB] imported ${imported.length} step(s) from bh-scripts`);
    }
    saveProfiles(state);
    return state;
  }
  function saveProfiles(state) {
    return writeJson(STORAGE_KEY_PROFILES, state);
  }
  function getActiveProfile(state) {
    return state.profiles.find((p) => p.id === state.activeProfileId) ?? state.profiles[0];
  }
  function createProfileId() {
    return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }
  function createProfile(state, name) {
    const profile = {
      id: createProfileId(),
      name: name || `Profile ${state.profiles.length + 1}`,
      steps: [],
      screens: [],
      activities: createDefaultActivities()
    };
    state.profiles.push(profile);
    state.activeProfileId = profile.id;
    return profile;
  }
  function duplicateProfile(state, name) {
    const source = getActiveProfile(state);
    const copy = JSON.parse(JSON.stringify(source));
    copy.id = createProfileId();
    copy.name = name || `${source.name} copy`;
    state.profiles.push(copy);
    state.activeProfileId = copy.id;
    return copy;
  }
  function renameProfile(state, profileId, name) {
    const profile = state.profiles.find((entry) => entry.id === profileId);
    if (!profile || !name) {
      return false;
    }
    profile.name = name;
    return true;
  }
  function deleteProfile(state, profileId) {
    if (state.profiles.length <= 1) {
      return false;
    }
    const index = state.profiles.findIndex((entry) => entry.id === profileId);
    if (index === -1) {
      return false;
    }
    state.profiles.splice(index, 1);
    if (state.activeProfileId === profileId) {
      state.activeProfileId = state.profiles[0].id;
    }
    return true;
  }
  function setActiveProfile(state, profileId) {
    if (!state.profiles.some((entry) => entry.id === profileId)) {
      return false;
    }
    state.activeProfileId = profileId;
    return true;
  }
  function normaliseCanvasLock(stored) {
    return { enabled: Boolean(stored && stored.enabled === true) };
  }
  function loadSettings() {
    const stored = readJson(STORAGE_KEY_SETTINGS) || {};
    return {
      scaleMode: stored.scaleMode === ScaleMode.ABSOLUTE ? ScaleMode.ABSOLUTE : ScaleMode.SCALE,
      language: stored.language === "en" ? "en" : "vi",
      // A bot that closes the game unasked is a bot that loses a session.
      closeAfterRound: stored.closeAfterRound === true,
      watchdog: stored.watchdog === true,
      sizeBadge: stored.sizeBadge !== false,
      keepAlive: stored.keepAlive !== false,
      notify: normaliseNotifyConfig(stored.notify),
      canvasLock: normaliseCanvasLock(stored.canvasLock),
      probes: normaliseProbes(stored.probes),
      // What the Run key starts: the loose Script set, one activity's id, or
      // the whole queue. Kept because it is the one thing a session repeats.
      runTarget: typeof stored.runTarget === "string" ? stored.runTarget : "script",
      // Which settings section is expanded; it is usually the same one twice.
      openSection: typeof stored.openSection === "string" ? stored.openSection : null
    };
  }
  function saveSettings(settings) {
    return writeJson(STORAGE_KEY_SETTINGS, settings);
  }
  function exportProfiles(state) {
    return JSON.stringify(state, null, 2);
  }
  function importProfiles(json) {
    const parsed = JSON.parse(json);
    const state = normaliseState(parsed);
    if (state.profiles.every((p) => p.steps.length === 0) && !parsed.profiles) {
      throw new Error("not a BHB profile export");
    }
    return state;
  }

  // src/core/watchdog.js
  function read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RESUME);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed.task !== "string" || typeof parsed.at !== "number") {
        return null;
      }
      return { task: parsed.task, at: parsed.at, reloads: Number(parsed.reloads) || 0 };
    } catch (error) {
      console.warn("[BHB] could not read the resume record", error);
      return null;
    }
  }
  function write(record) {
    try {
      if (record === null) {
        localStorage.removeItem(STORAGE_KEY_RESUME);
      } else {
        localStorage.setItem(STORAGE_KEY_RESUME, JSON.stringify(record));
      }
      return true;
    } catch (error) {
      console.warn("[BHB] could not write the resume record", error);
      return false;
    }
  }
  function createWatchdog(deps = {}) {
    const now = deps.now || realNow;
    const reload = deps.reload || (() => window.location.reload());
    function arm(task) {
      const previous = read();
      write({ task, at: now(), reloads: previous ? previous.reloads : 0 });
    }
    function disarm() {
      write(null);
    }
    function noteProgress() {
      const record = read();
      if (record && record.reloads !== 0) {
        write({ ...record, reloads: 0 });
      }
    }
    function taskToResume() {
      const record = read();
      if (!record) {
        return null;
      }
      if (now() - record.at > RESUME_MAX_AGE) {
        write(null);
        return null;
      }
      return record.task;
    }
    function reloadCount() {
      const record = read();
      return record ? record.reloads : 0;
    }
    function recover(task) {
      const record = read();
      const reloads = (record ? record.reloads : 0) + 1;
      if (reloads > MAX_RELOADS) {
        write(null);
        return false;
      }
      write({ task, at: now(), reloads });
      reload();
      return true;
    }
    return { arm, disarm, noteProgress, taskToResume, reloadCount, recover };
  }

  // src/core/stats.js
  function emptyStats(at) {
    return {
      startedAt: at,
      clicks: 0,
      rounds: 0,
      resyncs: 0,
      hangs: 0,
      drops: 0,
      runningMs: 0,
      activities: {}
    };
  }
  function normalise(candidate, at) {
    const base = emptyStats(at);
    if (!candidate || typeof candidate !== "object") {
      return base;
    }
    for (const key of Object.keys(base)) {
      if (key === "activities") {
        continue;
      }
      if (typeof candidate[key] === "number" && Number.isFinite(candidate[key])) {
        base[key] = candidate[key];
      }
    }
    if (candidate.activities && typeof candidate.activities === "object") {
      for (const [id, entry] of Object.entries(candidate.activities)) {
        if (!entry || typeof entry !== "object") {
          continue;
        }
        base.activities[id] = {
          name: typeof entry.name === "string" ? entry.name : id,
          clicks: Number(entry.clicks) || 0,
          visits: Number(entry.visits) || 0,
          spent: Number(entry.spent) || 0
        };
      }
    }
    return base;
  }
  function readStored() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STATS);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn("[BHB] could not read stats", error);
      return null;
    }
  }
  function createStats(deps = {}) {
    const now = deps.now || realNow;
    const shouldPersist = deps.persist !== false;
    let stats = normalise(shouldPersist ? readStored() : null, now());
    let runningSince = null;
    let currentActivity = null;
    function save() {
      if (!shouldPersist) {
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
      } catch (error) {
        console.warn("[BHB] could not write stats", error);
      }
    }
    function activityEntry(id, name) {
      if (!stats.activities[id]) {
        stats.activities[id] = { name: name || id, clicks: 0, visits: 0, spent: 0 };
      } else if (name) {
        stats.activities[id].name = name;
      }
      return stats.activities[id];
    }
    function settleRunning(at) {
      if (runningSince === null) {
        return;
      }
      stats.runningMs += Math.max(0, at - runningSince);
      runningSince = null;
    }
    function record(entry) {
      if (!entry || typeof entry.kind !== "string") {
        return;
      }
      const at = typeof entry.at === "number" ? entry.at : now();
      if (entry.kind === "task") {
        if (entry.started) {
          runningSince = at;
        } else {
          settleRunning(at);
          currentActivity = null;
        }
      } else if (entry.kind === "click") {
        stats.clicks += 1;
        if (currentActivity) {
          activityEntry(currentActivity.id, currentActivity.name).clicks += 1;
        }
      } else if (entry.kind === "activity") {
        currentActivity = { id: entry.activityId || entry.label, name: entry.label };
        const visited = activityEntry(currentActivity.id, currentActivity.name);
        visited.visits += 1;
        if (entry.why === "spent" && entry.spentId) {
          activityEntry(entry.spentId, entry.spentName).spent += 1;
        }
      } else if (entry.kind === "resource") {
        if (currentActivity) {
          activityEntry(currentActivity.id, currentActivity.name).spent += 1;
        }
      } else if (entry.kind === "resync") {
        stats.resyncs += 1;
      } else if (entry.kind === "hang") {
        stats.hangs += 1;
      } else if (entry.kind === "notify") {
        stats.drops += 1;
      }
      if (typeof entry.round === "number" && entry.round > stats.rounds) {
        stats.rounds = entry.round;
      }
      save();
    }
    function snapshot() {
      const live = runningSince === null ? 0 : Math.max(0, now() - runningSince);
      return {
        ...stats,
        runningMs: stats.runningMs + live,
        activities: { ...stats.activities }
      };
    }
    function reset() {
      stats = emptyStats(now());
      runningSince = runningSince === null ? null : now();
      currentActivity = null;
      save();
    }
    return { record, snapshot, reset };
  }
  function formatDuration(ms) {
    const total = Math.max(0, Math.floor(ms / 1e3));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor(total % 3600 / 60);
    const seconds = total % 60;
    if (hours > 0) {
      return `${hours}h ${String(minutes).padStart(2, "0")}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    }
    return `${seconds}s`;
  }

  // src/core/canvas-lock.js
  var LOCK_SIZE = Object.freeze({ width: 640, height: 400 });
  var original = null;
  var applied = null;
  function styleTargets() {
    const canvas = getCanvas();
    if (!canvas) {
      return null;
    }
    return { canvas, box: canvas.parentElement };
  }
  function lockCanvasSize(size = LOCK_SIZE) {
    const target = styleTargets();
    if (!target) {
      return false;
    }
    if (!original) {
      original = {
        canvas: target.canvas.style.cssText,
        box: target.box ? target.box.style.cssText : ""
      };
    }
    const pinned = {
      width: Math.max(320, Math.round(size.width)),
      height: Math.max(240, Math.round(size.height))
    };
    if (applied && applied.width === pinned.width && applied.height === pinned.height) {
      return true;
    }
    const width = `${pinned.width}px`;
    const height = `${pinned.height}px`;
    if (target.box) {
      target.box.style.width = width;
      target.box.style.height = height;
    }
    target.canvas.style.width = width;
    target.canvas.style.height = height;
    applied = pinned;
    window.dispatchEvent(new Event("resize"));
    return true;
  }
  function unlockCanvasSize() {
    const target = styleTargets();
    if (!target || !original) {
      return false;
    }
    target.canvas.style.cssText = original.canvas;
    if (target.box) {
      target.box.style.cssText = original.box;
    }
    original = null;
    applied = null;
    window.dispatchEvent(new Event("resize"));
    return true;
  }

  // src/core/cursor.js
  var cursorX = null;
  var cursorY = null;
  var isTracking = false;
  function trackCursor() {
    if (isTracking) {
      return;
    }
    isTracking = true;
    window.addEventListener(
      "mousemove",
      (event) => {
        cursorX = event.clientX;
        cursorY = event.clientY;
      },
      true
    );
  }
  function getCursor() {
    if (cursorX === null || cursorY === null) {
      return null;
    }
    return { clientX: cursorX, clientY: cursorY };
  }

  // src/i18n/vi.js
  var vi_default = {
    "app.name": "BHB",
    "task.runAll": "Chạy tất cả",
    "task.script": "Tuỳ chỉnh",
    "hud.idle": "đang dừng",
    "tab.tasks": "Chạy",
    "tab.steps": "Bước",
    "tab.screens": "Màn hình",
    "tab.settings": "Cài đặt",
    "tab.log": "Nhật ký",
    "tab.help": "?",
    "panel.close": "Đóng",
    "overlay.speed": "Tốc độ",
    "overlay.canvas": "Canvas",
    "overlay.autoStop": "Tự tắt sau",
    "overlay.steps": "Bước",
    "overlay.noSteps": "Chưa có bước nào. Rê chuột lên nút trong game rồi bấm Bắt bước.",
    "overlay.needsRecapture": "Bước cũ, chưa có cỡ canvas — nên bắt lại",
    "step.defaultLabel": "Bước {n}",
    "steps.capture": "Bắt bước tại con trỏ",
    "steps.captureHint": "Rê chuột lên nút trong game rồi bấm. Bot tự đọc màu lúc nút không sáng, rồi bấm luôn nút đó thật — game đi tiếp đúng như khi bước này chạy.",
    "steps.unnamed": "(chưa đặt tên)",
    "steps.enable": "Bật bước",
    "steps.disable": "Tắt bước",
    "steps.moveUp": "Lên (chạy sớm hơn)",
    "steps.moveDown": "Xuống",
    "steps.screenGate": "Chỉ chạy ở màn hình này",
    "steps.anywhere": "Mọi màn hình",
    "steps.activity": "Bước này thuộc hoạt động nào",
    "steps.loose": "Chỉ bước tuỳ chỉnh",
    "steps.noActivity": "Tuỳ chỉnh",
    "steps.moveAll": "Chuyển các bước đang hiện sang…",
    "steps.allSteps": "Tất cả bước",
    "steps.filter": "Chỉ hiện một hoạt động",
    "steps.delete": "Xoá bước",
    "screens.title": "Màn hình",
    "screens.empty": "Chưa có màn hình nào. Bắt một cái để bot biết nó đang ở đâu.",
    "screens.capture": "Bắt vùng nhận diện",
    "screens.captureHint": "Bảng điều khiển sẽ nhường chỗ; kéo một khung quanh thứ chỉ màn hình này có. Esc để huỷ.",
    "screens.addAnchor": "Thêm vùng nhận diện",
    "screens.unnamed": "(chưa đặt tên)",
    "screens.unknown": "chưa rõ",
    "screens.anchors": "Vùng",
    "screens.stopsTask": "Hết tài nguyên — dừng hoạt động ở màn hình này",
    "screens.ratioHint": "Tỉ lệ điểm mẫu đang khớp",
    "screen.defaultName": "Màn hình {n}",
    "queue.title": "Hàng đợi hoạt động",
    "queue.start": "Chạy tất cả",
    "queue.stop": "Dừng",
    "queue.round": "vòng {n}",
    "queue.stepCount": "Số bước thuộc hoạt động này",
    "queue.closeAfterRound": "Đóng game sau khi xong một vòng",
    "queue.hint": "Chạy từ trên xuống, bỏ qua cái đã hết tài nguyên, rồi quay lại từ đầu. Gán bước cho hoạt động ở tab Bước.",
    "settings.profiles": "Hồ sơ",
    "settings.profilesHint": "Mỗi hồ sơ có bước, màn hình và hàng đợi riêng — mỗi nhân vật một hồ sơ. Tài khoản khác thì chỉ cần một browser profile khác.",
    "settings.newProfile": "Tạo mới",
    "settings.newProfileName": "Hồ sơ mới",
    "settings.duplicate": "Nhân bản",
    "settings.rename": "Đổi tên",
    "settings.renamePrompt": "Đặt tên cho hồ sơ này",
    "settings.delete": "Xoá",
    "settings.behaviour": "Hành vi",
    "settings.watchdog": "Tải lại game khi game treo",
    "settings.watchdogHint": "Không bật thì bot chỉ dừng sau 3 phút không làm gì. Bật thì trang tự tải lại và chạy tiếp — tối đa 3 lần rồi mới chịu thua.",
    "settings.reloads": "đã tải lại {n}×",
    "settings.keepAlive": "Chạy tiếp khi cửa sổ bị che kín",
    "settings.keepAliveHint": "Trình duyệt ngừng vẽ khi cửa sổ bị cửa sổ khác phủ kín, và game đứng theo. Bật cái này thì bot tự lái vòng lặp của game. Cần tải lại trang sau khi đổi.",
    "settings.sizeBadge": "Hiện cỡ canvas ở góc màn hình",
    "settings.absoluteCoords": "Dùng toạ độ thô (không co giãn theo cỡ canvas)",
    "settings.language": "Ngôn ngữ",
    "settings.transfer": "Xuất / nhập",
    "settings.transferHint": "Dán nội dung hồ sơ đã xuất vào đây rồi bấm Nhập.",
    "settings.export": "Xuất",
    "settings.import": "Nhập",
    "settings.importFailed": "Nhập thất bại",
    "tasks.target": "Chạy chế độ nào",
    "tasks.run": "Chạy",
    "tasks.stop": "Dừng",
    "tasks.noLoose": "Chưa bước nào thuộc Tuỳ chỉnh — bắt một bước, hoặc chuyển một nhóm sang đây",
    "tasks.runAllLocked": "Chưa dùng được: chưa hoạt động nào có bước. Sang tab Bước, bắt bước rồi gán cho một hoạt động.",
    "tasks.runAllReady": "Sẵn sàng: {n} hoạt động đã có bước",
    "queue.inSettings": "Thứ tự và bật/tắt từng hoạt động nằm ở tab Cài đặt.",
    "steps.next": "Bước bot đang chờ",
    "log.resync": "Lạc nhịp — bắt lại từ {label}",
    "size.same": "Cỡ framebuffer game vẽ ra — bước lưu toạ độ theo hệ này",
    "size.scaled": "Cỡ framebuffer → cỡ hiển thị. Khác nhau nghĩa là game đang được co giãn",
    "steps.legacyBadge": "bắt lại",
    "steps.legacyWarning": "{n} bước chưa có cỡ canvas lúc bắt nên không co giãn được — đổi cỡ cửa sổ là bấm sai chỗ. Bắt lại từng cái để sửa.",
    "log.title": "Nhật ký",
    "log.empty": "Chưa có gì. Bật một hoạt động để bắt đầu.",
    "log.clear": "Xoá",
    "log.clicked": "Click {label}",
    "log.busy": "Khớp {label}, đang bận",
    "log.screen": "Màn hình: {label}",
    "log.resource": "Hết tài nguyên ở {label} — đã dừng",
    "log.activity": "Hàng đợi → {label}",
    "log.hang": "{label} không phản hồi — đang tải lại",
    "log.taskStarted": "Bật {task}",
    "log.taskStopped": "Tắt {task}",
    "help.sectionAuto": "Tự động",
    "help.sectionSteps": "Bước",
    "help.sectionUi": "Giao diện",
    "help.sectionSpeed": "Tốc độ",
    "help.run": "Chạy hoặc dừng chế độ đang chọn ở tab Chạy",
    "help.capture": "Bắt bước tại con trỏ",
    "help.togglePanel": "Mở/đóng bảng điều khiển",
    "help.speedUp": "Nhanh hơn (mốc kế tiếp)",
    "help.speedDown": "Chậm lại (mốc trước đó)",
    "help.footer": "Tự tắt sau 3 phút không click",
    "msg.noCanvas": "không thấy canvas",
    "msg.noWebgl": "không có WebGL",
    "msg.noMousePosition": "chưa có vị trí chuột",
    "msg.outsideCanvas": "con trỏ ngoài canvas",
    "msg.anchorCaptured": "đã bắt vùng {n} cho {name}",
    "msg.stepCaptured": "đã bắt bước tại ({x}, {y}) — {hex}",
    "msg.stepUnstable": "đã bắt bước tại ({x}, {y}) — {hex}, nhưng màu ở đây đổi liên tục (icon nhấp nháy?) nên bước có thể trượt",
    "screens.notify": "Báo tin khi thấy màn hình này (đồ rơi hiếm, familiar xịn)",
    "log.notify": "Thấy {label} — đã báo tin",
    "stats.title": "Thống kê phiên",
    "stats.reset": "Đặt lại",
    "stats.since": "Từ {time}",
    "stats.running": "Thời gian chạy",
    "stats.clicks": "Lượt click",
    "stats.rounds": "Vòng hàng đợi",
    "stats.drops": "Tin đã báo",
    "stats.resyncs": "Lần lạc nhịp",
    "stats.hangs": "Lần treo phải tải lại",
    "stats.byActivity": "Theo hoạt động",
    "stats.colClicks": "click",
    "stats.colVisits": "lượt",
    "stats.colSpent": "cạn",
    "stats.empty": "Chưa chạy hoạt động nào.",
    "notify.title": "Thông báo",
    "notify.enabled": "Gửi thông báo ra Discord / Telegram",
    "notify.withShot": "Kèm ảnh chụp màn hình game",
    "notify.discord": "Discord webhook URL",
    "notify.telegramToken": "Telegram bot token",
    "notify.telegramChat": "Telegram chat ID",
    "notify.events": "Báo khi",
    "notify.event.notify": "Thấy màn hình đã đánh dấu báo tin",
    "notify.event.resource": "Hết tài nguyên",
    "notify.event.hang": "Game treo, phải tải lại",
    "notify.event.task": "Bật / tắt hoạt động",
    "notify.test": "Gửi thử",
    "notify.testText": "BHB: thử thông báo",
    "notify.testSent": "Đã gửi — kiểm tra kênh của bạn",
    "notify.testFailed": "Gửi thất bại — xem lại webhook/token",
    "notify.hint": "Cần ít nhất một kênh: dán Discord webhook, hoặc cả token lẫn chat ID của Telegram. Mỗi loại tin chỉ gửi tối đa 1 lần/phút.",
    "notify.noTarget": "Chưa có kênh nào — dán webhook hoặc token vào bên dưới.",
    "msg.notify": "Đã báo tin: {label}",
    "toast.captured": "✓ đã bắt: {label}",
    "toast.capturedUnstable": "⚠ đã bắt, nhưng màu ở đây đổi liên tục",
    "steps.armCapture": "Bật chế độ bắt bước — cho phép phím X",
    "steps.armHint": "Tắt công tắc này khi bắt xong: phím X nằm cạnh các phím điều khiển bot, bật suốt thì dễ bấm nhầm giữa lúc đang chơi. Nút tím bên trên thì lúc nào cũng dùng được.",
    "msg.captureDisarmed": "phím X đang tắt — bật chế độ bắt bước ở tab Bước",
    "steps.dryRun": "▷ Chạy thử",
    "steps.dryRunStop": "■ Dừng chạy thử",
    "steps.pinMarkers": "Hiện hết dấu",
    "steps.dryRunHint": "Chạy thử đi dọc danh sách và chấm điểm từng bước trên khung hình đang hiện — ✓ khớp, ✗ không khớp, ⊘ thuộc màn hình khác. Nó KHÔNG bấm gì vào game nên lúc nào cũng an toàn. Bình thường dấu chỉ hiện khi rê chuột lên một dòng.",
    "probe.title": "Điểm kiểm tra độ phân giải",
    "probe.defaultName": "Điểm {n}",
    "probe.capture": "＋ Chấm điểm",
    "probe.capturing": "Rê chuột lên nút cần kiểm tra rồi bấm phím X",
    "probe.cancel": "Thôi",
    "probe.pin": "Hiện chữ thập trên game",
    "probe.clear": "Xoá hết",
    "probe.empty": "Chưa có điểm nào.",
    "probe.none": "chưa có",
    "probe.count": "{n} điểm",
    "probe.captured": "chụp ở",
    "probe.now": "bây giờ",
    "probe.unknown": "không đọc được",
    "probe.aspectWarn": "Tỉ lệ khung đã khác lúc chụp ({before} → {after}). Nếu điểm ở giữa vẫn trúng mà điểm ở góc lệch thì game đang letterbox chứ không kéo dãn.",
    "probe.hint": "Chấm vài điểm lên các nút hay dùng — bốn góc và một điểm giữa là đủ. Rồi đổi độ phân giải trong setting game và quay lại đây: chữ thập cho biết chỗ bot sẽ bấm, cột Δ cho biết màu lệch bao nhiêu so với lúc chụp. Δ nhỏ hơn sai số màu là khớp. Đây là đồ đo đạc, không đi theo file xuất bộ bước.",
    "toast.probeCaptured": "✓ điểm kiểm tra: {label}",
    "lock.title": "Khoá cỡ canvas (thử nghiệm)",
    "lock.enabled": "Ghim game ở một cỡ cố định",
    "lock.hint": "Bật thì game luôn vẽ ở 640×400 dù cửa sổ to nhỏ thế nào — nhờ vậy màu bot đọc được giống hệt nhau trên mọi máy, và bộ bước mới chia sẻ được. Cửa sổ nhỏ hơn thì phần hiển thị tự thu lại cho vừa, toạ độ vẫn đúng. Tắt là game co giãn theo cửa sổ như bình thường.",
    "help.closePanel": "Đóng bảng điều khiển",
    "settings.onCount": "{n}/{total} bật",
    "settings.queueCount": "{n} hoạt động",
    "settings.on": "bật",
    "settings.off": "tắt",
    "steps.restHint": "Nghỉ bao nhiêu giây sau khi bước này bấm — dùng cho nút mở trận Dungeon/Raid, để bot khỏi dò suốt lúc đang đánh. 0 là không nghỉ.",
    "queue.runSolo": "Chạy riêng hoạt động này",
    "queue.stopSolo": "Dừng",
    "queue.noSteps": "Chưa có bước nào gán cho hoạt động này",
    "help.speedReset": "Về tốc độ thường (1×)",
    "steps.kindClick": "Bấm",
    "steps.kindOptional": "Bấm nếu có",
    "steps.kindWait": "Chờ đến khi hết",
    "steps.behaviourHint": "Bấm: thấy màu thì bấm, chưa thấy thì đợi. Bấm nếu có: không thấy thì bỏ qua luôn, sang bước sau — dùng cho ô tick sẵn như Private. Chờ đến khi hết: còn thấy màu là còn đứng chờ, mất mới đi tiếp — dùng để chờ đủ người trước khi bấm START.",
    "steps.addPlace": "Thêm một chỗ nữa vào bước này (bảng sẽ ẩn đi, rê chuột rồi bấm X)",
    "steps.placeCount": "Số chỗ bước này nhìn vào",
    "steps.maxMatchesHint": "Còn đứng chờ khi số chỗ vẫn thấy màu NHIỀU HƠN số này. Bốn ô mời + đặt 2 nghĩa là chờ đến khi đủ 3 người, ai ngồi ô nào cũng được.",
    "msg.placeAdded": "đã thêm chỗ vào bước — giờ nhìn {n} chỗ",
    "update.title": "Phiên bản",
    "update.check": "Kiểm tra bản mới",
    "update.checking": "Đang kiểm tra…",
    "update.current": "Đang dùng bản mới nhất.",
    "update.newer": "Có bản {version} — bấm Cài bản mới, Tampermonkey sẽ hiện trang cài.",
    "update.badge": "có {version}",
    "update.failed": "Không kiểm tra được — có thể mất mạng.",
    "update.install": "Cài bản mới",
    "update.hint": "Đọc thẳng bản đã phát hành trên GitHub, không qua bộ đếm giờ của Tampermonkey — nên vừa phát hành là thấy ngay. Cài xong nhớ tải lại trang game.",
    "update.reload": "Tải lại trang game",
    "update.installing": "Cài xong trong tab Tampermonkey rồi thì bấm Tải lại trang game — script chỉ đổi khi trang nạp lại."
  };

  // src/i18n/en.js
  var en_default = {
    "app.name": "BHB",
    "task.runAll": "Run all",
    "task.script": "Custom",
    "hud.idle": "idle",
    "tab.tasks": "Run",
    "tab.steps": "Steps",
    "tab.screens": "Screens",
    "tab.settings": "Settings",
    "tab.log": "Log",
    "tab.help": "?",
    "panel.close": "Close",
    "overlay.speed": "Speed",
    "overlay.canvas": "Canvas",
    "overlay.autoStop": "Auto-stop in",
    "overlay.steps": "Steps",
    "overlay.noSteps": "No steps yet. Hover a button in the game, then hit Capture.",
    "overlay.needsRecapture": "Captured before sizes were recorded — recapture it",
    "step.defaultLabel": "Step {n}",
    "steps.capture": "Capture a step at the cursor",
    "steps.captureHint": "Hover a button in the game and press. The resting colour is read for you, and the button is then clicked for real, so the game moves on exactly as the step will drive it.",
    "steps.unnamed": "(unnamed)",
    "steps.enable": "Enable",
    "steps.disable": "Disable",
    "steps.moveUp": "Move up (runs earlier)",
    "steps.moveDown": "Move down",
    "steps.screenGate": "Only fire on this screen",
    "steps.anywhere": "Anywhere",
    "steps.activity": "Which activity this step belongs to",
    "steps.loose": "Custom steps only",
    "steps.noActivity": "Custom",
    "steps.moveAll": "Move the steps shown to…",
    "steps.allSteps": "All steps",
    "steps.filter": "Show only one activity",
    "steps.delete": "Delete",
    "screens.title": "Screens",
    "screens.empty": "No screens yet. Capture one so the bot knows where it is.",
    "screens.capture": "Capture a screen anchor",
    "screens.captureHint": "The panel steps aside; drag a box around something only this screen shows. Esc cancels.",
    "screens.addAnchor": "Add another anchor",
    "screens.unnamed": "(unnamed)",
    "screens.unknown": "unknown",
    "screens.anchors": "Anchors",
    "screens.stopsTask": "Out of resources — stop the task here",
    "screens.ratioHint": "Share of samples matching right now",
    "screen.defaultName": "Screen {n}",
    "queue.title": "Activity queue",
    "queue.start": "Run all activities",
    "queue.stop": "Stop",
    "queue.round": "round {n}",
    "queue.stepCount": "Steps tagged to this activity",
    "queue.closeAfterRound": "Close the game after a full round",
    "queue.hint": "Runs top to bottom, skips what is out of resources, and starts again. Tag steps to an activity in the Steps tab.",
    "settings.profiles": "Profiles",
    "settings.profilesHint": "A profile holds its own steps, screens and queue — one per character. A second account just needs a second browser profile.",
    "settings.newProfile": "New",
    "settings.newProfileName": "New profile",
    "settings.duplicate": "Duplicate",
    "settings.rename": "Rename",
    "settings.renamePrompt": "Name this profile",
    "settings.delete": "Delete",
    "settings.behaviour": "Behaviour",
    "settings.watchdog": "Reload the game when it stops responding",
    "settings.watchdogHint": "Without this the bot just stops after three idle minutes. With it, the page reloads and the task starts again — up to three times before it gives up.",
    "settings.reloads": "reloaded {n}×",
    "settings.keepAlive": "Keep running when the window is covered",
    "settings.keepAliveHint": "A window covered edge to edge stops being painted, and the game stops with it. This drives the game loop by hand instead. Takes effect after a reload.",
    "settings.sizeBadge": "Show the canvas size in the corner",
    "settings.absoluteCoords": "Use raw coordinates (do not rescale steps)",
    "settings.language": "Language",
    "settings.transfer": "Export / import",
    "settings.transferHint": "Paste a profile export here, then press Import.",
    "settings.export": "Export",
    "settings.import": "Import",
    "settings.importFailed": "Import failed",
    "tasks.target": "What Run starts",
    "tasks.run": "Run",
    "tasks.stop": "Stop",
    "tasks.noLoose": "No step belongs to Custom — capture one, or move a set here",
    "tasks.runAllLocked": "Not usable yet: no activity has any steps. Capture one in the Steps tab and tag it to an activity.",
    "tasks.runAllReady": "Ready: {n} activities have steps",
    "queue.inSettings": "The order and the on/off switches live in the Settings tab.",
    "steps.next": "The step the bot is waiting for",
    "log.resync": "Lost the thread — picking up at {label}",
    "size.same": "The framebuffer the game draws into — steps store their coordinates in it",
    "size.scaled": "Framebuffer size → displayed size. They differ when the game is being scaled",
    "steps.legacyBadge": "recapture",
    "steps.legacyWarning": "{n} steps were captured without a canvas size, so they cannot be rescaled — resize the window and they click the wrong place. Recapture each one to fix it.",
    "log.title": "Activity",
    "log.empty": "Nothing yet. Start a task to see what the bot does.",
    "log.clear": "Clear",
    "log.clicked": "Clicked {label}",
    "log.busy": "Matched {label}, busy",
    "log.screen": "Screen: {label}",
    "log.resource": "Out of resources at {label} — stopped",
    "log.activity": "Queue → {label}",
    "log.hang": "{label} stopped responding — reloading",
    "log.taskStarted": "Started {task}",
    "log.taskStopped": "Stopped {task}",
    "help.sectionAuto": "Automation",
    "help.sectionSteps": "Steps",
    "help.sectionUi": "Interface",
    "help.sectionSpeed": "Speed",
    "help.run": "Start or stop whatever the Run tab is set to",
    "help.capture": "Capture a step at the cursor",
    "help.togglePanel": "Open/close the control panel",
    "help.speedUp": "Speed up (next stop)",
    "help.speedDown": "Slow down (previous stop)",
    "help.footer": "Stops itself after 3 minutes without a click",
    "msg.noCanvas": "no canvas found",
    "msg.noWebgl": "no WebGL context",
    "msg.noMousePosition": "no cursor position yet",
    "msg.outsideCanvas": "cursor is outside the canvas",
    "msg.anchorCaptured": "anchor {n} captured for {name}",
    "msg.stepCaptured": "captured a step at ({x}, {y}) — {hex}",
    "msg.stepUnstable": "captured a step at ({x}, {y}) — {hex}, but the colour here keeps changing (an animated icon?) so the step may miss",
    "screens.notify": "Send an alert when this screen appears (rare drop, legendary familiar)",
    "log.notify": "Saw {label} — alert sent",
    "stats.title": "Session stats",
    "stats.reset": "Reset",
    "stats.since": "Since {time}",
    "stats.running": "Running time",
    "stats.clicks": "Clicks",
    "stats.rounds": "Queue rounds",
    "stats.drops": "Alerts sent",
    "stats.resyncs": "Resyncs",
    "stats.hangs": "Hangs reloaded",
    "stats.byActivity": "By activity",
    "stats.colClicks": "clicks",
    "stats.colVisits": "visits",
    "stats.colSpent": "spent",
    "stats.empty": "No activity has run yet.",
    "notify.title": "Alerts",
    "notify.enabled": "Send alerts to Discord / Telegram",
    "notify.withShot": "Attach a screenshot of the game",
    "notify.discord": "Discord webhook URL",
    "notify.telegramToken": "Telegram bot token",
    "notify.telegramChat": "Telegram chat ID",
    "notify.events": "Alert on",
    "notify.event.notify": "A screen flagged for alerts is seen",
    "notify.event.resource": "Out of resources",
    "notify.event.hang": "The game hangs and is reloaded",
    "notify.event.task": "A task starts or stops",
    "notify.test": "Send a test",
    "notify.testText": "BHB: test alert",
    "notify.testSent": "Sent — check your channel",
    "notify.testFailed": "Failed — check the webhook/token",
    "notify.hint": "One channel is enough: paste a Discord webhook, or both the Telegram token and chat ID. Each kind of alert goes out at most once a minute.",
    "notify.noTarget": "No channel yet — paste a webhook or token below.",
    "msg.notify": "Alert sent: {label}",
    "toast.captured": "✓ captured: {label}",
    "toast.capturedUnstable": "⚠ captured, but the colour here keeps changing",
    "steps.armCapture": "Capture mode — enables the X key",
    "steps.armHint": "Switch this off once you are done: X sits beside the keys that drive the bot, and leaving it live invites a stray press mid-fight. The button above always works.",
    "msg.captureDisarmed": "the X key is off — switch capture mode on in the Steps tab",
    "steps.dryRun": "▷ Dry run",
    "steps.dryRunStop": "■ Stop the dry run",
    "steps.pinMarkers": "Show every marker",
    "steps.dryRunHint": "A dry run walks the list and scores each step against the frame on screen — ✓ matches, ✗ does not, ⊘ belongs to another screen. It clicks nothing, so it is safe at any time. Otherwise a marker appears only while you hover its row.",
    "probe.title": "Resolution probes",
    "probe.defaultName": "Probe {n}",
    "probe.capture": "＋ Drop a probe",
    "probe.capturing": "Point at the button you care about, then press X",
    "probe.cancel": "Cancel",
    "probe.pin": "Show crosshairs over the game",
    "probe.clear": "Clear all",
    "probe.empty": "No probes yet.",
    "probe.none": "none",
    "probe.count": "{n} probes",
    "probe.captured": "captured at",
    "probe.now": "now",
    "probe.unknown": "unreadable",
    "probe.aspectWarn": "The aspect ratio has changed since capture ({before} → {after}). If the middle probe still lands but the corner ones drift, the game letterboxes rather than stretches.",
    "probe.hint": "Drop a probe on a few buttons you rely on — four corners and one in the middle is enough. Then change the resolution in the game’s own settings and come back: the crosshairs show where the bot would now click, and the Δ column shows how far the colour drifted. A Δ under the colour tolerance is a match. These are measurements, so they stay out of your profile export.",
    "toast.probeCaptured": "✓ probe: {label}",
    "lock.title": "Canvas size lock (experimental)",
    "lock.enabled": "Pin the game to a fixed size",
    "lock.hint": "The game then renders at 640×400 whatever the window does, so the colours the bot reads are identical on every machine — which is what makes a step set shareable. A smaller window scales the display down to fit and the coordinates still hold. Switch it off and the game resizes with the window as before.",
    "help.closePanel": "Close the control panel",
    "settings.onCount": "{n}/{total} on",
    "settings.queueCount": "{n} activities",
    "settings.on": "on",
    "settings.off": "off",
    "steps.restHint": "Seconds to sit still after this step clicks — for the button that starts a Dungeon or Raid run, so the bot stops looking while the fight is on. 0 means no rest.",
    "queue.runSolo": "Run this activity on its own",
    "queue.stopSolo": "Stop",
    "queue.noSteps": "No steps are tagged to this activity yet",
    "help.speedReset": "Back to normal speed (1×)",
    "steps.kindClick": "Click",
    "steps.kindOptional": "Click if present",
    "steps.kindWait": "Wait until gone",
    "steps.behaviourHint": "Click: click when the colour shows, wait otherwise. Click if present: skip straight on when it does not — for a box like Private that may already be ticked. Wait until gone: hold here while the colour is there — for waiting on a party to fill before Start.",
    "steps.addPlace": "Watch one more place (the panel steps aside; hover and press X)",
    "steps.placeCount": "How many places this step watches",
    "steps.maxMatchesHint": "Hold while MORE than this many places still show the colour. Four invite buttons with this at 2 means wait for a third player, whichever seats they take.",
    "msg.placeAdded": "place added — the step now watches {n}",
    "update.title": "Version",
    "update.check": "Check for a new build",
    "update.checking": "Checking…",
    "update.current": "This is the latest build.",
    "update.newer": "{version} is out — press Install and Tampermonkey takes it from there.",
    "update.badge": "{version} out",
    "update.failed": "Could not check — the network, most likely.",
    "update.install": "Install it",
    "update.hint": "Reads the published build on GitHub directly rather than waiting on Tampermonkey's own timer, so a release shows up the moment it lands. Reload the game page after installing.",
    "update.reload": "Reload the game",
    "update.installing": "Once Tampermonkey has installed it, press Reload — a userscript only swaps in on a fresh page load."
  };

  // src/i18n/index.js
  var BUNDLES = { vi: vi_default, en: en_default };
  var active = vi_default;
  var activeCode = "vi";
  function setLanguage(code) {
    active = BUNDLES[code] || vi_default;
    activeCode = BUNDLES[code] ? code : "vi";
  }
  function getLanguage() {
    return activeCode;
  }
  function t(key, params) {
    const template = active[key] ?? key;
    if (!params) {
      return template;
    }
    return template.replace(
      /\{(\w+)\}/g,
      (match, name) => name in params ? String(params[name]) : match
    );
  }

  // src/bot/step-editor.js
  var REPAINT_FRAMES = 2;
  var SETTLE_MAX_FRAMES = 20;
  var SETTLE_TOLERANCE = 4;
  function nextFrame() {
    return new Promise((resolve) => realRequestAnimationFrame(() => resolve()));
  }
  async function readSettledPixel(gl, point) {
    let previous = null;
    for (let frame = 0; frame < SETTLE_MAX_FRAMES; frame += 1) {
      await nextFrame();
      const pixel = readPixel(gl, point.x, point.y);
      if (!pixel) {
        return { pixel: null, isSettled: false };
      }
      if (previous && frame + 1 >= REPAINT_FRAMES && colorMatches(pixel, previous, SETTLE_TOLERANCE)) {
        return { pixel, isSettled: true };
      }
      previous = pixel;
    }
    return { pixel: previous, isSettled: false };
  }
  function createStepEditor(deps) {
    let capturing = false;
    trackCursor();
    async function captureAtCursor(intoStepId = null) {
      if (capturing) {
        return null;
      }
      const target = getRenderTarget();
      if (!target) {
        deps.report(t("msg.noCanvas"));
        return null;
      }
      const cursor = getCursor();
      if (!cursor) {
        deps.report(t("msg.noMousePosition"));
        return null;
      }
      const { clientX: cursorX2, clientY: cursorY2 } = cursor;
      if (!isInsideCanvas(target.canvas, cursorX2, cursorY2)) {
        deps.report(t("msg.outsideCanvas"));
        return null;
      }
      capturing = true;
      try {
        const { canvas, gl } = target;
        const point = clientToBuffer(canvas, cursorX2, cursorY2);
        const buffer = getBufferSize(canvas);
        const hovered = readPixel(gl, point.x, point.y);
        const corner = bufferToClient(canvas, HOVER_RESET_POINT.x, HOVER_RESET_POINT.y);
        dispatchMoveTo(canvas, corner.clientX, corner.clientY);
        const settled = await readSettledPixel(gl, point);
        const resting = settled.pixel;
        dispatchMoveTo(canvas, cursorX2, cursorY2);
        if (!resting) {
          deps.report(t("msg.noWebgl"));
          return null;
        }
        const size = { bw: buffer.width, bh: buffer.height };
        const restingHex = rgbToHex(resting);
        const hoveredHex = hovered ? rgbToHex(hovered) : null;
        const points = [{ ...point, ...size }];
        if (hoveredHex && hoveredHex !== restingHex) {
          points.push({ ...point, ...size, hex: hoveredHex });
        }
        const steps = deps.getSteps();
        const existing = intoStepId ? find(intoStepId) : null;
        let step;
        if (existing) {
          existing.points.push(...points);
          step = existing;
        } else {
          step = createStep({
            label: t("step.defaultLabel", { n: steps.length + 1 }),
            points,
            hex: restingHex,
            activity: deps.getCaptureActivity ? deps.getCaptureActivity() : null
          });
          steps.push(step);
        }
        deps.persist();
        if (step.kind === StepKind.CLICK) {
          dispatchClickAt(canvas, cursorX2, cursorY2);
        }
        deps.report(
          settled.isSettled ? t("msg.stepCaptured", { x: point.x, y: point.y, hex: restingHex }) : t("msg.stepUnstable", { x: point.x, y: point.y, hex: restingHex })
        );
        if (deps.onCaptured) {
          deps.onCaptured({ step, clientX: cursorX2, clientY: cursorY2, isSettled: settled.isSettled });
        }
        return step;
      } finally {
        capturing = false;
      }
    }
    function find(stepId) {
      return deps.getSteps().find((step) => step.id === stepId) || null;
    }
    function rename(stepId, label) {
      const step = find(stepId);
      if (!step) {
        return;
      }
      step.label = label;
      deps.persist();
    }
    function setEnabled(stepId, enabled) {
      const step = find(stepId);
      if (!step) {
        return;
      }
      step.enabled = enabled;
      deps.persist();
    }
    function setScreens(stepId, screenIds) {
      const step = find(stepId);
      if (!step) {
        return;
      }
      step.screens = screenIds;
      deps.persist();
    }
    function setBehaviour(stepId, { kind, optional }) {
      const step = find(stepId);
      if (!step) {
        return;
      }
      step.kind = kind === StepKind.WAIT ? StepKind.WAIT : StepKind.CLICK;
      step.optional = step.kind === StepKind.CLICK && optional === true;
      deps.persist();
    }
    function setMaxMatches(stepId, count) {
      const step = find(stepId);
      if (!step) {
        return;
      }
      step.maxMatches = Math.max(0, Math.min(20, Math.round(Number(count) || 0)));
      deps.persist();
    }
    function removePlace(stepId, placeIndex) {
      const step = find(stepId);
      if (!step) {
        return;
      }
      const places = pointsByPlace(step);
      const doomed = places[placeIndex];
      if (!doomed || places.length <= 1) {
        return;
      }
      step.points = step.points.filter((point) => !doomed.includes(point));
      deps.persist();
    }
    function setRest(stepId, seconds) {
      const step = find(stepId);
      if (!step) {
        return;
      }
      step.restSec = Math.max(0, Math.min(600, Math.round(Number(seconds) || 0)));
      deps.persist();
    }
    function setActivity(stepId, activityId) {
      const step = find(stepId);
      if (!step) {
        return;
      }
      step.activity = activityId;
      deps.persist();
    }
    function remove(stepId) {
      const steps = deps.getSteps();
      const index = steps.findIndex((step) => step.id === stepId);
      if (index === -1) {
        return;
      }
      steps.splice(index, 1);
      deps.persist();
    }
    function move(stepId, delta) {
      const steps = deps.getSteps();
      const from = steps.findIndex((step2) => step2.id === stepId);
      const to = from + delta;
      if (from === -1 || to < 0 || to >= steps.length) {
        return;
      }
      const [step] = steps.splice(from, 1);
      steps.splice(to, 0, step);
      deps.persist();
    }
    return {
      captureAtCursor,
      rename,
      setEnabled,
      setScreens,
      setRest,
      setBehaviour,
      setMaxMatches,
      removePlace,
      setActivity,
      remove,
      move
    };
  }

  // src/bot/screen-editor.js
  function createScreenEditor(deps) {
    function find(screenId) {
      return deps.getScreens().find((screen) => screen.id === screenId) || null;
    }
    function captureAnchor(rect, screenId = null) {
      const target = getRenderTarget();
      if (!target) {
        deps.report(t("msg.noCanvas"));
        return null;
      }
      const { canvas, gl } = target;
      const origin = clientToBuffer(canvas, rect.left, rect.top + rect.height);
      const far = clientToBuffer(canvas, rect.left + rect.width, rect.top);
      const buffer = getBufferSize(canvas);
      const fingerprint = captureFingerprint(gl, {
        x: origin.x,
        y: origin.y,
        w: Math.max(1, far.x - origin.x),
        h: Math.max(1, far.y - origin.y),
        bw: buffer.width,
        bh: buffer.height
      });
      if (!fingerprint) {
        deps.report(t("msg.noWebgl"));
        return null;
      }
      const screens = deps.getScreens();
      let screen = screenId ? find(screenId) : null;
      if (!screen) {
        screen = createScreen({ name: t("screen.defaultName", { n: screens.length + 1 }) });
        screens.push(screen);
      }
      screen.anchors.push(fingerprint);
      deps.persist();
      deps.report(t("msg.anchorCaptured", { name: screen.name, n: screen.anchors.length }));
      return screen;
    }
    function rename(screenId, name) {
      const screen = find(screenId);
      if (!screen) {
        return;
      }
      screen.name = name;
      deps.persist();
    }
    function setStopsTask(screenId, stopsTask) {
      const screen = find(screenId);
      if (!screen) {
        return;
      }
      screen.stopsTask = stopsTask;
      deps.persist();
    }
    function setNotify(screenId, notify) {
      const screen = find(screenId);
      if (!screen) {
        return;
      }
      screen.notify = notify;
      deps.persist();
    }
    function setMinRatio(screenId, minRatio) {
      const screen = find(screenId);
      if (!screen) {
        return;
      }
      screen.minRatio = Math.min(1, Math.max(0, minRatio));
      deps.persist();
    }
    function removeAnchor(screenId, index) {
      const screen = find(screenId);
      if (!screen || index < 0 || index >= screen.anchors.length) {
        return;
      }
      screen.anchors.splice(index, 1);
      deps.persist();
    }
    function remove(screenId) {
      const screens = deps.getScreens();
      const index = screens.findIndex((screen) => screen.id === screenId);
      if (index === -1) {
        return;
      }
      screens.splice(index, 1);
      deps.persist();
    }
    function move(screenId, delta) {
      const screens = deps.getScreens();
      const from = screens.findIndex((screen2) => screen2.id === screenId);
      const to = from + delta;
      if (from === -1 || to < 0 || to >= screens.length) {
        return;
      }
      const [screen] = screens.splice(from, 1);
      screens.splice(to, 0, screen);
      deps.persist();
    }
    function probe(screenId) {
      const screen = find(screenId);
      const target = getRenderTarget();
      if (!screen || !target) {
        return null;
      }
      return scoreScreen(target.gl, screen, getBufferSize(target.canvas), deps.getScaleMode());
    }
    return {
      captureAnchor,
      rename,
      setStopsTask,
      setNotify,
      setMinRatio,
      removeAnchor,
      remove,
      move,
      probe
    };
  }

  // src/bot/queue-editor.js
  function createQueueEditor(deps) {
    function setEnabled(activityId, enabled) {
      const activity = deps.getActivities().find((entry) => entry.id === activityId);
      if (!activity) {
        return;
      }
      activity.enabled = enabled;
      deps.persist();
    }
    function move(activityId, delta) {
      const activities = deps.getActivities();
      const from = activities.findIndex((entry) => entry.id === activityId);
      const to = from + delta;
      if (from === -1 || to < 0 || to >= activities.length) {
        return;
      }
      const [activity] = activities.splice(from, 1);
      activities.splice(to, 0, activity);
      deps.persist();
    }
    return { setEnabled, move };
  }

  // src/bot/dry-run.js
  function scoreStep(step, gl, buffer, scaleMode, screenId) {
    if (!step.enabled) {
      return "off";
    }
    if (!isStepReady(step)) {
      return "empty";
    }
    if (!stepAllowedOn(step, screenId)) {
      return "gated";
    }
    for (const storedPoint of step.points) {
      const hit = matchPoint(
        gl,
        storedPoint,
        colorForPoint(step, storedPoint),
        buffer,
        scaleMode,
        step.tolerance
      );
      if (hit.matched) {
        return step.kind === StepKind.WAIT ? "waiting" : "match";
      }
    }
    return step.kind === StepKind.WAIT ? "match" : "miss";
  }
  function scoreSteps(steps, target, scaleMode, screenId) {
    if (!target) {
      return [];
    }
    const buffer = getBufferSize(target.canvas);
    return steps.map((step) => ({
      stepId: step.id,
      verdict: scoreStep(step, target.gl, buffer, scaleMode, screenId)
    }));
  }

  // src/bot/dry-run-runner.js
  function createDryRunner(deps) {
    let timer = null;
    function clear() {
      if (timer !== null) {
        realClearTimeout(timer);
        timer = null;
      }
    }
    function isRunning() {
      return timer !== null;
    }
    function start2() {
      clear();
      const steps = deps.getSteps();
      const target = getRenderTarget();
      if (steps.length === 0 || !target) {
        deps.onTick(null);
        return false;
      }
      const screen = detectScreen(
        target.gl,
        deps.getScreens(),
        getBufferSize(target.canvas),
        deps.getScaleMode()
      );
      const scored = scoreSteps(steps, target, deps.getScaleMode(), screen ? screen.id : null);
      const scores = {};
      for (const entry of scored) {
        scores[entry.stepId] = entry.verdict;
      }
      let index = 0;
      const advance = () => {
        if (index >= steps.length) {
          stop();
          return;
        }
        deps.onTick({ index, scores });
        index += 1;
        timer = realSetTimeout(advance, DRY_RUN_STEP_MS);
      };
      advance();
      return true;
    }
    function stop() {
      clear();
      deps.onTick(null);
    }
    return { start: start2, stop, isRunning };
  }

  // src/ui/styles.js
  var CSS = `
.bhb-hud, .bhb-panel, .bhb-markers, .bhb-probes, .bhb-flash, .bhb-drag, .bhb-size, .bhb-toast {
  --bhb-bg: #12141c;
  --bhb-bg-soft: #1a1d29;
  --bhb-line: rgba(255, 255, 255, .09);
  --bhb-text: #e6e8f0;
  --bhb-dim: #b3bacd;
  --bhb-accent: #7c5cff;
  /* Same colour in channels, because a glow needs to fade it. */
  --bhb-accent-rgb: 124, 92, 255;
  --bhb-cyan: #22d3ee;
  --bhb-live: #3ddc97;
  --bhb-warn: #ffb457;
  --bhb-danger: #ff6b81;
  --bhb-font: ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif;
  --bhb-mono: ui-monospace, "SF Mono", Consolas, monospace;

  /* One type scale for the whole panel. Anything that reaches for a size not
     on this list is what let 14 different sizes accumulate here before. */
  --bhb-fs-xs: 11px;   /* hotkeys, column headers, the smallest meta */
  --bhb-fs-sm: 12px;   /* notes, secondary text */
  --bhb-fs-md: 13px;   /* row text, task names, inputs */
  --bhb-fs-lg: 15px;   /* panel title, stat values */
  --bhb-fs-xl: 17px;   /* the one number a tile exists to show */
  --bhb-fs-2xl: 20px;  /* a glyph that is the whole button, like − and + */

  /* Below this a control is fiddly to hit, whatever it looks like. */
  --bhb-hit: 28px;

  position: fixed;
  z-index: ${Z_TOP};
  /* Without this the browser draws selects, scrollbars and carets from the
     light palette, which looks pasted onto a dark panel. */
  color-scheme: dark;
  box-sizing: border-box;
  color: var(--bhb-text);
  font-family: var(--bhb-font);
  user-select: none;
}
.bhb-hud *, .bhb-panel *, .bhb-markers *, .bhb-probes *, .bhb-drag * { box-sizing: border-box; }
.bhb-mono { font-family: var(--bhb-mono); font-variant-numeric: tabular-nums; }

/* --- HUD ---------------------------------------------------------------- */

.bhb-hud {
  top: 14px; right: 14px;
  display: flex; align-items: center; gap: 9px;
  padding: 7px 13px;
  background: linear-gradient(180deg, rgba(26, 29, 41, .96), rgba(18, 20, 28, .96));
  border: 1px solid rgba(var(--bhb-accent-rgb), .30);
  border-radius: 999px;
  box-shadow:
    0 6px 22px rgba(0, 0, 0, .5),
    0 0 0 1px rgba(0, 0, 0, .5),
    0 0 16px rgba(var(--bhb-accent-rgb), .18);
  font-size: var(--bhb-fs-md); line-height: 1;
  cursor: pointer;
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  transition: opacity .45s ease, box-shadow .2s ease;
}
/* Faded out it must still answer: is it running, and how fast? */
.bhb-hud > * { transition: opacity .45s ease; }
.bhb-hud--dim {
  background: linear-gradient(180deg, rgba(26, 29, 41, .30), rgba(18, 20, 28, .30));
  border-color: rgba(var(--bhb-accent-rgb), .10);
  box-shadow: none;
}
.bhb-hud--dim > * { opacity: .16; }
.bhb-hud--dim > .bhb-hud__dot,
.bhb-hud--dim > .bhb-hud__speed { opacity: 1; }
/* The plate is nearly gone underneath, so these two carry their own contrast. */
.bhb-hud--dim > .bhb-hud__speed { color: var(--bhb-text); text-shadow: 0 1px 3px rgba(0, 0, 0, .9); }
.bhb-hud--dim > .bhb-hud__dot { box-shadow: 0 0 0 2px rgba(0, 0, 0, .55); }
.bhb-hud:hover { opacity: 1; box-shadow: 0 6px 26px rgba(124, 92, 255, .35); }
.bhb-hud:hover > * { opacity: 1; }

.bhb-hud__dot {
  width: 8px; height: 8px; border-radius: 50%; flex: none;
  background: var(--bhb-dim);
}
.bhb-hud--live .bhb-hud__dot {
  background: var(--bhb-live);
  box-shadow: 0 0 0 0 rgba(61, 220, 151, .7);
  animation: bhb-pulse 1.8s ease-out infinite;
}
.bhb-hud__name { font-weight: 700; letter-spacing: .06em; }
.bhb-hud__ver { color: var(--bhb-dim); font-size: var(--bhb-fs-xs); }
.bhb-hud__sep { width: 1px; height: 13px; background: var(--bhb-line); }
.bhb-hud__task { font-weight: 600; font-size: var(--bhb-fs-sm); letter-spacing: .04em; }
.bhb-hud--live .bhb-hud__task { color: var(--bhb-live); }
.bhb-hud__speed {
  font-family: var(--bhb-mono); font-size: var(--bhb-fs-sm); color: var(--bhb-dim);
}
.bhb-hud__speed.is-boosted { color: var(--bhb-cyan); font-weight: 700; }
.bhb-hud__screen {
  padding: 1px 7px; border-radius: 999px;
  background: rgba(61, 220, 151, .14); color: var(--bhb-live);
  font-size: var(--bhb-fs-xs); letter-spacing: .04em;
}
.bhb-hud__msg {
  max-width: 190px; color: var(--bhb-dim); font-size: var(--bhb-fs-sm);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* --- Panel -------------------------------------------------------------- */

/* The HUD hides while this is open, so the panel takes the top of the screen. */
.bhb-panel {
  top: 14px; right: 14px;
  display: flex; flex-direction: column;
  width: 400px; max-width: calc(100vw - 28px);
  max-height: calc(100vh - 28px);
  background: var(--bhb-bg);
  /* The dark ring is the load-bearing one: a glow over the game's bright
     pixel art cancels itself out without something to sit against. */
  border: 1px solid rgba(var(--bhb-accent-rgb), .30);
  border-radius: 14px;
  box-shadow:
    0 18px 50px rgba(0, 0, 0, .6),
    0 0 0 1px rgba(0, 0, 0, .55),
    0 0 22px rgba(var(--bhb-accent-rgb), .20);
  font-size: var(--bhb-fs-md);
  overflow: hidden;
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
}

.bhb-panel__name { font-weight: 800; letter-spacing: .06em; font-size: var(--bhb-fs-xl); }
.bhb-panel__ver { color: var(--bhb-dim); font-size: var(--bhb-fs-sm); }

/* The tab strip is the title bar now, so it carries the frame's rounded top. */
.bhb-panel__profile {
  flex: none; max-width: 96px;
  padding: 3px 8px;
  background: rgba(255, 255, 255, .06);
  border: 1px solid var(--bhb-line); border-radius: 999px;
  color: var(--bhb-dim); font: inherit; font-size: var(--bhb-fs-xs);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  cursor: pointer;
}
.bhb-panel__profile:hover { color: var(--bhb-text); border-color: rgba(124, 92, 255, .5); }

.bhb-tabs {
  flex: none;
  display: flex; align-items: center; gap: 0; padding: 7px 9px 0;
  border-radius: 14px 14px 0 0;
  background: linear-gradient(90deg, rgba(124, 92, 255, .14), transparent 70%);
  background-color: var(--bhb-bg);
  /* Six tabs will not fit at every width, and a wrapped tab strip looks
     broken — so it scrolls sideways instead, with no visible scrollbar. */
  overflow-x: auto; scrollbar-width: none;
}
.bhb-tabs::-webkit-scrollbar { display: none; }
.bhb-tabbtn {
  flex: none; padding: 7px 5px 9px; white-space: nowrap;
  background: none; border: 0; border-bottom: 2px solid transparent;
  color: var(--bhb-text); font: inherit; font-size: var(--bhb-fs-md); font-weight: 600;
  cursor: pointer;
}
.bhb-tabbtn:hover { color: var(--bhb-warn); }
/* Help is not a place to work, so it reads as a mark rather than a label. */
.bhb-tabbtn--help { padding: 7px 7px 9px; font-size: var(--bhb-fs-md); }
/* Pushed to the far end: these are not places to go, they are the way out. */
.bhb-tabs__end {
  margin-left: auto; padding-bottom: 2px;
  display: flex; align-items: center; gap: 5px;
}
.bhb-tabbtn.is-active { color: var(--bhb-warn); border-bottom-color: var(--bhb-warn); }

.bhb-panel__body {
  /* min-height:0 is what lets a flex item actually scroll instead of growing. */
  flex: 1 1 auto; min-height: 0;
  padding: 12px 13px 14px; overflow-y: auto;
}
.bhb-tab { display: flex; flex-direction: column; gap: 13px; }

.bhb-label {
  color: var(--bhb-dim); font-size: var(--bhb-fs-sm);
  font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
}
.bhb-note { margin: 0; color: var(--bhb-dim); font-size: var(--bhb-fs-sm); line-height: 1.5; }
.bhb-note--warn { color: var(--bhb-warn); }
.bhb-empty { margin: 0; padding: 18px 0; color: var(--bhb-dim); font-size: var(--bhb-fs-sm); text-align: center; }
.bhb-field { display: flex; flex-direction: column; gap: 7px; }
.bhb-field__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }

/* --- Collapsible settings sections -------------------------------------- */

.bhb-tab--folds { gap: 5px; }

.bhb-fold {
  border: 1px solid var(--bhb-line); border-radius: 10px;
  background: var(--bhb-bg-soft);
  overflow: hidden;
}
.bhb-fold.is-open { border-color: rgba(124, 92, 255, .4); }

.bhb-fold__head {
  width: 100%;
  display: flex; align-items: center; gap: 8px;
  padding: 9px 11px;
  background: none; border: 0;
  color: var(--bhb-text); font: inherit; text-align: left;
  cursor: pointer;
}
.bhb-fold__head:hover { background: rgba(255, 255, 255, .04); }
.bhb-fold__head .bhb-label { flex: none; }
.bhb-fold__caret { color: var(--bhb-dim); font-size: var(--bhb-fs-xs); }

/* The state, readable without opening the section it belongs to. */
.bhb-fold__summary {
  flex: 1; min-width: 0;
  color: var(--bhb-dim); font-size: var(--bhb-fs-sm); text-align: right;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.bhb-fold__body { padding: 2px 11px 12px; }

/* --- Alerts ------------------------------------------------------------- */

.bhb-input {
  width: 100%; padding: 6px 8px;
  background: var(--bhb-bg-soft);
  border: 1px solid var(--bhb-line); border-radius: 7px;
  color: var(--bhb-text); font-family: var(--bhb-mono); font-size: var(--bhb-fs-sm);
}
.bhb-input:focus { outline: none; border-color: rgba(124, 92, 255, .6); }

/* --- Session stats ------------------------------------------------------ */

.bhb-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.bhb-stats__cell {
  display: flex; flex-direction: column; gap: 2px;
  padding: 7px 9px;
  background: var(--bhb-bg-soft);
  border: 1px solid var(--bhb-line); border-radius: 9px;
}
.bhb-stats__value { font-size: var(--bhb-fs-xl); font-weight: 700; }
.bhb-stats__label { color: var(--bhb-dim); font-size: var(--bhb-fs-xs); line-height: 1.3; }

.bhb-stats__rows { display: flex; flex-direction: column; gap: 1px; }
.bhb-stats__row {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 2px; border-bottom: 1px solid var(--bhb-line);
  font-size: var(--bhb-fs-sm);
}
.bhb-stats__name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bhb-stats__num { color: var(--bhb-dim); font-size: var(--bhb-fs-xs); }
.bhb-stats__num.is-spent { color: var(--bhb-warn); }

/* --- Task switches ------------------------------------------------------ */

.bhb-taskgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }

.bhb-task {
  display: flex; align-items: center; gap: 9px;
  padding: 9px 11px;
  background: var(--bhb-bg-soft);
  border: 1px solid var(--bhb-line); border-radius: 10px;
  color: var(--bhb-text); font: inherit; text-align: left;
  cursor: pointer;
  transition: border-color .15s ease, background .15s ease;
}
.bhb-task:hover { border-color: rgba(124, 92, 255, .5); }
.bhb-task.is-on { background: rgba(61, 220, 151, .1); border-color: rgba(61, 220, 151, .45); }

.bhb-task__switch {
  width: 28px; height: 16px; flex: none;
  background: #2b3040; border-radius: 999px; position: relative;
  transition: background .15s ease;
}
.bhb-task__switch::after {
  content: ''; position: absolute; top: 3px; left: 3px;
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--bhb-dim);
  transition: transform .15s ease, background .15s ease;
}
.bhb-task.is-on .bhb-task__switch { background: rgba(61, 220, 151, .3); }
.bhb-task.is-on .bhb-task__switch::after { transform: translateX(12px); background: var(--bhb-live); }

.bhb-task__name { flex: 1; font-weight: 600; font-size: var(--bhb-fs-md); }
.bhb-task__label { flex: 1; font-size: var(--bhb-fs-sm); line-height: 1.4; }
.bhb-task--wrap { align-items: flex-start; }
.bhb-task--wrap .bhb-task__switch { margin-top: 1px; }

/* A switch that cannot do anything yet says so instead of pretending. */
.bhb-task.is-locked { opacity: .62; cursor: not-allowed; }
.bhb-task.is-locked:hover { border-color: var(--bhb-line); }
.bhb-task__phase { color: var(--bhb-warn); font-size: var(--bhb-fs-xs); }

/* Tile variant: everything on one row — a tile this small needs no second. */
.bhb-task--tile { gap: 8px; padding: 8px 9px; }
.bhb-task--tile .bhb-task__name {
  flex: 1; min-width: 0;
  font-size: var(--bhb-fs-md); line-height: 1.2;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.bhb-task__warn { color: var(--bhb-warn); font-size: var(--bhb-fs-md); cursor: help; }

.bhb-kbd {
  min-width: 17px; padding: 2px 4px;
  background: rgba(255, 255, 255, .06);
  border: 1px solid var(--bhb-line); border-radius: 4px;
  color: var(--bhb-text); font-family: var(--bhb-mono); font-size: var(--bhb-fs-xs); text-align: center;
}

/*
 * Hand-built, because accent-color only colours the fill and leaves the rest
 * of the track to the browser — which paints it near-white, the brightest thing
 * on a dark panel, for a control that is not the point of the tab.
 *
 * The fill cannot be expressed in CSS alone, so the track is a gradient and
 * --bhb-fill carries the percentage; whoever owns the value sets it.
 */
.bhb-slider {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: var(--bhb-hit);
  background: transparent; cursor: pointer;
  --bhb-fill: 0%;
}
.bhb-slider::-webkit-slider-runnable-track {
  height: 6px; border-radius: 999px;
  background: linear-gradient(
    to right,
    var(--bhb-accent) 0 var(--bhb-fill),
    #262b3b var(--bhb-fill) 100%
  );
}
.bhb-slider::-moz-range-track {
  height: 6px; border-radius: 999px;
  background: linear-gradient(
    to right,
    var(--bhb-accent) 0 var(--bhb-fill),
    #262b3b var(--bhb-fill) 100%
  );
}
.bhb-slider::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 15px; height: 15px; margin-top: -4.5px;
  background: #eef0f7; border: 0; border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .55);
  transition: box-shadow .15s ease;
}
.bhb-slider::-moz-range-thumb {
  width: 15px; height: 15px;
  background: #eef0f7; border: 0; border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .55);
}
.bhb-slider:hover::-webkit-slider-thumb { box-shadow: 0 0 0 5px rgba(124, 92, 255, .28); }
.bhb-slider:hover::-moz-range-thumb { box-shadow: 0 0 0 5px rgba(124, 92, 255, .28); }
.bhb-slider:active::-webkit-slider-thumb { box-shadow: 0 0 0 7px rgba(124, 92, 255, .38); }
.bhb-speedrow { display: flex; align-items: center; gap: 8px; }
.bhb-speedrow .bhb-slider { flex: 1; min-width: 0; }
.bhb-speedticks {
  /* The inset clears the −/+ buttons, so a tick sits over the track it marks. */
  position: relative; height: 5px; margin-inline: calc(34px + 8px);
}
.bhb-speedticks__tick {
  position: absolute; top: 0;
  width: 1px; height: 5px;
  background: var(--bhb-line);
  transform: translateX(-50%);
}
/* 1× is the stop people aim for, so it is the one that reads as a stop. */
.bhb-speedticks__tick.is-major { height: 8px; width: 2px; background: var(--bhb-dim); }

.bhb-speedscale {
  position: relative; height: 15px;
  margin-top: 1px; margin-inline: calc(34px + 8px);
  color: var(--bhb-dim); font-size: var(--bhb-fs-sm);
}
.bhb-speedscale__mark { position: absolute; transform: translateX(-50%); white-space: nowrap; }
.bhb-speedscale__mark.is-unity { color: var(--bhb-text); font-weight: 700; }
.bhb-speed { font-family: var(--bhb-mono); font-size: var(--bhb-fs-lg); font-weight: 700; }
.bhb-speed.is-boosted { color: var(--bhb-cyan); }

.bhb-facts {
  display: grid; grid-template-columns: auto 1fr; gap: 5px 12px;
  margin: 0; padding-top: 11px; border-top: 1px solid var(--bhb-line);
}
.bhb-facts dt { color: var(--bhb-dim); font-size: var(--bhb-fs-xs); letter-spacing: .06em; text-transform: uppercase; }
.bhb-facts dd { margin: 0; color: var(--bhb-cyan); font-size: var(--bhb-fs-sm); text-align: right; }

/* --- Buttons ------------------------------------------------------------ */

.bhb-btn {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 8px 12px;
  background: var(--bhb-bg-soft);
  border: 1px solid var(--bhb-line); border-radius: 9px;
  color: var(--bhb-text); font: inherit; font-size: var(--bhb-fs-md); font-weight: 600;
  cursor: pointer;
}
.bhb-btn:hover { border-color: rgba(124, 92, 255, .55); }
.bhb-btn.is-busy { border-color: rgba(124, 92, 255, .6); color: var(--bhb-text); }
.bhb-btn--primary {
  background: linear-gradient(180deg, rgba(124, 92, 255, .9), rgba(98, 70, 230, .9));
  border-color: transparent;
}
.bhb-btn__dot {
  width: 7px; height: 7px; border-radius: 50%; background: #fff;
  animation: bhb-pulse 1.8s ease-out infinite;
}

.bhb-icon {
  width: var(--bhb-hit); height: var(--bhb-hit); flex: none;
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0; background: none; border: 0; border-radius: 6px;
  color: var(--bhb-dim); font: inherit; font-size: var(--bhb-fs-sm); line-height: 1;
  cursor: pointer;
}
/* Must follow .bhb-icon: same specificity, so order is what decides the size. */
.bhb-icon--wide {
  min-width: 34px;
  color: var(--bhb-text); font-size: var(--bhb-fs-2xl); font-weight: 700; line-height: 1;
}
.bhb-icon:hover { background: rgba(255, 255, 255, .08); color: var(--bhb-text); }
.bhb-icon.is-on { color: var(--bhb-live); }
.bhb-icon--danger:hover { background: rgba(255, 107, 129, .18); color: var(--bhb-danger); }

/* --- Steps table -------------------------------------------------------- */

.bhb-steps { display: flex; flex-direction: column; gap: 3px; }
.bhb-step {
  display: flex; align-items: center; gap: 7px;
  padding: 6px 7px;
  border: 1px solid transparent; border-radius: 8px;
  cursor: pointer;
}
.bhb-step:hover, .bhb-step.is-hovered { background: var(--bhb-bg-soft); }
.bhb-step.is-selected { border-color: rgba(124, 92, 255, .6); background: rgba(124, 92, 255, .1); }
.bhb-step.is-off { opacity: .45; }
/* The step the runner is waiting for, so a stuck sequence is visible. */
.bhb-step.is-next { border-color: rgba(61, 220, 151, .5); }
.bhb-step.is-next .bhb-step__n { color: var(--bhb-live); }

.bhb-rule__n { width: 14px; color: var(--bhb-dim); font-family: var(--bhb-mono); font-size: var(--bhb-fs-xs); }
.bhb-rule__swatch {
  width: 13px; height: 13px; flex: none;
  border: 1px solid rgba(255, 255, 255, .25); border-radius: 4px;
}
.bhb-rule__name {
  flex: 1; min-width: 0; padding: 3px 5px;
  background: none; border: 1px solid transparent; border-radius: 5px;
  color: var(--bhb-text); font: inherit; font-size: var(--bhb-fs-md);
}
.bhb-rule__name:hover { border-color: var(--bhb-line); }
.bhb-rule__name:focus { outline: none; border-color: var(--bhb-accent); background: #0d0f16; }
.bhb-rule__meta-coord { display: inline-flex; align-items: center; }
/* Seconds to sit still after a click; 0 reads as off. */
.bhb-rest {
  width: 46px; padding: 3px 5px;
  background: var(--bhb-bg-soft);
  border: 1px solid var(--bhb-line); border-radius: 6px;
  color: var(--bhb-dim); font-size: var(--bhb-fs-xs); text-align: right;
}
.bhb-rest:focus { outline: none; border-color: rgba(124, 92, 255, .6); color: var(--bhb-text); }

.bhb-rule__coord { color: var(--bhb-cyan); font-size: var(--bhb-fs-xs); }
/* A step that cannot be rescaled clicks the wrong place after any resize, so
   the mark is a badge rather than a glyph hiding at the end of a number. */
.bhb-rule__legacy {
  display: inline-flex; align-items: center; gap: 3px;
  margin-left: 5px; padding: 1px 5px;
  background: rgba(255, 180, 87, .16);
  border: 1px solid rgba(255, 180, 87, .5); border-radius: 5px;
  color: var(--bhb-warn); font-size: var(--bhb-fs-xs); font-weight: 700;
}
.bhb-rule__actions { display: flex; gap: 1px; margin-left: auto; }

/* A step carries a name, a place, an activity and a screen gate. On one line
   they crush each other, so the row is two: identity above, wiring below. */
.bhb-step--stacked { flex-direction: column; align-items: stretch; gap: 5px; }
.bhb-rule__main { display: flex; align-items: center; gap: 7px; }
.bhb-rule__meta { display: flex; align-items: center; gap: 6px; padding-left: 21px; }
.bhb-rule__meta .bhb-rule__gate { flex: 1; min-width: 0; max-width: none; }

/* --- Log ---------------------------------------------------------------- */

.bhb-log { display: flex; flex-direction: column; gap: 1px; max-height: 300px; overflow-y: auto; }
.bhb-log__row {
  display: flex; align-items: center; gap: 7px;
  padding: 4px 6px; border-radius: 6px; font-size: var(--bhb-fs-sm);
}
.bhb-log__row:nth-child(odd) { background: rgba(255, 255, 255, .025); }
.bhb-log__time { color: var(--bhb-dim); font-size: var(--bhb-fs-xs); }
.bhb-log__icon { width: 12px; text-align: center; color: var(--bhb-dim); }
.bhb-log__row--click .bhb-log__icon { color: var(--bhb-live); }
.bhb-log__row--task .bhb-log__icon { color: var(--bhb-accent); }
.bhb-log__text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bhb-log__coord { color: var(--bhb-dim); font-size: var(--bhb-fs-xs); }

/* --- Canvas size badge -------------------------------------------------- */

.bhb-size {
  right: 10px; bottom: 10px;
  padding: 3px 8px;
  background: rgba(18, 20, 28, .72);
  border: 1px solid var(--bhb-line); border-radius: 7px;
  color: var(--bhb-dim); font-size: var(--bhb-fs-xs);
  /* It sits over the game: taking a click here would be worse than no badge. */
  pointer-events: none;
  transition: opacity .25s ease, color .25s ease, border-color .25s ease;
}
.bhb-size--dim { opacity: .28; }
.bhb-size--near {
  opacity: 1;
  background: rgba(18, 20, 28, .92);
  border-color: rgba(124, 92, 255, .5);
  color: var(--bhb-text);
}

/* --- Probe layer -------------------------------------------------------- */

.bhb-probes { inset: 0; pointer-events: none; }

/* A crosshair, not a badge: a probe judges one pixel, and a badge would sit
   on top of the thing being judged. */
.bhb-probe {
  position: fixed;
  width: 21px; height: 21px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.bhb-probe::before, .bhb-probe::after {
  content: ''; position: absolute;
  background: var(--bhb-cyan);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .7);
}
.bhb-probe::before { left: 0; right: 0; top: 10px; height: 1px; }
.bhb-probe::after { top: 0; bottom: 0; left: 10px; width: 1px; }
.bhb-probe__dot {
  position: absolute; left: 7px; top: 7px;
  width: 7px; height: 7px; border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, .7);
}

.bhb-probe-table { display: flex; flex-direction: column; gap: 2px; }

.bhb-probe-row {
  display: grid;
  grid-template-columns: 1fr auto auto 14px 14px auto 20px;
  align-items: center; gap: 6px;
  padding: 3px 6px;
  background: rgba(255, 255, 255, .03);
  border-radius: 6px;
  font-size: var(--bhb-fs-xs);
}
.bhb-probe-row__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bhb-probe-row__size, .bhb-probe-row__pos { color: var(--bhb-dim); }
.bhb-probe-row__swatch {
  width: 14px; height: 14px; border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, .2);
}
.bhb-probe-row__delta.is-match { color: var(--bhb-live); }
.bhb-probe-row__delta.is-miss { color: var(--bhb-danger); }

/* --- Marker layer ------------------------------------------------------- */

.bhb-markers { inset: 0; pointer-events: none; }

.bhb-mark {
  position: fixed;
  display: flex; align-items: center; gap: 3px;
  padding: 2px 5px 2px 3px;
  transform: translate(-50%, -50%);
  background: rgba(18, 20, 28, .9);
  border: 1px solid var(--bhb-accent); border-radius: 999px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .5), 0 0 12px rgba(124, 92, 255, .45);
  pointer-events: auto; cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease;
}
.bhb-mark:hover, .bhb-mark--hovered {
  transform: translate(-50%, -50%) scale(1.25);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .5), 0 0 18px rgba(124, 92, 255, .8);
}
.bhb-mark--selected { border-color: var(--bhb-cyan); box-shadow: 0 0 16px rgba(34, 211, 238, .8); }
.bhb-mark--off { opacity: .4; border-color: var(--bhb-dim); }
.bhb-mark--legacy { border-color: var(--bhb-warn); }

/* Dry-run verdicts: what the matcher found, on the marker it found it on. */
.bhb-mark--match { border-color: var(--bhb-live); box-shadow: 0 0 0 2px rgba(61, 220, 151, .35); }
.bhb-mark--miss { border-color: var(--bhb-danger); opacity: .75; }
.bhb-mark--gated { border-color: var(--bhb-dim); opacity: .45; }
.bhb-mark--waiting { border-color: var(--bhb-warn); box-shadow: 0 0 0 2px rgba(255, 180, 87, .3); }
.bhb-mark--testing { transform: translate(-50%, -50%) scale(1.45); z-index: 1; }
.bhb-mark__n { color: var(--bhb-text); font-family: var(--bhb-mono); font-size: var(--bhb-fs-xs); font-weight: 700; }
.bhb-mark__swatch {
  width: 9px; height: 9px; border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, .5);
}

/* --- Screens & drag capture --------------------------------------------- */

/* Chrome draws its own select button whatever the background says, so the
   native control is turned off and the arrow drawn here instead. */
.bhb-select, .bhb-rule__gate {
  appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'><path d='M0 0h8L4 5z' fill='%237a8196'/></svg>");
  background-repeat: no-repeat; background-position: right 6px center;
  padding-right: 18px;
}
.bhb-select, .bhb-textarea {
  width: 100%; padding: 5px 18px 5px 7px;
  background-color: var(--bhb-bg-soft); color: var(--bhb-text);
  border: 1px solid var(--bhb-line); border-radius: 7px;
  font-family: var(--bhb-font); font-size: var(--bhb-fs-sm);
}
.bhb-textarea { height: 72px; resize: vertical; font-family: var(--bhb-mono); font-size: var(--bhb-fs-xs); }
.bhb-btnrow { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
.bhb-btn--small { flex: 1; min-width: 64px; padding: 6px 10px; font-size: var(--bhb-fs-sm); }
.bhb-queue__row.is-active { border-color: var(--bhb-live); }
.bhb-queue__row.is-spent { opacity: .45; }
.bhb-queue__state { width: 14px; text-align: center; color: var(--bhb-live); font-size: var(--bhb-fs-xs); }
.bhb-queue__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bhb-hud__activity {
  padding: 1px 7px; border-radius: 999px;
  background: rgba(124, 92, 255, .18); color: var(--bhb-accent);
  font-size: var(--bhb-fs-xs); letter-spacing: .04em;
}
.bhb-rule__gate {
  max-width: 120px; padding: 2px 18px 2px 5px;
  background-color: var(--bhb-bg-soft); color: var(--bhb-dim);
  border: 1px solid var(--bhb-line); border-radius: 6px;
  font-family: var(--bhb-font); font-size: var(--bhb-fs-xs);
}
.bhb-screen__wrap { display: flex; flex-direction: column; gap: 2px; }
.bhb-screen.is-active { border-color: var(--bhb-live); }
.bhb-screen.is-stopper .bhb-rule__n { color: var(--bhb-danger); }
.bhb-screen__now { color: var(--bhb-live); font-size: var(--bhb-fs-xs); }
.bhb-screen__state { width: 14px; text-align: center; color: var(--bhb-dim); }
.bhb-screen__state.is-seen { color: var(--bhb-live); }
.bhb-screen__tune { display: flex; align-items: center; gap: 8px; padding: 0 8px 6px; }
.bhb-slider--thin { flex: 1; height: 20px; }
.bhb-slider--thin::-webkit-slider-runnable-track { height: 4px; }
.bhb-slider--thin::-moz-range-track { height: 4px; }
.bhb-slider--thin::-webkit-slider-thumb { width: 12px; height: 12px; margin-top: -4px; }
.bhb-slider--thin::-moz-range-thumb { width: 12px; height: 12px; }
.bhb-icon.is-danger-on { color: var(--bhb-danger); }
.bhb-icon.is-notify-on { color: var(--bhb-warn); }

/* The drag layer is alive only while a capture is running. */
.bhb-drag { inset: 0; cursor: crosshair; pointer-events: auto; background: rgba(12, 14, 20, .25); }
.bhb-drag__box {
  display: none; position: fixed;
  border: 1px solid var(--bhb-cyan); background: rgba(34, 211, 238, .14);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .5);
}
.bhb-drag__hint {
  position: fixed; left: 50%; top: 14px; transform: translateX(-50%);
  padding: 4px 10px; border-radius: 999px;
  background: var(--bhb-bg); border: 1px solid var(--bhb-line);
  font-family: var(--bhb-mono); font-size: var(--bhb-fs-sm);
}

/* --- Help tab & flash --------------------------------------------------- */

.bhb-help { gap: 0; font-size: var(--bhb-fs-md); line-height: 1.8; }
.bhb-help__section {
  margin: 13px 0 3px;
  color: var(--bhb-accent); font-size: var(--bhb-fs-xs);
  font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
}
.bhb-help__entry { display: flex; justify-content: space-between; gap: 10px; }
.bhb-help__entry b { font-family: var(--bhb-mono); font-weight: 700; color: var(--bhb-cyan); }
.bhb-help__label { flex: 1; text-align: right; color: var(--bhb-dim); }
.bhb-help__footer {
  margin-top: 11px; padding-top: 8px; border-top: 1px solid var(--bhb-line);
  color: var(--bhb-dim); font-size: var(--bhb-fs-xs); text-align: center;
}

.bhb-flash {
  width: 22px; height: 22px; border-radius: 50%;
  transform: translate(-50%, -50%) scale(.4);
  border: 2px solid var(--bhb-cyan);
  box-shadow: 0 0 10px var(--bhb-cyan), 0 0 22px rgba(34, 211, 238, .55);
  pointer-events: none;
  transition: transform .35s cubic-bezier(.2, .8, .3, 1), opacity .35s ease-out;
}
.bhb-flash--out { transform: translate(-50%, -50%) scale(1.9); opacity: 0; }

/* --- Toast -------------------------------------------------------------- */

.bhb-toast {
  display: flex; align-items: center; gap: 7px;
  padding: 6px 11px;
  transform: translate(-50%, 6px);
  background: rgba(18, 20, 28, .96);
  border: 1px solid rgba(61, 220, 151, .55); border-radius: 999px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, .5);
  color: var(--bhb-text); font-size: var(--bhb-fs-sm); font-weight: 600;
  white-space: nowrap; pointer-events: none; opacity: 0;
  transition: opacity .3s ease, transform .3s cubic-bezier(.2, .8, .3, 1);
}
.bhb-toast--in { opacity: 1; transform: translate(-50%, 0); }
.bhb-toast--warn { border-color: rgba(255, 180, 87, .6); color: var(--bhb-warn); }
.bhb-toast__swatch {
  width: 13px; height: 13px; flex: none;
  border: 1px solid rgba(255, 255, 255, .35); border-radius: 4px;
}

@keyframes bhb-pulse {
  0% { box-shadow: 0 0 0 0 rgba(61, 220, 151, .55); }
  70% { box-shadow: 0 0 0 7px rgba(61, 220, 151, 0); }
  100% { box-shadow: 0 0 0 0 rgba(61, 220, 151, 0); }
}
`;
  var installed = false;
  function installStyles() {
    if (installed) {
      return;
    }
    const style = document.createElement("style");
    style.id = "bhb-styles";
    style.textContent = CSS;
    (document.head || document.documentElement).append(style);
    installed = true;
  }

  // src/ui/store.js
  var Tab = Object.freeze({
    TASKS: "tasks",
    STEPS: "steps",
    SCREENS: "screens",
    SETTINGS: "settings",
    LOG: "log",
    HELP: "help"
  });
  var LOG_LIMIT = 200;
  function createUiStore() {
    const emitter = createEmitter();
    const state = {
      panelOpen: false,
      tab: Tab.TASKS,
      /** @type {string | null} */
      selectedStepId: null,
      /** @type {string | null} step under the cursor, in the table or on canvas */
      hoveredStepId: null,
      /** @type {string | null} activity id shown in the steps table; null is all */
      stepFilter: null,
      /**
       * Whether the capture hotkey is armed.
       *
       * Off on every load, and deliberately not persisted: the key sits next to
       * the ones that drive the bot, and a session that starts armed is a stray
       * `0` mid-fight that captures whatever happened to be under the cursor.
       */
      isCaptureArmed: false,
      /**
       * A step waiting for one more place.
       *
       * The ＋ button lives in the panel, and the panel covers the game — so it
       * cannot capture on the spot. It steps aside and hands the next capture to
       * this step instead of a new one.
       *
       * @type {string | null}
       */
      pendingPlaceStepId: null,
      /** All markers at once; off by default, so the game stays readable. */
      areMarkersPinned: false,
      /**
       * Whether the next capture makes a probe instead of a step.
       *
       * The probe button lives in the panel, and the panel covers the game — so
       * it arms rather than captures, the same way the ＋ on a step does.
       */
      isAwaitingProbe: false,
      /** Probe crosshairs over the game, so a resize can be judged by eye. */
      areProbesPinned: false,
      /**
       * A dry run in progress: which step it is on, and what it found.
       *
       * @type {{ index: number, scores: Record<string, string> } | null}
       */
      dryRun: null,
      /** @type {object[]} newest first */
      log: []
    };
    const HIGHLIGHT_KEYS = /* @__PURE__ */ new Set(["selectedStepId", "hoveredStepId"]);
    function emit() {
      emitter.emit("change", state);
    }
    function patch(changes) {
      const changed = [];
      for (const [key, value] of Object.entries(changes)) {
        if (state[key] !== value) {
          state[key] = value;
          changed.push(key);
        }
      }
      if (changed.length === 0) {
        return false;
      }
      if (changed.every((key) => HIGHLIGHT_KEYS.has(key))) {
        emitter.emit("highlight", state);
      } else {
        emit();
      }
      return true;
    }
    return {
      get: () => state,
      subscribe: (handler) => emitter.on("change", handler),
      onHighlight: (handler) => emitter.on("highlight", handler),
      openPanel: () => patch({ panelOpen: true }),
      closePanel: () => patch({ panelOpen: false, hoveredStepId: null }),
      togglePanel: () => patch({ panelOpen: !state.panelOpen }),
      setTab: (tab) => patch({ tab, panelOpen: true }),
      setRuleFilter: (activityId) => patch({ stepFilter: activityId }),
      armCapture: (armed) => patch({ isCaptureArmed: armed }),
      awaitPlaceFor: (stepId) => patch({ pendingPlaceStepId: stepId }),
      pinMarkers: (pinned) => patch({ areMarkersPinned: pinned }),
      awaitProbe: (awaiting) => patch({ isAwaitingProbe: awaiting }),
      pinProbes: (pinned) => patch({ areProbesPinned: pinned }),
      /** @param {{ index: number, scores: Record<string, string> } | null} run */
      setDryRun(run) {
        state.dryRun = run;
        emit();
      },
      selectStep: (id) => patch({ selectedStepId: id }),
      hoverStep: (id) => patch({ hoveredStepId: id }),
      /** Drop any reference to a step that no longer exists. */
      forgetStep(id) {
        patch({
          selectedStepId: state.selectedStepId === id ? null : state.selectedStepId,
          hoveredStepId: state.hoveredStepId === id ? null : state.hoveredStepId
        });
      },
      /** @param {object} entry an engine action event */
      log(entry) {
        state.log.unshift(entry);
        if (state.log.length > LOG_LIMIT) {
          state.log.length = LOG_LIMIT;
        }
        emit();
      },
      clearLog() {
        if (state.log.length === 0) {
          return;
        }
        state.log = [];
        emit();
      },
      /**
       * Markers would swallow the game's clicks if they outlived the tab, and
       * drawing all of them all the time buried the game under numbers. They are
       * shown on demand: pinned, during a dry run, or under the cursor.
       */
      markersVisible() {
        if (!state.panelOpen || state.tab !== Tab.STEPS) {
          return false;
        }
        return state.areMarkersPinned || state.dryRun !== null || state.hoveredStepId !== null;
      },
      /**
       * Probes are shown while aiming at one, and while pinned. Unlike markers
       * they outlive the panel: the whole point is to still be on screen after
       * the game's resolution changed under them.
       */
      probesVisible() {
        return state.areProbesPinned || state.isAwaitingProbe;
      },
      /** Which steps the marker layer should draw, of the ones it could. */
      markerFilter() {
        if (state.areMarkersPinned || state.dryRun !== null) {
          return null;
        }
        return state.hoveredStepId;
      }
    };
  }

  // src/ui/dom.js
  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    if (props.class) {
      node.className = props.class;
    }
    if (props.text !== void 0) {
      node.textContent = props.text;
    }
    if (props.title) {
      node.title = props.title;
    }
    if (props.style) {
      Object.assign(node.style, props.style);
    }
    for (const child of children) {
      if (child === null || child === void 0) {
        continue;
      }
      node.append(child);
    }
    return node;
  }
  function mount(node) {
    (document.documentElement || document.body).append(node);
    return node;
  }

  // src/ui/hud.js
  var DIM_AFTER_MS = 4e3;
  function createHud(deps) {
    let node = null;
    let dimTimer = null;
    function ensureNode() {
      if (node) {
        return node;
      }
      node = mount(el("div", { class: "bhb-hud" }));
      node.addEventListener("click", () => deps.store.togglePanel());
      node.addEventListener("mouseenter", wake);
      node.addEventListener("mousemove", wake);
      return node;
    }
    function wake() {
      const target = ensureNode();
      target.classList.remove("bhb-hud--dim");
      if (dimTimer !== null) {
        realClearTimeout(dimTimer);
      }
      dimTimer = realSetTimeout(() => {
        target.classList.add("bhb-hud--dim");
      }, DIM_AFTER_MS);
    }
    function render() {
      const target = ensureNode();
      if (deps.store.get().panelOpen) {
        target.style.display = "none";
        return;
      }
      target.style.display = "";
      const engine = deps.getEngineState();
      const speed2 = getSpeed();
      const running = Boolean(engine.activeTask);
      target.className = `bhb-hud ${running ? "bhb-hud--live" : ""} ${target.classList.contains("bhb-hud--dim") ? "bhb-hud--dim" : ""}`;
      const parts = [
        el("span", { class: "bhb-hud__dot" }),
        el("span", { class: "bhb-hud__name", text: t("app.name") }),
        el("span", { class: "bhb-hud__ver", text: `v${VERSION}` }),
        el("span", { class: "bhb-hud__sep" }),
        el("span", {
          class: "bhb-hud__task",
          text: running ? t(`task.${engine.activeTask}`) : t("hud.idle")
        }),
        el("span", {
          class: `bhb-hud__speed ${speed2 > 1 ? "is-boosted" : ""}`,
          text: `${formatSpeed(speed2)}×`
        }),
        engine.activityName ? el("span", { class: "bhb-hud__activity", text: engine.activityName }) : null,
        engine.screenName ? el("span", { class: "bhb-hud__screen", text: engine.screenName }) : null,
        el("span", { class: "bhb-hud__msg", text: engine.lastMessage || "" })
      ].filter(Boolean);
      target.replaceChildren(...parts);
    }
    return { render, wake };
  }

  // src/ui/panel/tasks.js
  var speedControl = null;
  var isDraggingSpeed = false;
  function speedIsBeingDragged() {
    return isDraggingSpeed;
  }
  function updateSpeedDisplay() {
    if (!speedControl) {
      return;
    }
    const speed2 = getSpeed();
    const index = speedIndex(speed2);
    speedControl.slider.value = String(index);
    speedControl.slider.style.setProperty(
      "--bhb-fill",
      `${index / (SPEED_STEPS.length - 1) * 100}%`
    );
    speedControl.readout.textContent = `${formatSpeed(speed2)}×`;
    speedControl.readout.className = `bhb-speed ${speed2 > 1 ? "is-boosted" : ""}`;
  }
  var LABELLED_SPEEDS = [0.1, 1, 5, 10, 20];
  function describeTarget(deps, target) {
    const activities = deps.getActivities();
    const { taskId, activityId } = resolveRunTarget(target, activities);
    const steps = deps.getSteps();
    if (taskId === TaskId.RUN_ALL) {
      const ready = readyActivityCount(deps);
      return {
        taskId,
        activityId,
        isLocked: ready === 0,
        title: ready === 0 ? t("tasks.runAllLocked") : t("tasks.runAllReady", { n: ready })
      };
    }
    if (taskId === TaskId.SOLO) {
      const count = stepsForActivity(steps, activityId).length;
      return { taskId, activityId, isLocked: count === 0, title: count === 0 ? t("queue.noSteps") : "" };
    }
    const loose = steps.filter((step) => !step.activity).length;
    return { taskId, activityId, isLocked: loose === 0, title: loose === 0 ? t("tasks.noLoose") : "" };
  }
  function formatRemaining(ms) {
    const total = Math.floor(ms / 1e3);
    return `${Math.floor(total / 60)}m${String(total % 60).padStart(2, "0")}s`;
  }
  function describeCanvas() {
    const canvas = getCanvas();
    if (!canvas) {
      return "—";
    }
    return `${canvas.width}×${canvas.height} → ${Math.round(canvas.clientWidth)}×${Math.round(
      canvas.clientHeight
    )}`;
  }
  function readyActivityCount(deps) {
    const steps = deps.getSteps();
    return deps.getActivities().filter((activity) => activity.enabled && stepsForActivity(steps, activity.id).length > 0).length;
  }
  function renderTasksTab(deps) {
    const engine = deps.getEngineState();
    const speed2 = getSpeed();
    const target = deps.getRunTarget();
    const picked = describeTarget(deps, target);
    const chooser = el("select", { class: "bhb-rule__gate", title: t("tasks.target") });
    const script = el("option", { text: t("task.script") });
    script.value = TaskId.SCRIPT;
    chooser.append(script);
    for (const activity of deps.getActivities()) {
      const option = el("option", { text: activity.name });
      option.value = activity.id;
      chooser.append(option);
    }
    const all = el("option", { text: t("task.runAll") });
    all.value = TaskId.RUN_ALL;
    chooser.append(all);
    chooser.value = picked.taskId === TaskId.SOLO ? picked.activityId : picked.taskId;
    chooser.addEventListener("change", () => {
      deps.setRunTarget(chooser.value);
      deps.refresh();
    });
    const isOnTarget = engine.activeTask === picked.taskId && (picked.taskId !== TaskId.SOLO || engine.activity === picked.activityId);
    const phase = isOnTarget && picked.taskId === TaskId.RUN_ALL ? t("queue.round", { n: engine.round }) : "";
    const run = el("button", { class: `bhb-task bhb-task--tile ${isOnTarget ? "is-on" : ""}` }, [
      el("span", { class: "bhb-task__switch" }),
      el("span", { class: "bhb-task__name", text: t(isOnTarget ? "tasks.stop" : "tasks.run") }),
      phase ? el("span", { class: "bhb-task__phase", text: phase }) : null,
      el("span", { class: "bhb-kbd", text: keyLabel(Keys.RUN) })
    ]);
    run.addEventListener("click", () => {
      deps.runSelected();
      deps.refresh();
    });
    const warning = picked.isLocked && !isOnTarget ? el("p", { class: "bhb-note bhb-note--warn", text: picked.title }) : null;
    if (!speedControl) {
      const slider2 = el("input", { class: "bhb-slider" });
      slider2.type = "range";
      slider2.min = "0";
      slider2.max = String(SPEED_STEPS.length - 1);
      slider2.step = "1";
      slider2.addEventListener("input", () => {
        setSpeed(SPEED_STEPS[Number(slider2.value)]);
      });
      slider2.addEventListener("pointerdown", () => {
        isDraggingSpeed = true;
      });
      window.addEventListener("pointerup", () => {
        isDraggingSpeed = false;
      });
      window.addEventListener("pointercancel", () => {
        isDraggingSpeed = false;
      });
      speedControl = { slider: slider2, readout: el("span", { class: "bhb-speed" }) };
    }
    const { slider, readout } = speedControl;
    updateSpeedDisplay();
    function stopOffset(index) {
      return `${index / (SPEED_STEPS.length - 1) * 100}%`;
    }
    const ticks = el(
      "div",
      { class: "bhb-speedticks" },
      SPEED_STEPS.map(
        (stop, index) => el("span", {
          class: `bhb-speedticks__tick ${LABELLED_SPEEDS.includes(stop) ? "is-major" : ""}`,
          style: { left: stopOffset(index) }
        })
      )
    );
    const scale = el(
      "div",
      { class: "bhb-speedscale bhb-mono" },
      LABELLED_SPEEDS.map(
        (stop) => el("span", {
          class: `bhb-speedscale__mark ${stop === 1 ? "is-unity" : ""}`,
          text: `${formatSpeed(stop)}×`,
          style: { left: stopOffset(speedIndex(stop)) }
        })
      )
    );
    function nudge(direction, label) {
      const button = el("button", { class: "bhb-icon bhb-icon--wide", text: label });
      button.addEventListener("click", () => setSpeed(stepSpeed(getSpeed(), direction)));
      return button;
    }
    return el("div", { class: "bhb-tab" }, [
      el("div", { class: "bhb-field" }, [
        el("div", { class: "bhb-field__head" }, [
          el("span", { class: "bhb-label", text: t("tasks.target") }),
          chooser
        ]),
        run,
        warning
      ]),
      el("p", { class: "bhb-note", text: t("queue.inSettings") }),
      el("div", { class: "bhb-field" }, [
        el("div", { class: "bhb-field__head" }, [
          el("span", { class: "bhb-label", text: t("overlay.speed") }),
          readout
        ]),
        el("div", { class: "bhb-speedrow" }, [
          nudge(-1, "−"),
          slider,
          nudge(1, "+")
        ]),
        ticks,
        scale
      ]),
      el("dl", { class: "bhb-facts" }, [
        el("dt", { text: t("overlay.canvas") }),
        el("dd", { class: "bhb-mono", text: describeCanvas() }),
        el("dt", { text: t("overlay.autoStop") }),
        el("dd", {
          class: "bhb-mono",
          text: engine.activeTask ? formatRemaining(engine.remainingMs) : "—"
        })
      ])
    ]);
  }

  // src/ui/panel/steps.js
  var rows = /* @__PURE__ */ new Map();
  function highlightSteps(state) {
    for (const [stepId, row] of rows) {
      row.classList.toggle("is-selected", state.selectedStepId === stepId);
      row.classList.toggle("is-hovered", state.hoveredStepId === stepId);
    }
  }
  function renderStepsTab(deps) {
    const all = deps.getSteps();
    const expectedStepId = deps.getEngineState().expectedStepId;
    const state = deps.store.get();
    const activities = deps.getActivities();
    const filter = state.stepFilter;
    const steps = filter === null ? all : all.filter((step) => (step.activity || "") === filter);
    const isArmed = state.isCaptureArmed;
    const arm = el("button", { class: `bhb-task bhb-task--wrap ${isArmed ? "is-on" : ""}` }, [
      el("span", { class: "bhb-task__switch" }),
      el("span", { class: "bhb-task__label", text: t("steps.armCapture") }),
      el("span", { class: "bhb-kbd", text: keyLabel(Keys.CAPTURE) })
    ]);
    arm.addEventListener("click", () => {
      deps.store.armCapture(!isArmed);
      deps.refresh();
    });
    const isDryRunning = state.dryRun !== null;
    const dryRun = el("button", { class: `bhb-btn ${isDryRunning ? "is-busy" : ""}` }, [
      el("span", { text: isDryRunning ? t("steps.dryRunStop") : t("steps.dryRun") })
    ]);
    dryRun.addEventListener("click", () => {
      if (isDryRunning) {
        deps.dryRunner.stop();
      } else {
        deps.dryRunner.start();
      }
      deps.refresh();
    });
    const pin = el("button", {
      class: `bhb-btn ${state.areMarkersPinned ? "is-busy" : ""}`,
      text: t("steps.pinMarkers")
    });
    pin.addEventListener("click", () => {
      deps.store.pinMarkers(!state.areMarkersPinned);
      deps.refresh();
    });
    const capture = el("button", { class: "bhb-btn bhb-btn--primary" }, [
      el("span", { class: "bhb-btn__dot" }),
      el("span", { text: t("steps.capture") })
    ]);
    capture.addEventListener("click", async () => {
      await deps.stepEditor.captureAtCursor();
      deps.refresh();
    });
    const filterSelect = el("select", { class: "bhb-rule__gate", title: t("steps.filter") });
    const filterOptions = [["", t("steps.allSteps")], ["", t("steps.loose")]];
    filterOptions[0][0] = "__all__";
    for (const [value, label] of filterOptions) {
      const option = el("option", { text: label });
      option.value = value;
      filterSelect.append(option);
    }
    for (const activity of activities) {
      const option = el("option", { text: activity.name });
      option.value = activity.id;
      filterSelect.append(option);
    }
    filterSelect.value = filter === null ? "__all__" : filter;
    filterSelect.addEventListener("change", () => {
      deps.store.setRuleFilter(filterSelect.value === "__all__" ? null : filterSelect.value);
      deps.refresh();
    });
    const moveAll = el("select", { class: "bhb-rule__gate", title: t("steps.moveAll") });
    const movePrompt = el("option", { text: t("steps.moveAll") });
    movePrompt.value = "__none__";
    moveAll.append(movePrompt);
    const looseTarget = el("option", { text: t("steps.noActivity") });
    looseTarget.value = "";
    moveAll.append(looseTarget);
    for (const activity of activities) {
      const option = el("option", { text: activity.name });
      option.value = activity.id;
      moveAll.append(option);
    }
    moveAll.value = "__none__";
    moveAll.disabled = steps.length === 0;
    moveAll.addEventListener("change", () => {
      if (moveAll.value === "__none__") {
        return;
      }
      const target = moveAll.value || null;
      for (const step of steps) {
        deps.stepEditor.setActivity(step.id, target);
      }
      deps.refresh();
    });
    const legacyCount = all.filter((step) => step.points[0] && isLegacyPoint(step.points[0])).length;
    const head = el("div", { class: "bhb-field" }, [
      el("div", { class: "bhb-field__head" }, [
        el("span", { class: "bhb-label", text: `${t("overlay.steps")} · ${steps.length}` }),
        filterSelect
      ]),
      el("div", { class: "bhb-btnrow" }, [moveAll]),
      arm,
      capture,
      el("div", { class: "bhb-btnrow" }, [dryRun, pin]),
      el("p", { class: "bhb-note", text: t("steps.captureHint") }),
      el("p", { class: "bhb-note", text: t("steps.armHint") }),
      el("p", { class: "bhb-note", text: t("steps.dryRunHint") }),
      legacyCount > 0 ? el("p", { class: "bhb-note bhb-note--warn", text: t("steps.legacyWarning", { n: legacyCount }) }) : null
    ]);
    if (steps.length === 0) {
      return el("div", { class: "bhb-tab" }, [head, el("p", { class: "bhb-empty", text: t("overlay.noSteps") })]);
    }
    rows.clear();
    const stepRows = steps.map((step, index) => {
      const point = step.points[0];
      const legacy = point && isLegacyPoint(point);
      const name = el("input", { class: "bhb-rule__name" });
      name.value = step.label || "";
      name.placeholder = t("steps.unnamed");
      name.addEventListener("change", () => {
        deps.stepEditor.rename(step.id, name.value.trim());
        deps.refresh();
      });
      const slot = el("select", { class: "bhb-rule__gate", title: t("steps.activity") });
      const loose = el("option", { text: t("steps.noActivity") });
      loose.value = "";
      slot.append(loose);
      for (const activity of activities) {
        const option = el("option", { text: activity.name });
        option.value = activity.id;
        slot.append(option);
      }
      slot.value = step.activity || "";
      slot.addEventListener("change", () => {
        deps.stepEditor.setActivity(step.id, slot.value || null);
        deps.refresh();
      });
      const gate = el("select", { class: "bhb-rule__gate", title: t("steps.screenGate") });
      gate.append(el("option", { text: t("steps.anywhere") }));
      gate.options[0].value = "";
      for (const screen of deps.getScreens()) {
        const option = el("option", { text: screen.name || screen.id });
        option.value = screen.id;
        gate.append(option);
      }
      gate.value = step.screens && step.screens[0] || "";
      gate.addEventListener("change", () => {
        deps.stepEditor.setScreens(step.id, gate.value ? [gate.value] : []);
        deps.refresh();
      });
      const toggle = el("button", {
        class: `bhb-icon ${step.enabled ? "is-on" : ""}`,
        title: t(step.enabled ? "steps.disable" : "steps.enable"),
        text: step.enabled ? "◉" : "○"
      });
      toggle.addEventListener("click", () => {
        deps.stepEditor.setEnabled(step.id, !step.enabled);
        deps.refresh();
      });
      const up = el("button", { class: "bhb-icon", title: t("steps.moveUp"), text: "▲" });
      up.addEventListener("click", () => {
        deps.stepEditor.move(step.id, -1);
        deps.refresh();
      });
      const down = el("button", { class: "bhb-icon", title: t("steps.moveDown"), text: "▼" });
      down.addEventListener("click", () => {
        deps.stepEditor.move(step.id, 1);
        deps.refresh();
      });
      const remove = el("button", { class: "bhb-icon bhb-icon--danger", title: t("steps.delete"), text: "✕" });
      remove.addEventListener("click", () => {
        deps.stepEditor.remove(step.id);
        deps.store.forgetStep(step.id);
        deps.refresh();
      });
      const behaviour = el("select", { class: "bhb-rule__gate", title: t("steps.behaviourHint") });
      for (const [value, labelKey] of [
        ["click", "steps.kindClick"],
        ["optional", "steps.kindOptional"],
        ["wait", "steps.kindWait"]
      ]) {
        const option = el("option", { text: t(labelKey) });
        option.value = value;
        behaviour.append(option);
      }
      behaviour.value = step.kind === StepKind.WAIT ? "wait" : step.optional ? "optional" : "click";
      behaviour.addEventListener("change", () => {
        deps.stepEditor.setBehaviour(step.id, {
          kind: behaviour.value === "wait" ? StepKind.WAIT : StepKind.CLICK,
          optional: behaviour.value === "optional"
        });
        deps.refresh();
      });
      const rest = el("input", { class: "bhb-rest bhb-mono", title: t("steps.restHint") });
      rest.type = "number";
      rest.min = "0";
      rest.max = "600";
      rest.value = String(step.restSec || 0);
      rest.addEventListener("change", () => {
        deps.stepEditor.setRest(step.id, rest.value);
        deps.refresh();
      });
      const places = pointsByPlace(step);
      const isWait = step.kind === StepKind.WAIT;
      const addPlace = el("button", {
        class: "bhb-icon",
        title: t("steps.addPlace"),
        text: "＋"
      });
      addPlace.addEventListener("click", () => {
        deps.store.awaitPlaceFor(step.id);
        deps.store.armCapture(true);
        deps.store.closePanel();
        deps.refresh();
      });
      const threshold = el("input", { class: "bhb-rest bhb-mono", title: t("steps.maxMatchesHint") });
      threshold.type = "number";
      threshold.min = "0";
      threshold.max = "20";
      threshold.value = String(step.maxMatches || 0);
      threshold.addEventListener("change", () => {
        deps.stepEditor.setMaxMatches(step.id, threshold.value);
        deps.refresh();
      });
      const placeCount = el("span", {
        class: "bhb-note bhb-mono",
        title: t("steps.placeCount"),
        text: places.length > 1 ? `×${places.length}` : ""
      });
      const classes = ["bhb-step", "bhb-step--stacked"];
      if (step.id === expectedStepId) {
        classes.push("is-next");
      }
      if (!step.enabled) {
        classes.push("is-off");
      }
      if (state.selectedStepId === step.id) {
        classes.push("is-selected");
      }
      if (state.hoveredStepId === step.id) {
        classes.push("is-hovered");
      }
      const row = el("div", { class: classes.join(" ") }, [
        el("div", { class: "bhb-rule__main" }, [
          el("span", { class: "bhb-rule__n", text: String(index + 1) }),
          el("span", { class: "bhb-rule__swatch", style: { background: step.hex || "transparent" } }),
          name,
          el("span", { class: "bhb-rule__actions" }, [addPlace, toggle, up, down, remove])
        ]),
        el("div", { class: "bhb-rule__meta" }, [
          behaviour,
          placeCount,
          isWait ? threshold : rest,
          el("span", { class: "bhb-rule__meta-coord" }, [
            el("span", {
              class: "bhb-rule__coord bhb-mono",
              text: point ? `${point.x},${point.y}` : "—"
            }),
            legacy ? el("span", {
              class: "bhb-rule__legacy",
              title: t("overlay.needsRecapture"),
              text: `⚠ ${t("steps.legacyBadge")}`
            }) : null
          ]),
          activities.length > 0 ? slot : null,
          deps.getScreens().length > 0 ? gate : null
        ])
      ]);
      row.addEventListener("mouseenter", () => deps.store.hoverStep(step.id));
      row.addEventListener("mouseleave", () => deps.store.hoverStep(null));
      row.addEventListener("click", () => deps.store.selectStep(step.id));
      rows.set(step.id, row);
      return row;
    });
    return el("div", { class: "bhb-tab" }, [head, el("div", { class: "bhb-steps" }, stepRows)]);
  }

  // src/ui/dragselect.js
  var MIN_SIDE_PX = 6;
  function startDragSelect(onDone) {
    const canvas = getCanvas();
    if (!canvas) {
      onDone(null);
      return () => {
      };
    }
    const layer = mount(el("div", { class: "bhb-drag" }));
    const box = el("div", { class: "bhb-drag__box" });
    const hint = el("div", { class: "bhb-drag__hint" });
    layer.append(box, hint);
    let startX = null;
    let startY = null;
    let finished = false;
    function rectFrom(x, y) {
      return {
        left: Math.min(startX, x),
        top: Math.min(startY, y),
        width: Math.abs(x - startX),
        height: Math.abs(y - startY)
      };
    }
    function draw(rect) {
      Object.assign(box.style, {
        display: "block",
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`
      });
      hint.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    }
    function finish(rect) {
      if (finished) {
        return;
      }
      finished = true;
      window.removeEventListener("mousedown", onDown, true);
      window.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("mouseup", onUp, true);
      window.removeEventListener("keydown", onKey, true);
      layer.remove();
      onDone(rect);
    }
    function onDown(event) {
      if (!isInsideCanvas(canvas, event.clientX, event.clientY)) {
        finish(null);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      startX = event.clientX;
      startY = event.clientY;
      draw(rectFrom(startX, startY));
    }
    function onMove(event) {
      if (startX === null) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      draw(rectFrom(event.clientX, event.clientY));
    }
    function onUp(event) {
      if (startX === null) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const rect = rectFrom(event.clientX, event.clientY);
      finish(rect.width >= MIN_SIDE_PX && rect.height >= MIN_SIDE_PX ? rect : null);
    }
    function onKey(event) {
      if (event.key === "Escape") {
        finish(null);
      }
    }
    window.addEventListener("mousedown", onDown, true);
    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("mouseup", onUp, true);
    window.addEventListener("keydown", onKey, true);
    return () => finish(null);
  }

  // src/ui/panel/screens.js
  function renderScreensTab(deps) {
    const screens = deps.getScreens();
    const active2 = deps.getEngineState().screen;
    function capture(screenId) {
      deps.store.closePanel();
      deps.refresh();
      startDragSelect((rect) => {
        if (rect) {
          deps.screenEditor.captureAnchor(rect, screenId);
        }
        deps.store.openPanel();
        deps.refresh();
      });
    }
    const captureButton = el("button", { class: "bhb-btn bhb-btn--primary" }, [
      el("span", { class: "bhb-btn__dot" }),
      el("span", { text: t("screens.capture") })
    ]);
    captureButton.addEventListener("click", () => capture(null));
    const head = el("div", { class: "bhb-field" }, [
      el("div", { class: "bhb-field__head" }, [
        el("span", { class: "bhb-label", text: `${t("screens.title")} · ${screens.length}` }),
        el("span", {
          class: "bhb-mono bhb-screen__now",
          text: deps.getEngineState().screenName || t("screens.unknown")
        })
      ]),
      captureButton,
      el("p", { class: "bhb-note", text: t("screens.captureHint") })
    ]);
    if (screens.length === 0) {
      return el("div", { class: "bhb-tab" }, [
        head,
        el("p", { class: "bhb-empty", text: t("screens.empty") })
      ]);
    }
    const rows2 = screens.map((screen, index) => {
      const probe = deps.screenEditor.probe(screen.id);
      const name = el("input", { class: "bhb-rule__name" });
      name.value = screen.name || "";
      name.placeholder = t("screens.unnamed");
      name.addEventListener("change", () => {
        deps.screenEditor.rename(screen.id, name.value.trim());
        deps.refresh();
      });
      const stops = el("button", {
        class: `bhb-icon ${screen.stopsTask ? "is-danger-on" : ""}`,
        title: t("screens.stopsTask"),
        text: "⏹"
      });
      stops.addEventListener("click", () => {
        deps.screenEditor.setStopsTask(screen.id, !screen.stopsTask);
        deps.refresh();
      });
      const alertToggle = el("button", {
        class: `bhb-icon ${screen.notify ? "is-notify-on" : ""}`,
        title: t("screens.notify"),
        text: "★"
      });
      alertToggle.addEventListener("click", () => {
        deps.screenEditor.setNotify(screen.id, !screen.notify);
        deps.refresh();
      });
      const add = el("button", { class: "bhb-icon", title: t("screens.addAnchor"), text: "＋" });
      add.addEventListener("click", () => capture(screen.id));
      const up = el("button", { class: "bhb-icon", title: t("steps.moveUp"), text: "▲" });
      up.addEventListener("click", () => {
        deps.screenEditor.move(screen.id, -1);
        deps.refresh();
      });
      const down = el("button", { class: "bhb-icon", title: t("steps.moveDown"), text: "▼" });
      down.addEventListener("click", () => {
        deps.screenEditor.move(screen.id, 1);
        deps.refresh();
      });
      const remove = el("button", { class: "bhb-icon bhb-icon--danger", title: t("steps.delete"), text: "✕" });
      remove.addEventListener("click", () => {
        deps.screenEditor.remove(screen.id);
        deps.refresh();
      });
      const ratio = el("input", { class: "bhb-slider bhb-slider--thin" });
      ratio.type = "range";
      ratio.min = "0.4";
      ratio.max = "1";
      ratio.step = "0.05";
      ratio.value = String(screen.minRatio);
      ratio.style.setProperty("--bhb-fill", `${(screen.minRatio - 0.4) / 0.6 * 100}%`);
      ratio.addEventListener("input", () => {
        deps.screenEditor.setMinRatio(screen.id, Number(ratio.value));
        deps.refresh();
      });
      const classes = ["bhb-step", "bhb-screen"];
      if (active2 === screen.id) {
        classes.push("is-active");
      }
      if (screen.stopsTask) {
        classes.push("is-stopper");
      }
      return el("div", { class: "bhb-screen__wrap" }, [
        el("div", { class: classes.join(" ") }, [
          el("span", { class: "bhb-rule__n", text: String(index + 1) }),
          el("span", {
            class: `bhb-screen__state ${probe && probe.matched ? "is-seen" : ""}`,
            text: probe ? probe.matched ? "✓" : "✗" : "·"
          }),
          name,
          el("span", {
            class: "bhb-rule__coord bhb-mono",
            title: t("screens.ratioHint"),
            text: probe ? probe.ratio.toFixed(2) : "—"
          }),
          el("span", { class: "bhb-rule__actions" }, [stops, alertToggle, add, up, down, remove])
        ]),
        el("div", { class: "bhb-screen__tune" }, [
          el("span", { class: "bhb-note", text: `${t("screens.anchors")} ${screen.anchors.length}` }),
          ratio,
          el("span", { class: "bhb-mono bhb-note", text: screen.minRatio.toFixed(2) })
        ])
      ]);
    });
    return el("div", { class: "bhb-tab" }, [head, el("div", { class: "bhb-steps" }, rows2)]);
  }

  // src/ui/panel/queue.js
  function renderQueueSection(deps) {
    const activities = deps.getActivities();
    const engine = deps.getEngineState();
    const steps = deps.getSteps();
    const running = Boolean(engine.activity);
    const spent = new Set(engine.spent || []);
    const head = running ? el("div", { class: "bhb-field__head" }, [
      el("span", { class: "bhb-mono bhb-note", text: t("queue.round", { n: engine.round }) })
    ]) : null;
    const rows2 = activities.map((activity, index) => {
      const count = stepsForActivity(steps, activity.id).length;
      const isSolo = engine.activeTask === "solo" && engine.activity === activity.id;
      const run = el("button", {
        class: `bhb-icon ${isSolo ? "is-on" : ""} ${count === 0 ? "is-locked" : ""}`,
        title: count === 0 ? t("queue.noSteps") : t(isSolo ? "queue.stopSolo" : "queue.runSolo"),
        text: isSolo ? "■" : "▶"
      });
      if (count > 0) {
        run.addEventListener("click", () => {
          deps.runActivity(activity.id);
          deps.refresh();
        });
      }
      const toggle = el("button", {
        class: `bhb-icon ${activity.enabled ? "is-on" : ""}`,
        title: t(activity.enabled ? "steps.disable" : "steps.enable"),
        text: activity.enabled ? "◉" : "○"
      });
      toggle.addEventListener("click", () => {
        deps.queueEditor.setEnabled(activity.id, !activity.enabled);
        deps.refresh();
      });
      const up = el("button", { class: "bhb-icon", title: t("steps.moveUp"), text: "▲" });
      up.addEventListener("click", () => {
        deps.queueEditor.move(activity.id, -1);
        deps.refresh();
      });
      const down = el("button", { class: "bhb-icon", title: t("steps.moveDown"), text: "▼" });
      down.addEventListener("click", () => {
        deps.queueEditor.move(activity.id, 1);
        deps.refresh();
      });
      const classes = ["bhb-step", "bhb-queue__row"];
      if (!activity.enabled) {
        classes.push("is-off");
      }
      if (engine.activity === activity.id) {
        classes.push("is-active");
      }
      if (spent.has(activity.id)) {
        classes.push("is-spent");
      }
      return el("div", { class: classes.join(" ") }, [
        el("span", { class: "bhb-rule__n", text: String(index + 1) }),
        el("span", {
          class: "bhb-queue__state",
          text: engine.activity === activity.id ? "▶" : spent.has(activity.id) ? "∅" : ""
        }),
        el("span", { class: "bhb-queue__name", text: activity.name }),
        el("span", {
          class: "bhb-rule__coord bhb-mono",
          title: t("queue.stepCount"),
          text: String(count)
        }),
        el("span", { class: "bhb-rule__actions" }, [run, toggle, up, down])
      ]);
    });
    return el("div", { class: "bhb-field" }, [
      head,
      el("p", { class: "bhb-note", text: t("queue.hint") }),
      el("div", { class: "bhb-steps" }, rows2)
    ]);
  }

  // src/core/update.js
  var SCRIPT_URL = "https://raw.githubusercontent.com/hungnm-ict/bhb/master/dist/bhb.user.js";
  var HEADER_BYTES = 2048;
  function parseVersion(source) {
    const match = /^\/\/\s*@version\s+(\S+)/m.exec(source || "");
    return match ? match[1] : null;
  }
  function compareVersions(a, b) {
    const left = String(a).split(".").map((part) => parseInt(part, 10) || 0);
    const right = String(b).split(".").map((part) => parseInt(part, 10) || 0);
    for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
      const difference = (left[index] || 0) - (right[index] || 0);
      if (difference !== 0) {
        return difference > 0 ? 1 : -1;
      }
    }
    return 0;
  }
  async function checkForUpdate(deps = {}) {
    const send = deps.fetch || ((...args) => fetch(...args));
    const current = deps.current || VERSION;
    try {
      const response = await send(`${SCRIPT_URL}?at=${Date.now()}`, {
        cache: "no-store",
        headers: { Range: `bytes=0-${HEADER_BYTES}` }
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
      console.warn("[BHB] update check failed", error);
      return { ok: false, latest: null, hasUpdate: false };
    }
  }

  // src/ui/panel/probes.js
  function sizeText(width, height) {
    return `${width}×${height}`;
  }
  function aspectText(width, height) {
    return (width / height).toFixed(2);
  }
  function verdictRow(probe, score) {
    const cells = [
      el("span", { class: "bhb-probe-row__name", text: probe.label }),
      el("span", {
        class: "bhb-mono bhb-probe-row__size",
        text: sizeText(probe.bw, probe.bh),
        title: t("probe.captured")
      }),
      el("span", {
        class: "bhb-mono bhb-probe-row__pos",
        text: `${score.resolved.x}, ${score.resolved.y}`
      }),
      el("span", { class: "bhb-probe-row__swatch", style: { background: probe.hex } }),
      el("span", {
        class: "bhb-probe-row__swatch",
        style: { background: score.liveHex || "transparent" }
      })
    ];
    if (score.matches === null) {
      cells.push(el("span", { class: "bhb-note", text: t("probe.unknown") }));
    } else {
      cells.push(
        el("span", {
          class: `bhb-mono bhb-probe-row__delta ${score.matches ? "is-match" : "is-miss"}`,
          text: `${score.delta} ${score.matches ? "✓" : "✗"}`
        })
      );
    }
    return cells;
  }
  function renderProbeSection(deps, toggleRow) {
    const probes = deps.getProbes();
    const { buffer, scores } = deps.probeEditor.scoreAll();
    const state = deps.store.get();
    const capture = el("button", {
      class: `bhb-btn bhb-btn--small ${state.isAwaitingProbe ? "bhb-btn--primary" : ""}`,
      text: t(state.isAwaitingProbe ? "probe.cancel" : "probe.capture")
    });
    capture.addEventListener("click", () => {
      const awaiting = !state.isAwaitingProbe;
      deps.store.awaitProbe(awaiting);
      if (awaiting) {
        deps.store.armCapture(true);
        deps.store.closePanel();
      }
      deps.refresh();
    });
    const clear = el("button", { class: "bhb-btn bhb-btn--small", text: t("probe.clear") });
    clear.addEventListener("click", () => {
      deps.probeEditor.clear();
      deps.refresh();
    });
    const rows2 = probes.map((probe, index) => {
      const score = scores[index];
      const remove = el("button", { class: "bhb-icon", title: t("probe.clear"), text: "✕" });
      remove.addEventListener("click", () => {
        deps.probeEditor.remove(probe.id);
        deps.refresh();
      });
      return el("div", { class: "bhb-probe-row" }, [
        ...score ? verdictRow(probe, score) : [el("span", { class: "bhb-probe-row__name", text: probe.label })],
        remove
      ]);
    });
    const drifted = scores.find((score) => score.aspectChanged);
    const capturedAt = probes[0];
    return el("div", { class: "bhb-field" }, [
      el("div", { class: "bhb-btnrow" }, [
        capture,
        probes.length > 0 ? clear : null,
        buffer ? el("span", {
          class: "bhb-mono bhb-note",
          text: `${t("probe.now")} ${sizeText(buffer.width, buffer.height)}`
        }) : null
      ]),
      state.isAwaitingProbe ? el("p", { class: "bhb-note bhb-note--warn", text: t("probe.capturing") }) : null,
      toggleRow("probe.pin", state.areProbesPinned, (value) => deps.store.pinProbes(value)),
      drifted && capturedAt && buffer ? el("p", {
        class: "bhb-note bhb-note--warn",
        text: t("probe.aspectWarn", {
          before: aspectText(capturedAt.bw, capturedAt.bh),
          after: aspectText(buffer.width, buffer.height)
        })
      }) : null,
      rows2.length > 0 ? el("div", { class: "bhb-probe-table" }, rows2) : el("p", { class: "bhb-note", text: t("probe.empty") }),
      el("p", { class: "bhb-note", text: t("probe.hint") })
    ]);
  }

  // src/ui/panel/settings.js
  var transferBox = null;
  var alertBoxes = {};
  function renderAlerts(deps, toggleRow) {
    const config = deps.settings.notify;
    function update(changes) {
      deps.updateSettings({ notify: { ...config, ...changes } });
      deps.refresh();
    }
    function field(key, labelKey) {
      if (!alertBoxes[key]) {
        const input2 = el("input", { class: "bhb-input" });
        input2.type = "text";
        input2.spellcheck = false;
        input2.addEventListener("change", () => {
          update({ [key]: input2.value.trim() });
        });
        alertBoxes[key] = input2;
      }
      const input = alertBoxes[key];
      input.placeholder = t(labelKey);
      if (document.activeElement !== input) {
        input.value = config[key] || "";
      }
      return input;
    }
    const eventRows = NOTIFY_EVENTS.map(
      (kind) => toggleRow(`notify.event.${kind}`, config.events.includes(kind), (value) => {
        const events = value ? [...config.events, kind] : config.events.filter((entry) => entry !== kind);
        update({ events });
      })
    );
    const test = el("button", { class: "bhb-btn bhb-btn--small", text: t("notify.test") });
    const testResult = el("span", { class: "bhb-note" });
    test.addEventListener("click", () => {
      testResult.textContent = "…";
      deps.sendTestAlert().then((sent) => {
        testResult.textContent = t(sent ? "notify.testSent" : "notify.testFailed");
      });
    });
    return el("div", { class: "bhb-field" }, [
      toggleRow("notify.enabled", config.enabled, (value) => update({ enabled: value })),
      field("discordWebhook", "notify.discord"),
      field("telegramToken", "notify.telegramToken"),
      field("telegramChat", "notify.telegramChat"),
      hasNotifyTarget(config) ? null : el("p", { class: "bhb-note bhb-note--warn", text: t("notify.noTarget") }),
      el("div", { class: "bhb-field__head" }, [
        el("span", { class: "bhb-label", text: t("notify.events") })
      ]),
      ...eventRows,
      toggleRow("notify.withShot", config.withShot, (value) => update({ withShot: value })),
      el("div", { class: "bhb-btnrow" }, [test, testResult]),
      el("p", { class: "bhb-note", text: t("notify.hint") })
    ]);
  }
  function renderCanvasLock(deps, toggleRow) {
    const lock = deps.settings.canvasLock;
    function update(changes) {
      deps.updateSettings({ canvasLock: { ...lock, ...changes } });
      deps.refresh();
    }
    return el("div", { class: "bhb-field" }, [
      toggleRow("lock.enabled", lock.enabled, (value) => update({ enabled: value })),
      el("p", { class: "bhb-note", text: t("lock.hint") })
    ]);
  }
  var updateResult = { state: "idle", latest: null };
  function renderVersion(deps) {
    const check = el("button", { class: "bhb-btn bhb-btn--small", text: t("update.check") });
    check.addEventListener("click", () => {
      updateResult = { state: "checking", latest: null };
      deps.refresh();
      checkForUpdate().then((result) => {
        if (!result.ok) {
          updateResult = { state: "failed", latest: null };
        } else {
          updateResult = { state: result.hasUpdate ? "newer" : "current", latest: result.latest };
        }
        deps.refresh();
      });
    });
    const messages = {
      idle: "",
      checking: t("update.checking"),
      current: t("update.current"),
      newer: t("update.newer", { version: updateResult.latest || "" }),
      installing: t("update.installing"),
      failed: t("update.failed")
    };
    const install = el("button", { class: "bhb-btn bhb-btn--small", text: t("update.install") });
    install.addEventListener("click", () => {
      window.open(`${SCRIPT_URL}?at=${Date.now()}`, "_blank", "noopener");
      updateResult = { ...updateResult, state: "installing" };
      deps.refresh();
    });
    const reload = el("button", { class: "bhb-btn bhb-btn--small", text: t("update.reload") });
    reload.addEventListener("click", () => {
      window.location.reload();
    });
    return el("div", { class: "bhb-field" }, [
      el("div", { class: "bhb-btnrow" }, [
        check,
        updateResult.state === "newer" ? install : null,
        updateResult.state === "installing" ? reload : null
      ]),
      el("p", {
        class: `bhb-note ${updateResult.state === "newer" || updateResult.state === "installing" ? "bhb-note--warn" : ""}`,
        text: messages[updateResult.state]
      }),
      el("p", { class: "bhb-note", text: t("update.hint") })
    ]);
  }
  function section(deps, id, titleKey, summary, build) {
    const isOpen = deps.settings.openSection === id;
    const head = el("button", { class: `bhb-fold__head ${isOpen ? "is-open" : ""}` }, [
      el("span", { class: "bhb-fold__caret", text: isOpen ? "▾" : "▸" }),
      el("span", { class: "bhb-label", text: t(titleKey) }),
      el("span", { class: "bhb-fold__summary", text: summary || "" })
    ]);
    head.addEventListener("click", () => {
      deps.updateSettings({ openSection: isOpen ? null : id });
      deps.refresh();
    });
    return el("div", { class: `bhb-fold ${isOpen ? "is-open" : ""}` }, [
      head,
      // Built only when open: the alerts section alone is three inputs and five
      // switches, and nothing is gained by constructing it to hide it.
      isOpen ? el("div", { class: "bhb-fold__body" }, [build()]) : null
    ]);
  }
  function countBehaviour(settings) {
    const switches = [
      settings.watchdog,
      settings.closeAfterRound,
      settings.keepAlive,
      settings.sizeBadge,
      settings.scaleMode === ScaleMode.ABSOLUTE
    ];
    return switches.filter(Boolean).length;
  }
  function renderSettingsTab(deps) {
    const { profiles, settings } = deps;
    const list = profiles.list();
    const activeId = profiles.activeId();
    const picker = el("select", { class: "bhb-select" });
    for (const profile of list) {
      const option = el("option", { text: profile.name });
      option.value = profile.id;
      picker.append(option);
    }
    picker.value = activeId;
    picker.addEventListener("change", () => {
      profiles.setActive(picker.value);
      deps.refresh();
    });
    function action(labelKey, run) {
      const button = el("button", { class: "bhb-btn bhb-btn--small", text: t(labelKey) });
      button.addEventListener("click", () => {
        run();
        deps.refresh();
      });
      return button;
    }
    if (!transferBox) {
      transferBox = el("textarea", { class: "bhb-textarea" });
      transferBox.spellcheck = false;
    }
    const transfer = transferBox;
    transfer.placeholder = t("settings.transferHint");
    const exportButton = action("settings.export", () => {
      transfer.value = profiles.exportAll();
    });
    const importButton = el("button", { class: "bhb-btn bhb-btn--small", text: t("settings.import") });
    importButton.addEventListener("click", () => {
      try {
        profiles.importAll(transfer.value);
        transfer.value = "";
        deps.refresh();
      } catch (error) {
        transfer.value = `${t("settings.importFailed")}: ${error.message}`;
      }
    });
    function toggleRow(labelKey, value, onChange, note) {
      const row = el("button", { class: `bhb-task bhb-task--wrap ${value ? "is-on" : ""}` }, [
        el("span", { class: "bhb-task__switch" }),
        el("span", { class: "bhb-task__label", text: t(labelKey) }),
        note ? el("span", { class: "bhb-mono bhb-task__phase", text: note }) : null
      ]);
      row.addEventListener("click", () => {
        onChange(!value);
        deps.refresh();
      });
      return row;
    }
    const languagePicker = el("select", { class: "bhb-select" });
    for (const [code, label] of [["vi", "Tiếng Việt"], ["en", "English"]]) {
      const option = el("option", { text: label });
      option.value = code;
      languagePicker.append(option);
    }
    languagePicker.value = getLanguage();
    languagePicker.addEventListener("change", () => {
      deps.updateSettings({ language: languagePicker.value });
      deps.refresh();
    });
    const reloads = deps.getReloadCount();
    const notify = settings.notify;
    const channels = [
      notify.discordWebhook ? "Discord" : null,
      notify.telegramToken && notify.telegramChat ? "Telegram" : null
    ].filter(Boolean);
    return el("div", { class: "bhb-tab bhb-tab--folds" }, [
      section(
        deps,
        "profiles",
        "settings.profiles",
        profiles.activeName(),
        () => el("div", { class: "bhb-field" }, [
          picker,
          el("div", { class: "bhb-btnrow" }, [
            action("settings.newProfile", () => profiles.create(t("settings.newProfileName"))),
            action("settings.duplicate", () => profiles.duplicate()),
            action("settings.rename", () => {
              const name = window.prompt(t("settings.renamePrompt"), profiles.activeName());
              if (name) {
                profiles.rename(activeId, name.trim());
              }
            }),
            action("settings.delete", () => profiles.remove(activeId))
          ]),
          el("p", { class: "bhb-note", text: t("settings.profilesHint") })
        ])
      ),
      section(
        deps,
        "behaviour",
        "settings.behaviour",
        t("settings.onCount", { n: countBehaviour(settings), total: 5 }),
        () => el("div", { class: "bhb-field" }, [
          toggleRow(
            "settings.watchdog",
            settings.watchdog,
            (value) => deps.updateSettings({ watchdog: value }),
            reloads > 0 ? t("settings.reloads", { n: reloads }) : null
          ),
          toggleRow(
            "queue.closeAfterRound",
            settings.closeAfterRound,
            (value) => deps.updateSettings({ closeAfterRound: value })
          ),
          toggleRow(
            "settings.keepAlive",
            settings.keepAlive,
            (value) => deps.updateSettings({ keepAlive: value })
          ),
          toggleRow(
            "settings.sizeBadge",
            settings.sizeBadge,
            (value) => deps.updateSettings({ sizeBadge: value })
          ),
          toggleRow(
            "settings.absoluteCoords",
            settings.scaleMode === ScaleMode.ABSOLUTE,
            (value) => deps.updateSettings({ scaleMode: value ? ScaleMode.ABSOLUTE : ScaleMode.SCALE })
          ),
          el("p", { class: "bhb-note", text: t("settings.watchdogHint") }),
          el("p", { class: "bhb-note", text: t("settings.keepAliveHint") })
        ])
      ),
      section(deps, "queue", "queue.title", t("settings.queueCount", {
        n: deps.getActivities().filter((activity) => activity.enabled).length
      }), () => renderQueueSection(deps)),
      section(
        deps,
        "lock",
        "lock.title",
        `${t(settings.canvasLock.enabled ? "settings.on" : "settings.off")} · ${LOCK_SIZE.width}×${LOCK_SIZE.height}`,
        () => renderCanvasLock(deps, toggleRow)
      ),
      section(
        deps,
        "probes",
        "probe.title",
        deps.getProbes().length > 0 ? t("probe.count", { n: deps.getProbes().length }) : t("probe.none"),
        () => renderProbeSection(deps, toggleRow)
      ),
      section(
        deps,
        "alerts",
        "notify.title",
        channels.length > 0 && notify.enabled ? channels.join(" + ") : t("settings.off"),
        () => renderAlerts(deps, toggleRow)
      ),
      section(
        deps,
        "language",
        "settings.language",
        getLanguage() === "vi" ? "Tiếng Việt" : "English",
        () => el("div", { class: "bhb-field" }, [languagePicker])
      ),
      section(
        deps,
        "version",
        "update.title",
        updateResult.state === "newer" ? t("update.badge", { version: updateResult.latest }) : `v${VERSION}`,
        () => renderVersion(deps)
      ),
      section(
        deps,
        "transfer",
        "settings.transfer",
        "",
        () => el("div", { class: "bhb-field" }, [
          transfer,
          el("div", { class: "bhb-btnrow" }, [exportButton, importButton])
        ])
      )
    ]);
  }

  // src/ui/panel/log.js
  var KIND_ICON = {
    click: "⊙",
    busy: "⋯",
    task: "⏻",
    screen: "▣",
    activity: "➜",
    hang: "⟳",
    resync: "↻",
    resource: "⛔",
    notify: "★"
  };
  function clock(at) {
    const date = new Date(at);
    return [date.getHours(), date.getMinutes(), date.getSeconds()].map((part) => String(part).padStart(2, "0")).join(":");
  }
  function describeEntry(entry) {
    if (entry.kind === "task") {
      return t(entry.started ? "log.taskStarted" : "log.taskStopped", { task: entry.label });
    }
    if (entry.kind === "resync") {
      return t("log.resync", { label: entry.label });
    }
    if (entry.kind === "hang") {
      return t("log.hang", { label: entry.label });
    }
    if (entry.kind === "activity") {
      return t("log.activity", { label: entry.label });
    }
    if (entry.kind === "screen") {
      return t("log.screen", { label: entry.label });
    }
    if (entry.kind === "resource") {
      return t("log.resource", { label: entry.label });
    }
    if (entry.kind === "notify") {
      return t("log.notify", { label: entry.label });
    }
    if (entry.kind === "busy") {
      return t("log.busy", { label: entry.label });
    }
    return t("log.clicked", { label: entry.label });
  }
  function shortClock(at) {
    const date = new Date(at);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  function renderStats(deps) {
    const stats = deps.getStats();
    const reset = el("button", { class: "bhb-btn bhb-btn--small", text: t("stats.reset") });
    reset.addEventListener("click", () => {
      deps.resetStats();
      deps.refresh();
    });
    const facts = [
      [t("stats.running"), formatDuration(stats.runningMs)],
      [t("stats.clicks"), String(stats.clicks)],
      [t("stats.rounds"), String(stats.rounds)],
      [t("stats.drops"), String(stats.drops)],
      [t("stats.resyncs"), String(stats.resyncs)],
      [t("stats.hangs"), String(stats.hangs)]
    ];
    const activities = Object.values(stats.activities).filter(
      (entry) => entry.clicks > 0 || entry.visits > 0
    );
    return el("div", { class: "bhb-field" }, [
      el("div", { class: "bhb-field__head" }, [
        el("span", { class: "bhb-label", text: t("stats.title") }),
        el("span", {
          class: "bhb-note bhb-mono",
          text: t("stats.since", { time: shortClock(stats.startedAt) })
        }),
        reset
      ]),
      el(
        "div",
        { class: "bhb-stats" },
        facts.map(
          ([label, value]) => el("div", { class: "bhb-stats__cell" }, [
            el("span", { class: "bhb-stats__value bhb-mono", text: value }),
            el("span", { class: "bhb-stats__label", text: label })
          ])
        )
      ),
      activities.length === 0 ? el("p", { class: "bhb-note", text: t("stats.empty") }) : el(
        "div",
        { class: "bhb-stats__rows" },
        activities.map(
          (entry) => el("div", { class: "bhb-stats__row" }, [
            el("span", { class: "bhb-stats__name", text: entry.name }),
            el("span", {
              class: "bhb-mono bhb-stats__num",
              text: `${entry.clicks} ${t("stats.colClicks")}`
            }),
            el("span", {
              class: "bhb-mono bhb-stats__num",
              text: `${entry.visits} ${t("stats.colVisits")}`
            }),
            el("span", {
              class: `bhb-mono bhb-stats__num ${entry.spent > 0 ? "is-spent" : ""}`,
              text: `${entry.spent} ${t("stats.colSpent")}`
            })
          ])
        )
      )
    ]);
  }
  function renderLogTab(deps) {
    const entries = deps.store.get().log;
    const stats = renderStats(deps);
    const clear = el("button", { class: "bhb-btn", text: t("log.clear") });
    clear.addEventListener("click", () => {
      deps.store.clearLog();
      deps.refresh();
    });
    if (entries.length === 0) {
      return el("div", { class: "bhb-tab" }, [
        stats,
        el("p", { class: "bhb-empty", text: t("log.empty") })
      ]);
    }
    const rows2 = entries.map(
      (entry) => el("div", { class: `bhb-log__row bhb-log__row--${entry.kind}` }, [
        el("span", { class: "bhb-log__time bhb-mono", text: clock(entry.at) }),
        el("span", { class: "bhb-log__icon", text: KIND_ICON[entry.kind] || "·" }),
        el("span", { class: "bhb-log__text", text: describeEntry(entry) }),
        el("span", {
          class: "bhb-log__coord bhb-mono",
          text: entry.point ? `${entry.point.x},${entry.point.y}` : ""
        })
      ])
    );
    return el("div", { class: "bhb-tab" }, [
      stats,
      el("div", { class: "bhb-field__head" }, [
        el("span", { class: "bhb-label", text: `${t("log.title")} · ${entries.length}` }),
        clear
      ]),
      el("div", { class: "bhb-log" }, rows2)
    ]);
  }

  // src/ui/panel/help.js
  var SECTIONS = [
    {
      title: "help.sectionAuto",
      entries: [
        [keyLabel(Keys.RUN), "help.run"]
      ]
    },
    {
      title: "help.sectionSteps",
      entries: [
        [keyLabel(Keys.CAPTURE), "help.capture"]
      ]
    },
    {
      title: "help.sectionUi",
      entries: [
        [keyLabel(Keys.PANEL), "help.togglePanel"],
        [keyLabel(Keys.CLOSE_PANEL), "help.closePanel"]
      ]
    },
    {
      title: "help.sectionSpeed",
      entries: [
        [`${Keys.SPEED_UP} / ${Keys.SPEED_UP_ALT}`, "help.speedUp"],
        [Keys.SPEED_DOWN, "help.speedDown"],
        [keyLabel(Keys.SPEED_RESET), "help.speedReset"]
      ]
    }
  ];
  function renderHelpTab() {
    const stamp = el("div", { class: "bhb-field__head" }, [
      el("span", { class: "bhb-panel__name", text: t("app.name") }),
      el("span", { class: "bhb-panel__ver bhb-mono", text: `v${VERSION}` })
    ]);
    const sections = SECTIONS.flatMap((section2) => [
      el("div", { class: "bhb-help__section", text: `▸ ${t(section2.title)}` }),
      ...section2.entries.map(
        ([key, labelKey]) => el("div", { class: "bhb-help__entry" }, [
          el("b", { text: key }),
          el("span", { class: "bhb-help__label", text: t(labelKey) })
        ])
      )
    ]);
    return el("div", { class: "bhb-tab bhb-help" }, [
      stamp,
      ...sections,
      el("p", { class: "bhb-note bhb-help__footer", text: t("help.footer") })
    ]);
  }

  // src/ui/panel/index.js
  var TABS = [
    [Tab.TASKS, "tab.tasks"],
    [Tab.STEPS, "tab.steps"],
    [Tab.SCREENS, "tab.screens"],
    [Tab.SETTINGS, "tab.settings"],
    [Tab.LOG, "tab.log"],
    [Tab.HELP, "tab.help"]
  ];
  function createPanel(deps) {
    let node = null;
    let renderedTab = null;
    function aDropdownIsOpen() {
      const active2 = document.activeElement;
      return active2 instanceof HTMLSelectElement && Boolean(node) && node.contains(active2);
    }
    function ensureNode() {
      if (!node) {
        node = mount(el("div", { class: "bhb-panel" }));
      }
      return node;
    }
    function renderBody(tab) {
      if (tab === Tab.STEPS) {
        return renderStepsTab(deps);
      }
      if (tab === Tab.SCREENS) {
        return renderScreensTab(deps);
      }
      if (tab === Tab.SETTINGS) {
        return renderSettingsTab(deps);
      }
      if (tab === Tab.HELP) {
        return renderHelpTab();
      }
      if (tab === Tab.LOG) {
        return renderLogTab(deps);
      }
      return renderTasksTab(deps);
    }
    function render() {
      const target = ensureNode();
      const state = deps.store.get();
      if (renderedTab !== null && (speedIsBeingDragged() || aDropdownIsOpen())) {
        return;
      }
      if (!state.panelOpen) {
        target.style.display = "none";
        target.replaceChildren();
        renderedTab = null;
        return;
      }
      target.style.display = "flex";
      const close = el("button", { class: "bhb-icon", title: t("panel.close"), text: "✕" });
      close.addEventListener("click", () => {
        deps.store.closePanel();
        deps.refresh();
      });
      const profile = el("button", {
        class: "bhb-panel__profile",
        title: t("settings.profiles"),
        text: deps.getProfileName()
      });
      profile.addEventListener("click", () => {
        deps.store.setTab(Tab.SETTINGS);
        deps.refresh();
      });
      let activeTab = null;
      const tabs = TABS.map(([id, labelKey]) => {
        const button = el("button", {
          class: `bhb-tabbtn ${id === Tab.HELP ? "bhb-tabbtn--help" : ""} ${state.tab === id ? "is-active" : ""}`,
          text: t(labelKey)
        });
        button.addEventListener("click", () => {
          deps.store.setTab(id);
          deps.refresh();
        });
        if (state.tab === id) {
          activeTab = button;
        }
        return button;
      });
      const previousBody = target.querySelector(".bhb-panel__body");
      const keptScroll = previousBody && renderedTab === state.tab ? previousBody.scrollTop : 0;
      const body = el("div", { class: "bhb-panel__body" }, [renderBody(state.tab)]);
      const help = tabs.pop();
      target.replaceChildren(
        el("nav", { class: "bhb-tabs" }, [
          ...tabs,
          el("span", { class: "bhb-tabs__end" }, [profile, help, close])
        ]),
        body
      );
      body.scrollTop = keptScroll;
      renderedTab = state.tab;
      if (activeTab && typeof activeTab.scrollIntoView === "function") {
        activeTab.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }
    function updateSpeed() {
      updateSpeedDisplay();
    }
    function highlight() {
      highlightSteps(deps.store.get());
    }
    return { render, highlight, updateSpeed };
  }

  // src/ui/markers.js
  function createMarkerLayer(deps) {
    let layer = null;
    const nodes = /* @__PURE__ */ new Map();
    let drawnFilter = null;
    let drawnVisible = false;
    function ensureLayer() {
      if (!layer) {
        layer = mount(el("div", { class: "bhb-markers" }));
      }
      return layer;
    }
    function markerFor(step, index, canvas, buffer, rect) {
      const stored = step.points[0];
      if (!stored) {
        return null;
      }
      const resolved = resolvePoint(stored, buffer, deps.getScaleMode());
      const pos = bufferToClient(canvas, resolved.x, resolved.y, rect);
      const state = deps.store.get();
      const classes = ["bhb-mark"];
      if (!step.enabled) {
        classes.push("bhb-mark--off");
      }
      if (isLegacyPoint(stored)) {
        classes.push("bhb-mark--legacy");
      }
      if (state.selectedStepId === step.id) {
        classes.push("bhb-mark--selected");
      }
      if (state.hoveredStepId === step.id) {
        classes.push("bhb-mark--hovered");
      }
      if (state.dryRun) {
        const verdict = state.dryRun.scores[step.id];
        if (verdict) {
          classes.push(`bhb-mark--${verdict}`);
        }
        if (deps.getSteps()[state.dryRun.index] === step) {
          classes.push("bhb-mark--testing");
        }
      }
      const node = el(
        "div",
        {
          class: classes.join(" "),
          style: { left: `${pos.clientX}px`, top: `${pos.clientY}px` },
          title: step.label || step.hex || ""
        },
        [
          el("span", { class: "bhb-mark__n", text: String(index + 1) }),
          el("span", { class: "bhb-mark__swatch", style: { background: step.hex || "transparent" } })
        ]
      );
      node.addEventListener("click", (event) => {
        event.stopPropagation();
        deps.store.selectStep(step.id);
      });
      node.addEventListener("mouseenter", () => deps.store.hoverStep(step.id));
      node.addEventListener("mouseleave", () => deps.store.hoverStep(null));
      nodes.set(step.id, node);
      return node;
    }
    function render() {
      const node = ensureLayer();
      if (!deps.store.markersVisible()) {
        node.style.display = "none";
        node.replaceChildren();
        nodes.clear();
        drawnVisible = false;
        drawnFilter = null;
        return;
      }
      const canvas = getCanvas();
      if (!canvas) {
        node.style.display = "none";
        return;
      }
      node.style.display = "block";
      const buffer = getBufferSize(canvas);
      const rect = canvas.getBoundingClientRect();
      const only = deps.store.markerFilter();
      nodes.clear();
      const marks = deps.getSteps().map(
        (step, index) => only !== null && step.id !== only ? null : markerFor(step, index, canvas, buffer, rect)
      ).filter(Boolean);
      node.replaceChildren(...marks);
      drawnFilter = only;
      drawnVisible = true;
    }
    function highlight() {
      if (deps.store.markersVisible() !== drawnVisible || deps.store.markerFilter() !== drawnFilter) {
        render();
        return;
      }
      const state = deps.store.get();
      for (const [stepId, marker] of nodes) {
        marker.classList.toggle("bhb-mark--selected", state.selectedStepId === stepId);
        marker.classList.toggle("bhb-mark--hovered", state.hoveredStepId === stepId);
      }
    }
    return { render, highlight };
  }

  // src/ui/probe-layer.js
  function createProbeLayer(deps) {
    let layer = null;
    function ensureLayer() {
      if (!layer) {
        layer = mount(el("div", { class: "bhb-probes" }));
      }
      return layer;
    }
    function crosshairFor(probe, canvas, buffer, rect) {
      const resolved = resolvePoint(probe, buffer, deps.getScaleMode());
      const pos = bufferToClient(canvas, resolved.x, resolved.y, rect);
      return el(
        "div",
        {
          class: "bhb-probe",
          style: { left: `${pos.clientX}px`, top: `${pos.clientY}px` },
          title: probe.label
        },
        [el("span", { class: "bhb-probe__dot", style: { background: probe.hex } })]
      );
    }
    function render() {
      const node = ensureLayer();
      if (!deps.store.probesVisible()) {
        node.style.display = "none";
        node.replaceChildren();
        return;
      }
      const canvas = getCanvas();
      if (!canvas) {
        node.style.display = "none";
        return;
      }
      node.style.display = "block";
      const buffer = getBufferSize(canvas);
      const rect = canvas.getBoundingClientRect();
      node.replaceChildren(
        ...deps.getProbes().map((probe) => crosshairFor(probe, canvas, buffer, rect))
      );
    }
    return { render };
  }

  // src/bot/probe-editor.js
  function createProbeEditor(deps) {
    trackCursor();
    function captureAtCursor() {
      const target = getRenderTarget();
      if (!target) {
        deps.report(t("msg.noCanvas"));
        return null;
      }
      const cursor = getCursor();
      if (!cursor) {
        deps.report(t("msg.noMousePosition"));
        return null;
      }
      if (!isInsideCanvas(target.canvas, cursor.clientX, cursor.clientY)) {
        deps.report(t("msg.outsideCanvas"));
        return null;
      }
      const { canvas, gl } = target;
      const point = clientToBuffer(canvas, cursor.clientX, cursor.clientY);
      const pixel = readPixel(gl, point.x, point.y);
      if (!pixel) {
        deps.report(t("msg.noWebgl"));
        return null;
      }
      const buffer = getBufferSize(canvas);
      const probes = deps.getProbes();
      const probe = createProbe({
        x: point.x,
        y: point.y,
        bw: buffer.width,
        bh: buffer.height,
        hex: rgbToHex(pixel),
        label: t("probe.defaultName", { n: probes.length + 1 })
      });
      deps.setProbes([...probes, probe]);
      if (deps.onCaptured) {
        deps.onCaptured({ probe, clientX: cursor.clientX, clientY: cursor.clientY });
      }
      return probe;
    }
    function remove(probeId) {
      deps.setProbes(deps.getProbes().filter((probe) => probe.id !== probeId));
    }
    function clear() {
      deps.setProbes([]);
    }
    function scoreAll() {
      const target = getRenderTarget();
      const probes = deps.getProbes();
      if (!target) {
        return { buffer: null, scores: [] };
      }
      const { canvas, gl } = target;
      const buffer = getBufferSize(canvas);
      const mode = deps.getScaleMode();
      const tolerance = deps.getTolerance();
      const scores = probes.map((probe) => {
        const resolved = scoreProbe(probe, buffer, null, tolerance, mode).resolved;
        const live = readPixel(gl, resolved.x, resolved.y);
        return scoreProbe(probe, buffer, live, tolerance, mode);
      });
      return { buffer, scores };
    }
    return { captureAtCursor, remove, clear, scoreAll };
  }

  // src/ui/size-badge.js
  var DIM_AFTER_MS2 = 5e3;
  var NEAR_PX = 32;
  function createSizeBadge(deps) {
    let node = null;
    let dimTimer = null;
    let previousText = null;
    function ensureNode() {
      if (!node) {
        node = mount(el("div", { class: "bhb-size bhb-mono" }));
        window.addEventListener("mousemove", onMouseMove, { passive: true, capture: true });
      }
      return node;
    }
    function wake() {
      if (!node) {
        return;
      }
      node.classList.remove("bhb-size--dim");
      if (dimTimer !== null) {
        realClearTimeout(dimTimer);
      }
      dimTimer = realSetTimeout(() => {
        dimTimer = null;
        if (node) {
          node.classList.add("bhb-size--dim");
        }
      }, DIM_AFTER_MS2);
    }
    function onMouseMove(event) {
      if (!node || node.style.display === "none") {
        return;
      }
      const rect = node.getBoundingClientRect();
      const near = event.clientX >= rect.left - NEAR_PX && event.clientX <= rect.right + NEAR_PX && event.clientY >= rect.top - NEAR_PX && event.clientY <= rect.bottom + NEAR_PX;
      node.classList.toggle("bhb-size--near", near);
      if (near) {
        wake();
      }
    }
    function render() {
      const target = ensureNode();
      const canvas = getCanvas();
      if (!deps.isVisible() || !canvas) {
        target.style.display = "none";
        return;
      }
      target.style.display = "block";
      const clientWidth = Math.round(canvas.clientWidth);
      const clientHeight = Math.round(canvas.clientHeight);
      const sameSize = clientWidth === canvas.width && clientHeight === canvas.height;
      target.textContent = sameSize ? `${canvas.width}×${canvas.height}` : `${canvas.width}×${canvas.height} → ${clientWidth}×${clientHeight}`;
      target.title = t(sameSize ? "size.same" : "size.scaled");
      if (target.textContent !== previousText) {
        previousText = target.textContent;
        wake();
      }
    }
    return { render };
  }

  // src/ui/hotkeys.js
  function isTypingField(target) {
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement) && !(target instanceof HTMLSelectElement)) {
      return false;
    }
    if (target.closest(".bhb-panel, .bhb-probes, .bhb-drag, .bhb-hud")) {
      return true;
    }
    return target.offsetWidth > 1 && target.offsetHeight > 1;
  }
  function installHotkeys(bindings) {
    function onKeyDown(event) {
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }
      const target = event.target;
      if (target instanceof HTMLElement && target.isContentEditable) {
        return;
      }
      if (isTypingField(target)) {
        return;
      }
      const handler = bindings[event.key] || bindings[event.key.toLowerCase()];
      if (!handler) {
        return;
      }
      if (handler() === false) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }

  // src/ui/flash.js
  var LIFETIME_MS = 400;
  function showClickFlash(clientX, clientY) {
    const ring = mount(
      el("div", { class: "bhb-flash", style: { left: `${clientX}px`, top: `${clientY}px` } })
    );
    realRequestAnimationFrame(() => ring.classList.add("bhb-flash--out"));
    realSetTimeout(() => ring.remove(), LIFETIME_MS);
  }

  // src/ui/toast.js
  var LIFETIME_MS2 = 1800;
  var FADE_MS = 300;
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function showToast({ clientX, clientY, text, hex, isWarning }) {
    const bubble = mount(
      el("div", { class: `bhb-toast ${isWarning ? "bhb-toast--warn" : ""}` }, [
        hex ? el("span", { class: "bhb-toast__swatch", style: { background: hex } }) : null,
        el("span", { text })
      ])
    );
    const width = bubble.offsetWidth || 120;
    bubble.style.left = `${clamp(clientX, width / 2 + 8, window.innerWidth - width / 2 - 8)}px`;
    bubble.style.top = `${clamp(clientY - 34, 8, window.innerHeight - 40)}px`;
    realRequestAnimationFrame(() => bubble.classList.add("bhb-toast--in"));
    realSetTimeout(() => {
      bubble.classList.remove("bhb-toast--in");
      realSetTimeout(() => bubble.remove(), FADE_MS);
    }, LIFETIME_MS2);
    return bubble;
  }

  // src/main.js
  installCanvasPatch();
  installFocusPatch();
  installSpeedHack();
  var UI_REFRESH_MS = 500;
  function bootstrap() {
    installStyles();
    const settings = loadSettings();
    setLanguage(settings.language);
    const profileState = loadProfiles();
    const getSteps = () => getActiveProfile(profileState).steps;
    const getScreens = () => getActiveProfile(profileState).screens;
    const getActivities = () => getActiveProfile(profileState).activities;
    const persist = () => saveProfiles(profileState);
    const store = createUiStore();
    const watchdog = createWatchdog();
    const stats = createStats();
    const notifier = createNotifier({
      getConfig: () => settings.notify,
      getCanvas,
      report: (message) => engine.setMessage(message)
    });
    const engine = createEngine({
      getScriptSteps: getSteps,
      getScaleMode: () => settings.scaleMode,
      getScreens,
      getActivities,
      shouldCloseAfterRound: () => settings.closeAfterRound,
      closeGame: () => window.close(),
      shouldRecoverFromHang: () => settings.watchdog,
      recoverFromHang: (task) => watchdog.recover(task)
    });
    const stepEditor = createStepEditor({
      getSteps,
      persist,
      report: engine.setMessage,
      // A filter of null means All steps, and a new step there belongs to nobody.
      getCaptureActivity: () => store.get().stepFilter || null,
      // The status line is in a corner; the user is looking at the button they
      // just pointed at, so the confirmation goes there.
      onCaptured: ({ step, clientX, clientY, isSettled }) => {
        showClickFlash(clientX, clientY);
        showToast({
          clientX,
          clientY,
          text: isSettled ? t("toast.captured", { label: step.label }) : t("toast.capturedUnstable"),
          hex: step.hex,
          isWarning: !isSettled
        });
      }
    });
    const screenEditor = createScreenEditor({
      getScreens,
      persist,
      report: engine.setMessage,
      getScaleMode: () => settings.scaleMode
    });
    const queueEditor = createQueueEditor({ getActivities, persist });
    const probeEditor = createProbeEditor({
      getProbes: () => settings.probes,
      setProbes: (probes2) => {
        settings.probes = probes2;
        saveSettings(settings);
      },
      report: engine.setMessage,
      getTolerance: () => DEFAULT_COLOR_TOLERANCE,
      getScaleMode: () => settings.scaleMode,
      onCaptured: ({ probe, clientX, clientY }) => {
        showClickFlash(clientX, clientY);
        showToast({
          clientX,
          clientY,
          text: t("toast.probeCaptured", { label: probe.label }),
          hex: probe.hex
        });
      }
    });
    const dryRunner = createDryRunner({
      getSteps,
      getScreens,
      getScaleMode: () => settings.scaleMode,
      onTick: (run) => {
        store.setDryRun(run);
        markers.render();
      }
    });
    const refresh = () => {
      hud.render();
      panel.render();
      markers.render();
      probes.render();
      sizeBadge.render();
    };
    const LIVE_TABS = /* @__PURE__ */ new Set([Tab.TASKS, Tab.SCREENS]);
    const refreshLive = () => {
      hud.render();
      sizeBadge.render();
      const state = store.get();
      if (state.panelOpen && LIVE_TABS.has(state.tab)) {
        panel.render();
      }
    };
    const hud = createHud({ getEngineState: engine.getState, store });
    const profileActions = {
      list: () => profileState.profiles.map(({ id, name }) => ({ id, name })),
      activeId: () => getActiveProfile(profileState).id,
      activeName: () => getActiveProfile(profileState).name,
      create: (name) => {
        createProfile(profileState, name);
        persist();
      },
      duplicate: () => {
        duplicateProfile(profileState);
        persist();
      },
      rename: (id, name) => {
        renameProfile(profileState, id, name);
        persist();
      },
      remove: (id) => {
        deleteProfile(profileState, id);
        persist();
      },
      setActive: (id) => {
        setActiveProfile(profileState, id);
        persist();
      },
      exportAll: () => exportProfiles(profileState),
      importAll: (json) => {
        const imported = importProfiles(json);
        profileState.version = imported.version;
        profileState.activeProfileId = imported.activeProfileId;
        profileState.profiles = imported.profiles;
        persist();
      }
    };
    const panel = createPanel({
      store,
      stepEditor,
      screenEditor,
      queueEditor,
      dryRunner,
      probeEditor,
      getProbes: () => settings.probes,
      getSteps,
      getScreens,
      getActivities,
      getCloseAfterRound: () => settings.closeAfterRound,
      setCloseAfterRound: (value) => {
        settings.closeAfterRound = value;
        saveSettings(settings);
      },
      profiles: profileActions,
      settings,
      getReloadCount: () => watchdog.reloadCount(),
      getStats: () => stats.snapshot(),
      resetStats: () => stats.reset(),
      sendTestAlert: () => {
        notifier.clearCooldown();
        return notifier.notify(t("notify.testText"), "manual", { force: true });
      },
      updateSettings: (changes) => {
        Object.assign(settings, changes);
        saveSettings(settings);
        if (changes.language) {
          setLanguage(changes.language);
        }
        if (changes.canvasLock) {
          applyCanvasLock();
        }
      },
      getEngineState: engine.getState,
      toggleTask: engine.toggle,
      getRunTarget: () => settings.runTarget,
      setRunTarget: (target) => {
        settings.runTarget = target;
        saveSettings(settings);
      },
      runSelected: () => runSelected(),
      runActivity: (activityId) => {
        const engineState = engine.getState();
        if (engineState.activeTask === TaskId.SOLO && engineState.activity === activityId) {
          engine.stop();
          return;
        }
        engine.start(TaskId.SOLO, activityId);
      },
      getProfileName: () => getActiveProfile(profileState).name,
      refresh: () => refresh()
    });
    function runSelected() {
      const { taskId, activityId } = resolveRunTarget(settings.runTarget, getActivities());
      const state = engine.getState();
      const isOn = state.activeTask === taskId && (taskId !== TaskId.SOLO || state.activity === activityId);
      if (isOn) {
        engine.stop();
        return;
      }
      engine.start(taskId, activityId);
    }
    const markers = createMarkerLayer({
      getSteps,
      getScaleMode: () => settings.scaleMode,
      store
    });
    const probes = createProbeLayer({
      getProbes: () => settings.probes,
      getScaleMode: () => settings.scaleMode,
      store
    });
    const sizeBadge = createSizeBadge({ isVisible: () => settings.sizeBadge });
    function applyCanvasLock() {
      if (settings.canvasLock.enabled) {
        lockCanvasSize();
      } else {
        unlockCanvasSize();
      }
      sizeBadge.render();
    }
    applyCanvasLock();
    if (settings.keepAlive) {
      installKeepAlive(() => pumpFrame());
    }
    setClickObserver(showClickFlash);
    engine.on("change", () => refresh());
    engine.on("action", (entry) => {
      store.log(entry);
      stats.record(entry);
      if (settings.notify.events.includes(entry.kind)) {
        notifier.notify(`${t("app.name")} · ${describeEntry(entry)}`, entry.kind);
      }
      if (entry.kind === "task") {
        if (entry.started) {
          watchdog.arm(entry.label);
        } else {
          watchdog.disarm();
        }
      }
      if (entry.kind === "click") {
        watchdog.noteProgress();
      }
    });
    store.subscribe(() => refresh());
    store.onHighlight(() => {
      panel.highlight();
      markers.highlight();
    });
    onSpeedChange(() => {
      hud.render();
      panel.updateSpeed();
    });
    installHotkeys({
      // The keyboard reference has no key of its own; it opens from the panel.
      [Keys.PANEL]: () => store.togglePanel(),
      [Keys.CLOSE_PANEL]: () => {
        if (!store.get().panelOpen) {
          return false;
        }
        store.closePanel();
        refresh();
        return true;
      },
      [Keys.RUN]: () => {
        runSelected();
        refresh();
      },
      [Keys.CAPTURE]: () => {
        if (!store.get().isCaptureArmed) {
          engine.setMessage(t("msg.captureDisarmed"));
          return;
        }
        if (store.get().isAwaitingProbe) {
          probeEditor.captureAtCursor();
          store.awaitProbe(false);
          store.openPanel();
          refresh();
          return;
        }
        const pending = store.get().pendingPlaceStepId;
        stepEditor.captureAtCursor(pending).then(() => {
          if (pending) {
            store.awaitPlaceFor(null);
            store.openPanel();
          }
          refresh();
        });
      },
      [Keys.SPEED_RESET]: () => setSpeed(1),
      [Keys.SPEED_UP]: () => setSpeed(stepSpeed(getSpeed(), 1)),
      [Keys.SPEED_UP_ALT]: () => setSpeed(stepSpeed(getSpeed(), 1)),
      [Keys.SPEED_DOWN]: () => setSpeed(stepSpeed(getSpeed(), -1))
    });
    refresh();
    hud.wake();
    realSetInterval(refreshLive, UI_REFRESH_MS);
    const onCanvasMoved = () => {
      if (settings.canvasLock.enabled) {
        lockCanvasSize();
      }
      markers.render();
      probes.render();
      sizeBadge.render();
    };
    window.addEventListener("resize", onCanvasMoved);
    const canvas = getCanvas();
    if (canvas && typeof ResizeObserver === "function") {
      new ResizeObserver(onCanvasMoved).observe(canvas);
    }
    resumeAfterReload(engine, watchdog);
    console.info("[BHB] ready — press 1 for the keyboard reference");
  }
  function resumeAfterReload(engine, watchdog) {
    const task = watchdog.taskToResume();
    if (!task) {
      return;
    }
    engine.setMessage(`resuming ${task} in ${RESUME_DELAY / 1e3}s`);
    realSetTimeout(() => {
      if (!engine.getState().activeTask) {
        engine.start(task);
      }
    }, RESUME_DELAY);
  }
  function whenCanvasAppears(onReady) {
    const POLL_MS = 300;
    const GIVE_UP_MS = 5 * 60 * 1e3;
    if (getCanvas()) {
      onReady();
      return;
    }
    const startedAt = realNow();
    const timer = realSetInterval(() => {
      if (getCanvas()) {
        realClearInterval(timer);
        onReady();
      } else if (realNow() - startedAt > GIVE_UP_MS) {
        realClearInterval(timer);
      }
    }, POLL_MS);
  }
  function start() {
    whenCanvasAppears(bootstrap);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
