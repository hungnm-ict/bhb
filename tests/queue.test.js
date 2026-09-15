/**
 * Run-All walks the queue. The interesting cases are all about when it gives
 * up on an activity and what happens when it comes back round.
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
const { createRule } = await import('../src/rules/model.js');
const { createScreen } = await import('../src/rules/screen.js');
const { captureFingerprint } = await import('../src/core/region.js');
const { IDLE_ADVANCE_TICKS } = await import('../src/core/constants.js');

const RED = { r: 255, g: 0, b: 0 };
const BLUE = { r: 0, g: 0, b: 255 };
/** Neither a rule colour nor an anchor: on screen, but nothing to do. */
const GREEN = { r: 0, g: 255, b: 0 };

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

function ruleFor(activity) {
  return createRule({
    label: activity,
    activity,
    hex: '#ff0000',
    tolerance: 0,
    points: [{ x: 400, y: 300, bw: 800, bh: 600 }],
  });
}

function build({ rules = [], screens = [], activities, closeAfterRound = false, closeGame } = {}) {
  return createEngine({
    getScriptRules: () => rules,
    getRerunRules: () => [],
    getWorldBossRules: () => [],
    getScaleMode: () => 'scale',
    getScreens: () => screens,
    getActivities: () => activities,
    shouldCloseAfterRound: () => closeAfterRound,
    closeGame,
  });
}

const QUEUE = [
  { id: 'pvp', name: 'PVP', enabled: true },
  { id: 'raid', name: 'Raid', enabled: true },
];

beforeEach(() => {
  clicks.length = 0;
  frame = () => RED;
});

describe('run-all queue', () => {
  it('starts at the top of the queue and runs only that activity\'s rules', () => {
    const engine = build({ rules: [ruleFor('pvp'), ruleFor('raid')], activities: [...QUEUE] });

    engine.start(TaskId.RUN_ALL);
    expect(engine.getState().activity).toBe('pvp');
    expect(engine.getState().round).toBe(1);
    // One click per tick, from PVP's rule only — both rules point at the
    // same colour, so two clicks would mean the queue is not filtering.
    expect(clicks).toHaveLength(1);
    engine.stop();
  });

  it('advances when an activity runs out of resources', () => {
    const dry = createScreen({
      id: 'dry',
      name: 'no tickets',
      anchors: [anchorOf(BLUE)],
      tolerance: 0,
      stopsTask: true,
    });
    const engine = build({ rules: [ruleFor('pvp')], screens: [dry], activities: [...QUEUE] });

    engine.start(TaskId.RUN_ALL);
    expect(engine.getState().activity).toBe('pvp');

    frame = () => BLUE;
    engine.tick();

    expect(engine.getState().activeTask).toBe(TaskId.RUN_ALL);
    expect(engine.getState().activity).toBe('raid');
    expect(engine.getState().spent).toEqual(['pvp']);
    engine.stop();
  });

  it('advances after enough ticks with nothing to click, and a match resets the count', () => {
    const engine = build({ rules: [ruleFor('pvp')], activities: [...QUEUE] });

    engine.start(TaskId.RUN_ALL);
    frame = () => BLUE; // nothing matches now

    for (let i = 0; i < IDLE_ADVANCE_TICKS - 2; i += 1) {
      engine.tick();
    }
    expect(engine.getState().activity).toBe('pvp');

    frame = () => RED; // a match resets the idle count
    engine.tick();
    frame = () => BLUE;
    for (let i = 0; i < IDLE_ADVANCE_TICKS - 1; i += 1) {
      engine.tick();
    }
    expect(engine.getState().activity).toBe('pvp');

    engine.tick();
    expect(engine.getState().activity).toBe('raid');
    engine.stop();
  });

  it('skips disabled activities', () => {
    const queue = [QUEUE[0], { ...QUEUE[1], enabled: false }, { id: 'gvg', name: 'GVG', enabled: true }];
    const dry = createScreen({
      id: 'dry',
      name: 'no tickets',
      anchors: [anchorOf(BLUE)],
      tolerance: 0,
      stopsTask: true,
    });
    const engine = build({ rules: [], screens: [dry], activities: queue });

    engine.start(TaskId.RUN_ALL);
    frame = () => BLUE;
    engine.tick();

    expect(engine.getState().activity).toBe('gvg');
    engine.stop();
  });

  it('wraps into a new round with a clean slate, then stops when a round finds everything spent', () => {
    const dry = createScreen({
      id: 'dry',
      name: 'no tickets',
      anchors: [anchorOf(BLUE)],
      tolerance: 0,
      stopsTask: true,
    });
    const engine = build({ rules: [], screens: [dry], activities: [...QUEUE] });
    const entries = [];
    engine.on('action', (entry) => entries.push(entry));

    engine.start(TaskId.RUN_ALL);
    frame = () => BLUE;

    engine.tick(); // pvp spent → raid
    expect(engine.getState().activity).toBe('raid');

    engine.tick(); // raid spent → wrap; both were spent, so it stops
    expect(engine.getState().activeTask).toBeNull();
    expect(entries.filter((entry) => entry.kind === 'resource')).toHaveLength(1);
  });

  it('starts a fresh round when only some activities were spent', () => {
    const dry = createScreen({
      id: 'dry',
      name: 'no tickets',
      anchors: [anchorOf(BLUE)],
      tolerance: 0,
      stopsTask: true,
    });
    const engine = build({ rules: [ruleFor('raid')], screens: [dry], activities: [...QUEUE] });

    engine.start(TaskId.RUN_ALL);
    frame = () => BLUE;
    engine.tick(); // pvp is spent → raid

    // Raid never runs dry, it just has nothing to click, so the queue wraps.
    frame = () => GREEN;
    for (let i = 0; i < IDLE_ADVANCE_TICKS; i += 1) {
      engine.tick();
    }

    expect(engine.getState().activeTask).toBe(TaskId.RUN_ALL);
    expect(engine.getState().activity).toBe('pvp');
    expect(engine.getState().round).toBe(2);
    expect(engine.getState().spent).toEqual([]);
    engine.stop();
  });

  it('closes the game after a round only when asked', () => {
    const closeGame = vi.fn();
    const engine = build({ rules: [], activities: [...QUEUE], closeAfterRound: true, closeGame });

    engine.start(TaskId.RUN_ALL);
    frame = () => BLUE;
    for (let i = 0; i < IDLE_ADVANCE_TICKS * 2; i += 1) {
      engine.tick();
    }

    expect(closeGame).toHaveBeenCalled();
    engine.stop();
  });
});
