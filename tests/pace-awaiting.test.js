/**
 * A step gated to its own screen is a button the bot is parked in front of,
 * not a dead screen to back off from. Backing off the same as anywhere else
 * costs up to a second between the condition being met and the next look —
 * exactly the lag a party panel's Start button shows while nothing else on
 * screen is changing.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/core/input.js', () => ({
  clickBufferPoint: () => true,
  setClickObserver: () => {},
}));

let frame = () => ({ r: 0, g: 0, b: 0 });

vi.mock('../src/core/canvas.js', () => ({
  getRenderTarget: () => ({
    canvas: { width: 800, height: 600 },
    gl: {
      RGBA: 0,
      UNSIGNED_BYTE: 0,
      readPixels(x, y, w, h, _format, _type, out) {
        for (let row = 0; row < h; row += 1) {
          for (let col = 0; col < w; col += 1) {
            const { r, g, b } = frame(x + col, y + row);
            const offset = (row * w + col) * 4;
            out[offset] = r;
            out[offset + 1] = g;
            out[offset + 2] = b;
            out[offset + 3] = 255;
          }
        }
      },
    },
  }),
  getCanvas: () => ({ width: 800, height: 600 }),
  installCanvasPatch: () => {},
}));

/** The scheduler, kept real enough to drive by hand: one pending timeout at
 * a time, and every delay it was asked for is recorded for inspection. */
const delays = [];
let pending = null;
let now = 0;

vi.mock('../src/core/timers.js', () => ({
  realNow: () => now,
  realPerformanceNow: () => now,
  realSetTimeout: (cb, delay) => {
    delays.push(delay);
    pending = cb;
    return 1;
  },
  realClearTimeout: () => {
    pending = null;
  },
  realSetInterval: () => 0,
  realClearInterval: () => {},
  realRequestAnimationFrame: () => 0,
}));

function fire() {
  const cb = pending;
  pending = null;
  cb();
}

const { createEngine, TaskId } = await import('../src/core/engine.js');
const { captureFingerprint } = await import('../src/core/region.js');
const { createScreen } = await import('../src/bot/screen.js');
const { createStep } = await import('../src/bot/step.js');

const RED = { r: 255, g: 0, b: 0 };
const BLACK = { r: 0, g: 0, b: 0 };

function anchorOf(color) {
  return captureFingerprint(
    {
      RGBA: 0,
      UNSIGNED_BYTE: 0,
      readPixels: (x, y, w, h, _f, _t, out) => {
        for (let i = 0; i < w * h; i += 1) {
          out[i * 4] = color.r;
          out[i * 4 + 1] = color.g;
          out[i * 4 + 2] = color.b;
        }
      },
    },
    { x: 0, y: 0, w: 8, h: 8, bw: 800, bh: 600 }
  );
}

function build({ steps, screens }) {
  return createEngine({
    getScriptSteps: () => steps,
    getScaleMode: () => 'scale',
    getScreens: () => screens,
  });
}

beforeEach(() => {
  delays.length = 0;
  pending = null;
  now = 0;
  frame = () => BLACK;
});

describe('pace while parked on a gated step', () => {
  it('stays on the fastest rung when the expected step belongs to the screen on show', () => {
    const lobby = createScreen({ id: 'lobby', name: 'lobby', anchors: [anchorOf(RED)], tolerance: 0 });
    const start = createStep({
      label: 'Start',
      hex: '#00ff00',
      tolerance: 0,
      points: [{ x: 400, y: 300, bw: 800, bh: 600 }],
      screens: ['lobby'],
    });
    const engine = build({ steps: [start], screens: [lobby] });

    frame = () => RED; // the lobby screen, Start's colour not showing yet

    engine.start(TaskId.SCRIPT);
    expect(delays.at(-1)).toBe(300);
    for (let i = 0; i < 5; i += 1) {
      fire();
    }
    // A dead screen would have backed this off to 1000 by now.
    expect(delays.at(-1)).toBe(300);
    engine.stop();
  });

  it('still backs off when nothing expected belongs to the screen on show', () => {
    const elsewhere = createScreen({
      id: 'elsewhere',
      name: 'elsewhere',
      anchors: [anchorOf(RED)],
      tolerance: 0,
    });
    const start = createStep({
      label: 'Start',
      hex: '#00ff00',
      tolerance: 0,
      points: [{ x: 400, y: 300, bw: 800, bh: 600 }],
      screens: ['lobby'],
    });
    const engine = build({ steps: [start], screens: [elsewhere] });

    frame = () => RED;

    engine.start(TaskId.SCRIPT);
    for (let i = 0; i < 5; i += 1) {
      fire();
    }
    expect(delays.at(-1)).toBe(1000);
    engine.stop();
  });

  it('backs off for a step gated to no screen at all ("Anywhere")', () => {
    // An ungated step is allowed to fire on any screen, which is right for
    // matching it, but wrong for deciding whether the bot is parked at a
    // door: it is not waiting on *this* screen specifically, so a screen
    // that is not changing is still a dead one to back off from. Most
    // steps in an ordinary profile are ungated, so getting this wrong
    // keeps the whole bot at the fastest rung nearly all the time.
    const lobby = createScreen({ id: 'lobby', name: 'lobby', anchors: [anchorOf(RED)], tolerance: 0 });
    const start = createStep({
      label: 'Start',
      hex: '#00ff00',
      tolerance: 0,
      points: [{ x: 400, y: 300, bw: 800, bh: 600 }],
      // No `screens` at all: "Anywhere".
    });
    const engine = build({ steps: [start], screens: [lobby] });

    frame = () => RED; // some screen is on show, Start's colour not showing yet

    engine.start(TaskId.SCRIPT);
    for (let i = 0; i < 5; i += 1) {
      fire();
    }
    expect(delays.at(-1)).toBe(1000);
    engine.stop();
  });
});
