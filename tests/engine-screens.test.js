/**
 * The engine's half of the vision layer: detect once per tick, gate the steps,
 * and stop when a `stopsTask` screen shows up.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const clicks = [];

vi.mock('../src/core/input.js', () => ({
  clickBufferPoint: (_canvas, point) => {
    clicks.push(point);
    return true;
  },
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

const { createEngine, TaskId } = await import('../src/core/engine.js');
const { captureFingerprint } = await import('../src/core/region.js');
const { createScreen } = await import('../src/bot/screen.js');
const { createStep } = await import('../src/bot/step.js');

const RED = { r: 255, g: 0, b: 0 };
const BLUE = { r: 0, g: 0, b: 255 };

/** An anchor captured off a frame of one flat colour. */
function anchorOf(color) {
  return captureFingerprint(
    { RGBA: 0, UNSIGNED_BYTE: 0, readPixels: (x, y, w, h, _f, _t, out) => {
      for (let i = 0; i < w * h; i += 1) {
        out[i * 4] = color.r;
        out[i * 4 + 1] = color.g;
        out[i * 4 + 2] = color.b;
      }
    } },
    { x: 0, y: 0, w: 8, h: 8, bw: 800, bh: 600 }
  );
}

function build({ steps = [], screens = [] }) {
  return createEngine({
    getScriptSteps: () => steps,
    getRerunSteps: () => [],
    getWorldBossSteps: () => [],
    getScaleMode: () => 'scale',
    getScreens: () => screens,
  });
}

beforeEach(() => {
  clicks.length = 0;
  frame = () => RED;
});

describe('engine screen gating', () => {
  it('fires a gated step only on its own screen', () => {
    const loot = createScreen({ id: 'loot', name: 'loot', anchors: [anchorOf(RED)], tolerance: 0 });
    const step = createStep({
      label: 'yes',
      hex: '#ff0000',
      tolerance: 0,
      points: [{ x: 400, y: 300, bw: 800, bh: 600 }],
      screens: ['other'],
    });

    const engine = build({ steps: [step], screens: [loot] });
    frame = () => RED;

    engine.start(TaskId.SCRIPT);
    expect(engine.getState().screen).toBe('loot');
    expect(clicks, 'step belongs to another screen').toHaveLength(0);

    step.screens = ['loot'];
    engine.tick();
    expect(clicks).toHaveLength(1);
    engine.stop();
  });

  it('stops the task on a stopsTask screen', () => {
    const outOfTickets = createScreen({
      id: 'dry',
      name: 'out of tickets',
      anchors: [anchorOf(BLUE)],
      tolerance: 0,
      stopsTask: true,
    });

    const engine = build({ steps: [], screens: [outOfTickets] });
    const entries = [];
    engine.on('action', (entry) => entries.push(entry));

    frame = () => RED;
    engine.start(TaskId.SCRIPT);
    expect(engine.getState().activeTask).toBe(TaskId.SCRIPT);

    frame = () => BLUE;
    engine.tick();

    expect(engine.getState().activeTask).toBeNull();
    expect(entries.some((entry) => entry.kind === 'resource')).toBe(true);
  });

  it('logs a screen change once, not every tick', () => {
    const loot = createScreen({ id: 'loot', name: 'loot', anchors: [anchorOf(RED)], tolerance: 0 });
    const engine = build({ steps: [], screens: [loot] });
    const screenEntries = [];
    engine.on('action', (entry) => entry.kind === 'screen' && screenEntries.push(entry));

    frame = () => RED;
    engine.start(TaskId.SCRIPT);
    engine.tick();
    engine.tick();
    expect(screenEntries).toHaveLength(1);

    frame = () => BLUE;
    engine.tick();
    expect(screenEntries).toHaveLength(2);
    expect(engine.getState().screen).toBeNull();
    engine.stop();
  });
});
