// ==UserScript==
// @name         BHB
// @namespace    https://github.com/hungnm-ict/bhb
// @version      2.2.0
// @description  Automation userscript for a casual Gacha + Pokemon-catching + Fashion game
// @author       hungnm-ict
// @match        *://*.kongregate.com/*
// @match        *://*.bitheroesgame.com/*
// @run-at       document-start
// @grant        none
// @updateURL    https://raw.githubusercontent.com/hungnm-ict/bhb/master/dist/bhb.user.js
// @downloadURL  https://raw.githubusercontent.com/hungnm-ict/bhb/master/dist/bhb.user.js
// ==/UserScript==

(() => {
  // src/core/canvas.js
  var cachedCanvas = null;
  var cachedContext = null;
  var WEBGL_TYPES = ["webgl", "webgl2", "experimental-webgl"];
  function installCanvasPatch() {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, attributes) {
      if (WEBGL_TYPES.includes(type)) {
        attributes = { ...attributes || {}, preserveDrawingBuffer: true };
      }
      return original.call(this, type, attributes);
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

  // src/core/constants.js
  var STORAGE_KEY_PROFILES = "bhb.profiles.v2";
  var STORAGE_KEY_SETTINGS = "bhb.settings.v2";
  var STORAGE_KEY_LEGACY_RULES = "bh_script_rules_v1";
  var DEFAULT_COLOR_TOLERANCE = 15;
  var INTERVAL_RERUN_HUNT = 3e3;
  var INTERVAL_RERUN_REST = 2e4;
  var INTERVAL_WORLD_BOSS = 2e3;
  var INTERVAL_SCRIPT = 3e3;
  var INTERVAL_AUTO_STOP_CHECK = 5e3;
  var AUTO_STOP_TIMEOUT = 3 * 60 * 1e3;
  var CLICK_LOCKOUT_MS = 200;
  var CLICK_HOVER_RESET_MS = 100;
  var HOVER_RESET_POINT = { x: 5, y: 5 };
  var SPEED_MIN = 1;
  var SPEED_MAX = 10;
  var Z_TOP = "2147483647";

  // src/core/speed.js
  var speed = 1;
  var listeners = [];
  function getSpeed() {
    return speed;
  }
  function setSpeed(next) {
    const clamped = Math.max(SPEED_MIN, Math.min(SPEED_MAX, Math.round(next)));
    if (clamped === speed) {
      return;
    }
    speed = clamped;
    for (const listener of listeners) {
      listener(speed);
    }
  }
  function onSpeedChange(listener) {
    listeners.push(listener);
  }
  function createVirtualClock(readReal) {
    let virtual = null;
    let previous = null;
    return function read() {
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
    const credit = /* @__PURE__ */ new Map();
    let reentrant = false;
    window.requestAnimationFrame = function(callback) {
      if (reentrant) {
        return 1;
      }
      return realRequestAnimationFrame(() => {
        if (!credit.has(callback)) {
          credit.set(callback, 0);
          callback(performance.now());
          return;
        }
        if (speed <= 1) {
          callback(performance.now());
          return;
        }
        let owed = credit.get(callback) + speed;
        const startedAt = realPerformanceNow();
        reentrant = true;
        try {
          while (owed >= 1) {
            try {
              callback(performance.now());
            } catch (error) {
              console.error("[BHB] frame callback threw", error);
            }
            owed -= 1;
            if (realPerformanceNow() - startedAt > FRAME_BUDGET_MS) {
              owed = 0;
              break;
            }
          }
        } finally {
          reentrant = false;
        }
        credit.set(callback, owed);
      });
    };
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
  function resolvePoint(point2, buffer, mode = ScaleMode.SCALE) {
    if (mode === ScaleMode.ABSOLUTE || !point2.bw || !point2.bh) {
      return { x: point2.x, y: point2.y };
    }
    return {
      x: Math.round(point2.x / point2.bw * buffer.width),
      y: Math.round(point2.y / point2.bh * buffer.height)
    };
  }
  function isLegacyPoint(point2) {
    return !point2.bw || !point2.bh;
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
  function bufferToClient(canvas, bufferX, bufferY) {
    const rect = canvas.getBoundingClientRect();
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
    const targets = [canvas, document, window];
    for (const [type, family, buttons] of CLICK_SEQUENCE) {
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
  function resetHover(canvas) {
    const pos = bufferToClient(canvas, HOVER_RESET_POINT.x, HOVER_RESET_POINT.y);
    dispatchClickAt(canvas, pos.clientX, pos.clientY);
  }
  function clickBufferPoint(canvas, point2) {
    if (locked) {
      return false;
    }
    const pos = bufferToClient(canvas, point2.x, point2.y);
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

  // src/rules/model.js
  function createRuleId() {
    return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }
  function createRule(overrides = {}) {
    return {
      id: createRuleId(),
      label: "",
      points: [],
      hex: null,
      tolerance: DEFAULT_COLOR_TOLERANCE,
      enabled: true,
      ...overrides
    };
  }
  function isRuleReady(rule) {
    return Boolean(rule.enabled && rule.hex && rule.points.length > 0);
  }
  function colorForPoint(rule, point2) {
    return point2.hex || rule.hex;
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

  // src/core/engine.js
  var TaskId = Object.freeze({
    RERUN: "rerun",
    WORLD_BOSS: "wb",
    SCRIPT: "script"
  });
  var Phase = Object.freeze({
    HUNTING: "hunting",
    RESTING: "resting"
  });
  function createEngine(deps) {
    const emitter = createEmitter();
    const state = {
      /** @type {string | null} */
      activeTask: null,
      phase: Phase.HUNTING,
      lastActionAt: 0,
      lastMessage: ""
    };
    let pollTimer = null;
    let autoStopTimer = null;
    let restTimer = null;
    const TASKS = {
      [TaskId.RERUN]: { interval: INTERVAL_RERUN_HUNT, getRules: deps.getRerunRules },
      [TaskId.WORLD_BOSS]: { interval: INTERVAL_WORLD_BOSS, getRules: deps.getWorldBossRules },
      [TaskId.SCRIPT]: { interval: INTERVAL_SCRIPT, getRules: deps.getScriptRules }
    };
    function setMessage(message) {
      state.lastMessage = message;
      emitter.emit("change", getState());
    }
    function getState() {
      return {
        activeTask: state.activeTask,
        phase: state.phase,
        lastMessage: state.lastMessage,
        remainingMs: state.activeTask ? Math.max(0, AUTO_STOP_TIMEOUT - (realNow() - state.lastActionAt)) : 0
      };
    }
    function evaluateRules(rules, canvas, gl) {
      const buffer = getBufferSize(canvas);
      const scaleMode = deps.getScaleMode();
      for (const rule of rules) {
        if (!isRuleReady(rule)) {
          continue;
        }
        for (const storedPoint of rule.points) {
          const resolved = resolvePoint(storedPoint, buffer, scaleMode);
          const pixel = readPixel(gl, resolved.x, resolved.y);
          if (!pixel) {
            continue;
          }
          const expected = hexToRgb(colorForPoint(rule, storedPoint));
          if (!colorMatches(pixel, expected, rule.tolerance)) {
            continue;
          }
          return { rule, clicked: clickBufferPoint(canvas, resolved) };
        }
      }
      return null;
    }
    function tick() {
      if (!state.activeTask) {
        return;
      }
      if (state.activeTask === TaskId.RERUN && state.phase === Phase.RESTING) {
        return;
      }
      const target = getRenderTarget();
      if (!target) {
        setMessage("waiting for game canvas");
        return;
      }
      const task = TASKS[state.activeTask];
      const hit = evaluateRules(task.getRules(), target.canvas, target.gl);
      if (!hit) {
        setMessage(`${state.activeTask}: no match`);
        return;
      }
      if (hit.clicked) {
        state.lastActionAt = realNow();
        if (state.activeTask === TaskId.RERUN) {
          enterRestPhase();
        }
      }
      setMessage(`${hit.rule.label || hit.rule.id} → ${hit.clicked ? "click" : "busy"}`);
    }
    function enterRestPhase() {
      state.phase = Phase.RESTING;
      clearTimeout_(restTimer);
      restTimer = realSetTimeout(() => {
        restTimer = null;
        if (state.activeTask === TaskId.RERUN) {
          state.phase = Phase.HUNTING;
          setMessage("rerun: hunting");
        }
      }, INTERVAL_RERUN_REST);
      setMessage(`rerun: resting ${INTERVAL_RERUN_REST / 1e3}s`);
    }
    function clearInterval_(id) {
      if (id !== null && id !== void 0) {
        realClearInterval(id);
      }
    }
    function clearTimeout_(id) {
      if (id !== null && id !== void 0) {
        realClearTimeout(id);
      }
    }
    function checkAutoStop() {
      if (!state.activeTask) {
        return;
      }
      if (realNow() - state.lastActionAt >= AUTO_STOP_TIMEOUT) {
        const stopped = state.activeTask;
        stop();
        setMessage(`${stopped} auto-stopped (idle ${AUTO_STOP_TIMEOUT / 6e4}m)`);
      }
    }
    function start2(taskId) {
      if (!TASKS[taskId]) {
        throw new Error(`unknown task: ${taskId}`);
      }
      if (state.activeTask) {
        stop();
      }
      state.activeTask = taskId;
      state.phase = Phase.HUNTING;
      state.lastActionAt = realNow();
      pollTimer = realSetInterval(tick, TASKS[taskId].interval);
      autoStopTimer = realSetInterval(checkAutoStop, INTERVAL_AUTO_STOP_CHECK);
      setMessage(`${taskId} started`);
      tick();
    }
    function stop() {
      if (!state.activeTask) {
        return;
      }
      const stopped = state.activeTask;
      state.activeTask = null;
      state.phase = Phase.HUNTING;
      clearInterval_(pollTimer);
      clearInterval_(autoStopTimer);
      clearTimeout_(restTimer);
      pollTimer = autoStopTimer = restTimer = null;
      setMessage(`${stopped} stopped`);
    }
    function toggle(taskId) {
      if (state.activeTask === taskId) {
        stop();
      } else {
        start2(taskId);
      }
    }
    return { start: start2, stop, toggle, tick, getState, on: emitter.on, setMessage };
  }

  // src/core/storage.js
  var SCHEMA_VERSION = 2;
  function createDefaultState() {
    return {
      version: SCHEMA_VERSION,
      activeProfileId: "default",
      profiles: [{ id: "default", name: "Default", rules: [] }]
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
  function importLegacyRules() {
    const legacy = readJson(STORAGE_KEY_LEGACY_RULES);
    if (!Array.isArray(legacy)) {
      return [];
    }
    return legacy.filter((entry) => entry && typeof entry.x === "number").map(
      (entry) => createRule({
        label: "imported",
        points: [{ x: entry.x, y: entry.y }],
        hex: entry.hex ?? null,
        tolerance: entry.tol ?? DEFAULT_COLOR_TOLERANCE,
        enabled: entry.enabled !== false
      })
    );
  }
  function normaliseState(candidate) {
    if (!candidate || typeof candidate !== "object" || !Array.isArray(candidate.profiles) || candidate.profiles.length === 0) {
      return createDefaultState();
    }
    const profiles = candidate.profiles.filter((profile) => profile && typeof profile.id === "string").map((profile) => ({
      id: profile.id,
      name: typeof profile.name === "string" ? profile.name : profile.id,
      rules: Array.isArray(profile.rules) ? profile.rules : []
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
    const imported = importLegacyRules();
    if (imported.length > 0) {
      state.profiles[0].rules = imported;
      console.info(`[BHB] imported ${imported.length} rule(s) from bh-scripts`);
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
  function loadSettings() {
    const stored = readJson(STORAGE_KEY_SETTINGS) || {};
    return {
      scaleMode: stored.scaleMode === ScaleMode.ABSOLUTE ? ScaleMode.ABSOLUTE : ScaleMode.SCALE,
      language: stored.language === "en" ? "en" : "vi"
    };
  }

  // src/rules/builtin.js
  var BUILTIN_CAPTURE_BUFFER = { width: 800, height: 520 };
  function point(p) {
    return BUILTIN_CAPTURE_BUFFER ? { ...p, bw: BUILTIN_CAPTURE_BUFFER.width, bh: BUILTIN_CAPTURE_BUFFER.height } : { ...p };
  }
  var RERUN_RULES = [
    {
      id: "builtin-rerun",
      label: "Rerun",
      points: [point({ x: 410, y: 62, hex: "#a6d339" }), point({ x: 410, y: 62, hex: "#cbf067" })],
      hex: "#a6d339",
      tolerance: DEFAULT_COLOR_TOLERANCE,
      enabled: true
    }
  ];
  var WORLD_BOSS_RULES = [
    {
      id: "builtin-wb-start",
      label: "Ready/Start",
      points: [point({ x: 388, y: 66 })],
      hex: "#0a62d0",
      tolerance: DEFAULT_COLOR_TOLERANCE,
      enabled: true
    },
    {
      id: "builtin-wb-yes",
      label: "Yes",
      points: [point({ x: 356, y: 208 })],
      hex: "#9cd01f",
      tolerance: DEFAULT_COLOR_TOLERANCE,
      enabled: true
    },
    {
      id: "builtin-wb-regroup",
      label: "Regroup",
      points: [
        point({ x: 446, y: 58 }),
        point({ x: 442, y: 50 }),
        point({ x: 594, y: 40, hex: "#89b516" }),
        point({ x: 492, y: 56 })
      ],
      hex: "#9cd01f",
      tolerance: DEFAULT_COLOR_TOLERANCE,
      enabled: true
    }
  ];

  // src/i18n/vi.js
  var vi_default = {
    "app.name": "BHB",
    "app.tagline": "Bot tự động hoá",
    "task.rerun": "RERUN",
    "task.wb": "WB SOLO",
    "task.script": "SCRIPT",
    "task.on": "BẬT",
    "task.off": "TẮT",
    "phase.hunting": "đang tìm",
    "phase.resting": "nghỉ",
    "overlay.speed": "TỐC ĐỘ",
    "overlay.canvas": "CANVAS",
    "overlay.autoStop": "TỰ TẮT",
    "overlay.remaining": "còn",
    "overlay.rules": "RULE",
    "overlay.noRules": "(chưa có rule — bấm 6)",
    "overlay.awaitingColor": "(chờ màu)",
    "overlay.needsRecapture": "cần chụp lại",
    "overlay.profile": "PROFILE",
    "overlay.help": "trợ giúp",
    "overlay.collapse": "thu nhỏ",
    "help.title": "PHÍM TẮT",
    "help.close": "Bấm 1 để đóng",
    "help.sectionAuto": "TỰ ĐỘNG",
    "help.sectionRules": "RULE (chỉ dùng trong mode 6)",
    "help.sectionUi": "GIAO DIỆN",
    "help.sectionSpeed": "TỐC ĐỘ",
    "help.rerun": "Auto Rerun (tìm 3s, nghỉ 20s)",
    "help.wb": "Auto WB Solo (2s/lần)",
    "help.script": "Auto Script (3s/lần)",
    "help.savePosition": "Lưu vị trí tại con trỏ",
    "help.saveColor": "Lưu màu rule cuối (di chuột ra xa trước)",
    "help.deleteRule": "Xoá rule cuối",
    "help.toggleHelp": "Hiện/ẩn bảng này",
    "help.cycleOverlay": "Overlay: mở → thu nhỏ → ẩn",
    "help.addMode": "Vào/ra chế độ thêm rule",
    "help.speedUp": "Tăng tốc độ (+1)",
    "help.speedDown": "Giảm tốc độ (-1)",
    "help.footer": "Tự tắt sau 3 phút không click",
    "addMode.title": "CHẾ ĐỘ THÊM RULE",
    "addMode.savePosition": "lưu vị trí (ngay trên nút)",
    "addMode.saveColor": "lưu màu (đã di chuột ra xa)",
    "addMode.deleteRule": "xoá rule cuối",
    "addMode.exit": "thoát",
    "msg.noCanvas": "không thấy canvas",
    "msg.noWebgl": "không có WebGL",
    "msg.noMousePosition": "chưa có vị trí chuột",
    "msg.outsideCanvas": "con trỏ ngoài canvas",
    "msg.positionSaved": "đã lưu vị trí rule #{n} ({x}, {y}) — di chuột ra xa rồi bấm 9",
    "msg.colorSaved": "đã lưu màu rule #{n}: {hex}",
    "msg.colorAlreadySet": "rule #{n} đã có màu ({hex})",
    "msg.noRuleToColor": "chưa có rule nào",
    "msg.ruleDeleted": "đã xoá rule cuối",
    "msg.noRuleToDelete": "không có rule để xoá",
    "msg.addModeOn": "THÊM RULE: 0 lưu vị trí, 9 lưu màu",
    "msg.addModeOff": "thoát chế độ thêm rule ({n} rule)"
  };

  // src/i18n/en.js
  var en_default = {
    "app.name": "BHB",
    "app.tagline": "Automation bot",
    "task.rerun": "RERUN",
    "task.wb": "WB SOLO",
    "task.script": "SCRIPT",
    "task.on": "ON",
    "task.off": "OFF",
    "phase.hunting": "hunting",
    "phase.resting": "resting",
    "overlay.speed": "SPEED",
    "overlay.canvas": "CANVAS",
    "overlay.autoStop": "AUTO-STOP",
    "overlay.remaining": "in",
    "overlay.rules": "RULES",
    "overlay.noRules": "(no rules yet — press 6)",
    "overlay.awaitingColor": "(awaiting colour)",
    "overlay.needsRecapture": "needs re-capture",
    "overlay.profile": "PROFILE",
    "overlay.help": "help",
    "overlay.collapse": "collapse",
    "help.title": "KEYBOARD SHORTCUTS",
    "help.close": "Press 1 to close",
    "help.sectionAuto": "AUTOMATION",
    "help.sectionRules": "RULES (only inside mode 6)",
    "help.sectionUi": "INTERFACE",
    "help.sectionSpeed": "SPEED",
    "help.rerun": "Auto Rerun (hunt 3s, rest 20s)",
    "help.wb": "Auto WB Solo (every 2s)",
    "help.script": "Auto Script (every 3s)",
    "help.savePosition": "Save position at cursor",
    "help.saveColor": "Save last rule colour (move cursor away first)",
    "help.deleteRule": "Delete last rule",
    "help.toggleHelp": "Show/hide this panel",
    "help.cycleOverlay": "Overlay: expanded → compact → hidden",
    "help.addMode": "Enter/leave add-rule mode",
    "help.speedUp": "Increase speed (+1)",
    "help.speedDown": "Decrease speed (-1)",
    "help.footer": "Auto-stops after 3 minutes without a click",
    "addMode.title": "ADD RULE MODE",
    "addMode.savePosition": "save position (on the button)",
    "addMode.saveColor": "save colour (cursor moved away)",
    "addMode.deleteRule": "delete last rule",
    "addMode.exit": "exit",
    "msg.noCanvas": "no canvas found",
    "msg.noWebgl": "no WebGL context",
    "msg.noMousePosition": "no cursor position yet",
    "msg.outsideCanvas": "cursor is outside the canvas",
    "msg.positionSaved": "saved position for rule #{n} ({x}, {y}) — move away and press 9",
    "msg.colorSaved": "saved colour for rule #{n}: {hex}",
    "msg.colorAlreadySet": "rule #{n} already has a colour ({hex})",
    "msg.noRuleToColor": "no rule to colour yet",
    "msg.ruleDeleted": "deleted last rule",
    "msg.noRuleToDelete": "no rule to delete",
    "msg.addModeOn": "ADD RULE: 0 saves position, 9 saves colour",
    "msg.addModeOff": "left add-rule mode ({n} rules)"
  };

  // src/i18n/index.js
  var BUNDLES = { vi: vi_default, en: en_default };
  var active = vi_default;
  var activeCode = "vi";
  function setLanguage(code) {
    active = BUNDLES[code] || vi_default;
    activeCode = BUNDLES[code] ? code : "vi";
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

  // src/rules/capture.js
  function createRuleCapture(deps) {
    let active2 = false;
    let cursorX = null;
    let cursorY = null;
    window.addEventListener(
      "mousemove",
      (event) => {
        cursorX = event.clientX;
        cursorY = event.clientY;
      },
      true
    );
    function toggle() {
      active2 = !active2;
      deps.report(
        active2 ? t("msg.addModeOn") : t("msg.addModeOff", { n: deps.getRules().length })
      );
      return active2;
    }
    function savePosition() {
      const target = getRenderTarget();
      if (!target) {
        deps.report(t("msg.noCanvas"));
        return;
      }
      if (cursorX === null || cursorY === null) {
        deps.report(t("msg.noMousePosition"));
        return;
      }
      if (!isInsideCanvas(target.canvas, cursorX, cursorY)) {
        deps.report(t("msg.outsideCanvas"));
        return;
      }
      const point2 = clientToBuffer(target.canvas, cursorX, cursorY);
      const buffer = getBufferSize(target.canvas);
      const rules = deps.getRules();
      rules.push(
        createRule({ points: [{ ...point2, bw: buffer.width, bh: buffer.height }] })
      );
      deps.persist();
      deps.markers.showPendingMarker(point2.x, point2.y);
      deps.report(
        t("msg.positionSaved", { n: rules.length, x: point2.x, y: point2.y })
      );
    }
    function saveColor() {
      const target = getRenderTarget();
      if (!target) {
        deps.report(t("msg.noCanvas"));
        return;
      }
      const rules = deps.getRules();
      if (rules.length === 0) {
        deps.report(t("msg.noRuleToColor"));
        return;
      }
      const rule = rules[rules.length - 1];
      if (rule.hex) {
        deps.report(t("msg.colorAlreadySet", { n: rules.length, hex: rule.hex }));
        return;
      }
      const stored = rule.points[0];
      const pixel = readPixel(target.gl, stored.x, stored.y);
      if (!pixel) {
        deps.report(t("msg.noWebgl"));
        return;
      }
      rule.hex = rgbToHex(pixel);
      deps.persist();
      deps.markers.removePendingMarker();
      deps.report(t("msg.colorSaved", { n: rules.length, hex: rule.hex }));
    }
    function deleteLast() {
      const rules = deps.getRules();
      if (rules.length === 0) {
        deps.report(t("msg.noRuleToDelete"));
        return;
      }
      const removed = rules.pop();
      deps.persist();
      if (!removed.hex) {
        deps.markers.removePendingMarker();
      }
      deps.report(t("msg.ruleDeleted"));
    }
    return { toggle, savePosition, saveColor, deleteLast, isActive: () => active2 };
  }

  // src/ui/styles.js
  var CSS = `
.bhb-panel {
  position: fixed;
  z-index: ${Z_TOP};
  box-sizing: border-box;
  background: rgba(12, 14, 18, 0.92);
  color: #ddd;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9px;
  font: 11px/1.5 Consolas, Monaco, monospace;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
  pointer-events: none;
  user-select: none;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.bhb-overlay { top: 12px; right: 12px; padding: 8px 12px; }
.bhb-overlay--expanded { width: 250px; padding: 10px 12px; }
.bhb-overlay--party { width: 250px; padding: 10px 12px; border: 2px solid #a6d339; }

.bhb-row { display: flex; align-items: center; gap: 6px; }
.bhb-row--between { justify-content: space-between; }
.bhb-row--compact { gap: 10px; white-space: nowrap; }

.bhb-title { color: #fff; font-size: 12px; font-weight: 700; letter-spacing: .3px; }
.bhb-muted { color: #777; font-size: 10px; }
.bhb-hint { color: #8ec8ff; font-size: 10px; }
.bhb-key { color: #666; font-size: 9px; }

.bhb-dot {
  width: 7px; height: 7px; border-radius: 50%; flex: none;
  background: currentColor; box-shadow: 0 0 6px currentColor;
}
.bhb-dot--sm { width: 6px; height: 6px; box-shadow: 0 0 5px currentColor; }

.bhb-task { font-weight: 700; font-size: 11.5px; flex: 1; }
.bhb-task--on { color: #70e0a8; }
.bhb-task--off { color: #ff9966; }

.bhb-speed { font-weight: 700; font-size: 12.5px; }
.bhb-speed--boosted { color: #66ff66; }
.bhb-speed--normal { color: #ddd; }

.bhb-section {
  margin-top: 6px; padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, .10);
}
.bhb-section__label { color: #aaa; font-size: 10px; margin-bottom: 3px; }

.bhb-rule { display: flex; justify-content: space-between; gap: 6px; font-size: 10px; }
.bhb-rule--ready { color: #70e0a8; }
.bhb-rule--pending { color: #ffaa33; }
.bhb-rule--disabled { color: #666; }
.bhb-rule--legacy { color: #ff9966; }
.bhb-rule__coord { color: #8ec8ff; }

.bhb-message {
  color: #9aa; font-size: 10px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.bhb-help {
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 340px; padding: 16px 18px;
  font-size: 11.5px; line-height: 1.7;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.bhb-help__header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px; padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, .15);
}
.bhb-help__title { color: #fff; font-size: 14px; font-weight: 700; letter-spacing: .4px; }
.bhb-help__section {
  color: #8ec8ff; font-size: 10.5px; font-weight: 700;
  margin: 10px 0 4px;
}
.bhb-help__entry { display: flex; justify-content: space-between; gap: 10px; }
.bhb-help__entry b { font-weight: 700; }
.bhb-help__label { flex: 1; text-align: right; color: #ccc; }
.bhb-help__footer {
  margin-top: 12px; padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, .12);
  color: #888; font-size: 10px; text-align: center;
}

.bhb-addmode {
  top: 12px; left: 12px; padding: 10px 14px;
  background: rgba(255, 100, 50, 0.92);
  color: #fff; border: 2px solid #fff; border-radius: 8px;
  font-weight: 700; line-height: 1.5;
  box-shadow: 0 0 16px rgba(255, 100, 50, 0.8);
}
.bhb-addmode__title { font-size: 13px; }
.bhb-addmode__keys { font-size: 10px; margin-top: 4px; color: #ffe; font-weight: 400; }

.bhb-marker {
  position: fixed; width: 24px; height: 24px;
  transform: translate(-50%, -50%);
  border: 2px dashed #ffaa33; border-radius: 50%;
  box-shadow: 0 0 10px rgba(255, 170, 51, .8);
  pointer-events: none; z-index: ${Z_TOP};
  animation: bhb-pulse 1s ease-in-out infinite;
}

.bhb-flash {
  position: fixed; border-radius: 50%;
  pointer-events: none; z-index: ${Z_TOP};
}
.bhb-flash--ring {
  width: 22px; height: 22px;
  transform: translate(-50%, -50%) scale(0.4);
  border: 2px solid #00d4ff;
  box-shadow: 0 0 10px #00d4ff, 0 0 20px rgba(0, 212, 255, .6);
  transition: transform .35s cubic-bezier(.2, .8, .3, 1), opacity .35s ease-out;
}
.bhb-flash--ring.bhb-flash--out {
  transform: translate(-50%, -50%) scale(1.8); opacity: 0;
}

@keyframes bhb-pulse {
  0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: .5; transform: translate(-50%, -50%) scale(1.3); }
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

  // src/ui/dom.js
  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    if (props.class) {
      node.className = props.class;
    }
    if (props.text !== void 0) {
      node.textContent = props.text;
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

  // src/ui/overlay.js
  var OverlayState = Object.freeze({
    EXPANDED: "expanded",
    COMPACT: "compact",
    HIDDEN: "hidden"
  });
  var CYCLE = [OverlayState.EXPANDED, OverlayState.COMPACT, OverlayState.HIDDEN];
  var TASK_LABELS = {
    [TaskId.RERUN]: "task.rerun",
    [TaskId.WORLD_BOSS]: "task.wb",
    [TaskId.SCRIPT]: "task.script"
  };
  var TASK_KEYS = {
    [TaskId.RERUN]: "3",
    [TaskId.WORLD_BOSS]: "4",
    [TaskId.SCRIPT]: "5"
  };
  function createOverlay(deps) {
    let state = OverlayState.COMPACT;
    let panel = null;
    let customRenderer = null;
    function ensurePanel() {
      if (!panel) {
        panel = mount(el("div", { class: "bhb-panel bhb-overlay" }));
      }
      return panel;
    }
    function formatRemaining(ms) {
      const total = Math.floor(ms / 1e3);
      const minutes = Math.floor(total / 60);
      const seconds = String(total % 60).padStart(2, "0");
      return `${minutes}m${seconds}s`;
    }
    function describeFramebuffer() {
      const canvas = getCanvas();
      if (!canvas) {
        return "—";
      }
      const css = `${Math.round(canvas.clientWidth)}×${Math.round(canvas.clientHeight)}`;
      return `${canvas.width}×${canvas.height} → ${css}`;
    }
    function taskClass(engine, taskId) {
      return engine.activeTask === taskId ? "bhb-task--on" : "bhb-task--off";
    }
    function renderCompact(engine) {
      const node = ensurePanel();
      node.className = "bhb-panel bhb-overlay";
      const speed2 = getSpeed();
      const chips = Object.keys(TASK_LABELS).map(
        (taskId) => el("span", { class: `bhb-row ${taskClass(engine, taskId)}`, style: { gap: "5px", fontWeight: "700" } }, [
          el("span", { class: "bhb-dot bhb-dot--sm" }),
          t(TASK_LABELS[taskId])
        ])
      );
      node.replaceChildren(
        el("div", { class: "bhb-row bhb-row--compact" }, [
          ...chips,
          el("span", {
            class: `bhb-speed ${speed2 > 1 ? "bhb-speed--boosted" : "bhb-speed--normal"}`,
            text: `${speed2}×`
          }),
          el("span", { class: "bhb-hint", text: `1 ${t("overlay.help")} · 2 ⬜` })
        ])
      );
    }
    function renderRuleList(rules) {
      if (rules.length === 0) {
        return [el("div", { class: "bhb-rule bhb-rule--pending", text: t("overlay.noRules") })];
      }
      return rules.map((rule, index) => {
        const first = rule.points[0];
        const legacy = first && isLegacyPoint(first);
        let modifier = "bhb-rule--ready";
        let label = rule.hex ?? "";
        if (!rule.hex) {
          modifier = "bhb-rule--pending";
          label = t("overlay.awaitingColor");
        } else if (!rule.enabled) {
          modifier = "bhb-rule--disabled";
        } else if (legacy) {
          modifier = "bhb-rule--legacy";
          label = `${rule.hex} ⚠`;
        }
        return el("div", { class: `bhb-rule ${modifier}` }, [
          el("span", { text: `${index + 1}. ${rule.label || label}` }),
          el("span", {
            class: "bhb-rule__coord",
            text: first ? `${first.x} ${first.y}` : "—"
          })
        ]);
      });
    }
    function renderTaskRow(engine, taskId) {
      const active2 = engine.activeTask === taskId;
      const phase = active2 && taskId === TaskId.RERUN ? ` [${t(engine.phase === Phase.RESTING ? "phase.resting" : "phase.hunting")}]` : "";
      return el("div", { class: `bhb-row ${taskClass(engine, taskId)}`, style: { marginBottom: "3px" } }, [
        el("span", { class: "bhb-dot" }),
        el("span", {
          class: "bhb-task",
          text: `${t(TASK_LABELS[taskId])} ${t(active2 ? "task.on" : "task.off")}${phase}`
        }),
        el("span", { class: "bhb-key", text: TASK_KEYS[taskId] })
      ]);
    }
    function renderExpanded(engine) {
      const node = ensurePanel();
      node.className = "bhb-panel bhb-overlay bhb-overlay--expanded";
      const rules = deps.getRules();
      const speed2 = getSpeed();
      node.replaceChildren(
        el("div", { class: "bhb-row bhb-row--between", style: { marginBottom: "7px" } }, [
          el("span", { class: "bhb-title", text: `${t("app.name")} ${t("app.tagline")}` }),
          el("span", { class: "bhb-muted", text: deps.getProfileName() })
        ]),
        ...Object.keys(TASK_LABELS).map((taskId) => renderTaskRow(engine, taskId)),
        el("div", { class: "bhb-row bhb-row--between bhb-section" }, [
          el("span", { class: "bhb-muted", text: t("overlay.speed") }),
          el("span", {
            class: `bhb-speed ${speed2 > 1 ? "bhb-speed--boosted" : "bhb-speed--normal"}`,
            text: `${speed2}×`
          })
        ]),
        el("div", { class: "bhb-row bhb-row--between" }, [
          el("span", { class: "bhb-muted", text: t("overlay.canvas") }),
          el("span", { class: "bhb-rule__coord", text: describeFramebuffer() })
        ]),
        el("div", { class: "bhb-row bhb-row--between" }, [
          el("span", { class: "bhb-muted", text: t("overlay.autoStop") }),
          el("span", {
            class: "bhb-muted",
            style: { color: engine.activeTask ? "#ffaa33" : "#666" },
            text: engine.activeTask ? `${t("overlay.remaining")} ${formatRemaining(engine.remainingMs)}` : "---"
          })
        ]),
        el("div", { class: "bhb-section" }, [
          el("div", { class: "bhb-section__label", text: `${t("overlay.rules")} (${rules.length})` }),
          ...renderRuleList(rules)
        ]),
        el("div", { class: "bhb-row bhb-row--between bhb-section bhb-hint" }, [
          el("span", { text: `1 · ${t("overlay.help")}` }),
          el("span", { text: `2 · ${t("overlay.collapse")}` })
        ]),
        el("div", { class: "bhb-section" }, [
          el("div", { class: "bhb-message", text: engine.lastMessage || " " })
        ])
      );
    }
    function render() {
      if (customRenderer) {
        const handled = customRenderer(ensurePanel());
        if (handled !== false) {
          return;
        }
      }
      const node = ensurePanel();
      if (state === OverlayState.HIDDEN) {
        node.style.display = "none";
        return;
      }
      node.style.display = "block";
      const engine = deps.getEngineState();
      if (state === OverlayState.EXPANDED) {
        renderExpanded(engine);
      } else {
        renderCompact(engine);
      }
    }
    function cycle() {
      state = CYCLE[(CYCLE.indexOf(state) + 1) % CYCLE.length];
      render();
    }
    function setCustomRenderer(renderer) {
      customRenderer = renderer;
      render();
    }
    return { render, cycle, setCustomRenderer, getState: () => state };
  }

  // src/ui/help.js
  var SECTIONS = [
    {
      title: "help.sectionAuto",
      color: "#70e0a8",
      entries: [
        ["3", "help.rerun"],
        ["4", "help.wb"],
        ["5", "help.script"]
      ]
    },
    {
      title: "help.sectionRules",
      color: "#ffaa33",
      entries: [
        ["0", "help.savePosition"],
        ["9", "help.saveColor"],
        ["8", "help.deleteRule"]
      ]
    },
    {
      title: "help.sectionUi",
      color: "#8ec8ff",
      entries: [
        ["1", "help.toggleHelp"],
        ["2", "help.cycleOverlay"],
        ["6", "help.addMode"]
      ]
    },
    {
      title: "help.sectionSpeed",
      color: "#66ff66",
      entries: [
        ["= / +", "help.speedUp"],
        ["-", "help.speedDown"]
      ]
    }
  ];
  function createHelpPanel() {
    let panel = null;
    let visible = false;
    function build() {
      const sections = SECTIONS.flatMap((section) => [
        el("div", { class: "bhb-help__section", text: `▸ ${t(section.title)}` }),
        ...section.entries.map(
          ([key, labelKey]) => el("div", { class: "bhb-help__entry" }, [
            el("b", { text: key, style: { color: section.color } }),
            el("span", { class: "bhb-help__label", text: t(labelKey) })
          ])
        )
      ]);
      return el("div", { class: "bhb-panel bhb-help" }, [
        el("div", { class: "bhb-help__header" }, [
          el("span", { class: "bhb-help__title", text: `📖 ${t("help.title")}` }),
          el("span", { class: "bhb-muted", text: t("help.close") })
        ]),
        ...sections,
        el("div", { class: "bhb-help__footer", text: t("help.footer") })
      ]);
    }
    function toggle() {
      visible = !visible;
      if (panel) {
        panel.remove();
        panel = null;
      }
      if (visible) {
        panel = mount(build());
      }
    }
    return { toggle, isVisible: () => visible };
  }

  // src/ui/addmode.js
  function createAddModeBadge() {
    let badge = null;
    function build() {
      return el("div", { class: "bhb-panel bhb-addmode" }, [
        el("div", { class: "bhb-addmode__title", text: `🔴 ${t("addMode.title")}` }),
        el("div", { class: "bhb-addmode__keys" }, [
          el("div", { text: `0 · ${t("addMode.savePosition")}` }),
          el("div", { text: `9 · ${t("addMode.saveColor")}` }),
          el("div", { text: `8 · ${t("addMode.deleteRule")}` }),
          el("div", { text: `6 · ${t("addMode.exit")}` })
        ])
      ]);
    }
    function setVisible(visible) {
      if (badge) {
        badge.remove();
        badge = null;
      }
      if (visible) {
        badge = mount(build());
      }
    }
    return { setVisible };
  }

  // src/ui/hotkeys.js
  function installHotkeys(bindings) {
    function onKeyDown(event) {
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }
      const target = event.target;
      if (target instanceof HTMLElement && target.isContentEditable) {
        return;
      }
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        return;
      }
      const handler = bindings[event.key];
      if (!handler) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      handler();
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }

  // src/ui/marker.js
  var FLASH_LIFETIME_MS = 400;
  var pendingMarker = null;
  function showPendingMarker(bufferX, bufferY) {
    removePendingMarker();
    const canvas = getCanvas();
    if (!canvas) {
      return;
    }
    const pos = bufferToClient(canvas, bufferX, bufferY);
    pendingMarker = mount(
      el("div", {
        class: "bhb-marker",
        style: { left: `${pos.clientX}px`, top: `${pos.clientY}px` }
      })
    );
  }
  function removePendingMarker() {
    pendingMarker?.remove();
    pendingMarker = null;
  }
  function showClickFlash(clientX, clientY) {
    const ring = mount(
      el("div", {
        class: "bhb-flash bhb-flash--ring",
        style: { left: `${clientX}px`, top: `${clientY}px` }
      })
    );
    realRequestAnimationFrame(() => ring.classList.add("bhb-flash--out"));
    realSetTimeout(() => ring.remove(), FLASH_LIFETIME_MS);
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
    let profileState = loadProfiles();
    const getRules = () => getActiveProfile(profileState).rules;
    const persist = () => saveProfiles(profileState);
    const engine = createEngine({
      getScriptRules: getRules,
      getRerunRules: () => RERUN_RULES,
      getWorldBossRules: () => WORLD_BOSS_RULES,
      getScaleMode: () => settings.scaleMode
    });
    const overlay = createOverlay({
      getEngineState: engine.getState,
      getRules,
      getProfileName: () => getActiveProfile(profileState).name
    });
    const help = createHelpPanel();
    const addModeBadge = createAddModeBadge();
    const capture = createRuleCapture({
      getRules,
      persist,
      report: engine.setMessage,
      markers: { showPendingMarker, removePendingMarker }
    });
    setClickObserver(showClickFlash);
    engine.on("change", overlay.render);
    onSpeedChange(overlay.render);
    installHotkeys({
      "1": () => help.toggle(),
      "2": () => overlay.cycle(),
      "3": () => engine.toggle(TaskId.RERUN),
      "4": () => engine.toggle(TaskId.WORLD_BOSS),
      "5": () => engine.toggle(TaskId.SCRIPT),
      "6": () => addModeBadge.setVisible(capture.toggle()),
      "0": () => capture.isActive() && capture.savePosition(),
      "9": () => capture.isActive() && capture.saveColor(),
      "8": () => capture.isActive() && capture.deleteLast(),
      "=": () => setSpeed(getSpeed() + 1),
      "+": () => setSpeed(getSpeed() + 1),
      "-": () => setSpeed(getSpeed() - 1)
    });
    overlay.render();
    realSetInterval(overlay.render, UI_REFRESH_MS);
    console.info("[BHB] ready — press 1 for the keyboard reference");
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
