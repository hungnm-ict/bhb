/**
 * Timing a fight: a `restAuto` step's click opens the clock, the matching
 * `endsTimer` step's click closes it, and what happened in between — the
 * activity it belonged to, whether the task kept running, how long it
 * took — decides what gets written back and to which step.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IDLE_ADVANCE_MS } from '../src/core/constants.js';

vi.mock('../src/core/input.js', () => ({
  clickBufferPoint: () => true,
  dispatchKey: () => {},
  setClickObserver: () => {},
}));

let now = 1_000_000;
function advance(ms) {
  now += ms;
}

vi.mock('../src/core/timers.js', () => ({
  realNow: () => now,
  realPerformanceNow: () => 0,
  realSetTimeout: () => 0,
  realClearTimeout: () => {},
  realSetInterval: () => 0,
  realClearInterval: () => {},
  realRequestAnimationFrame: () => 0,
}));

vi.mock('../src/core/canvas.js', () => ({
  getRenderTarget: () => ({
    canvas: { width: 800, height: 600 },
    gl: {
      RGBA: 0,
      UNSIGNED_BYTE: 0,
      readPixels(x, y, w, h, _format, _type, out) {
        for (let row = 0; row < h; row += 1) {
          for (let col = 0; col < w; col += 1) {
            const on = lit.has(x + col);
            const offset = (row * w + col) * 4;
            out[offset] = on ? 255 : 0;
            out[offset + 1] = 0;
            out[offset + 2] = on ? 0 : 255;
            out[offset + 3] = 255;
          }
        }
      },
    },
  }),
  getCanvas: () => ({ width: 800, height: 600 }),
  installCanvasPatch: () => {},
}));

let lit = new Set();

const { createEngine, TaskId } = await import('../src/core/engine.js');
const { createStep } = await import('../src/bot/step.js');

function stepAt(x, label, overrides = {}) {
  return createStep({
    label,
    hex: '#ff0000',
    tolerance: 0,
    points: [{ x, y: 300, bw: 800, bh: 600 }],
    ...overrides,
  });
}

// `getActivities` matters for the two tests that start the SOLO task by
// activity id: without it, `start(TaskId.SOLO, 'dungeon')` cannot resolve
// 'dungeon' and `state.activity` stays null.
function build(steps, recordRestMeasurement = () => {}) {
  return createEngine({
    getScriptSteps: () => steps,
    getScaleMode: () => 'scale',
    getActivities: () => [{ id: 'dungeon', name: 'Dungeon', enabled: true }],
    recordRestMeasurement,
  });
}

beforeEach(() => {
  lit = new Set();
  now = 1_000_000;
});

describe('measuring a fight', () => {
  it('writes the elapsed real time back to the restAuto step', () => {
    const recorded = [];
    const start = stepAt(100, 'start', { activity: 'dungeon', restAuto: true });
    const end = stepAt(200, 'end', { activity: 'dungeon', endsTimer: true });
    const engine = build([start, end], (stepId, measurement) =>
      recorded.push({ stepId, measurement })
    );

    lit = new Set([100]);
    engine.start(TaskId.SOLO, 'dungeon');
    expect(recorded).toEqual([]);

    advance(40_000);
    lit = new Set([200]);
    engine.tick();

    expect(recorded).toHaveLength(1);
    expect(recorded[0].stepId).toBe(start.id);
    expect(recorded[0].measurement.restObserved).toBe(40);
    expect(recorded[0].measurement.restSec).toBe(46);
    engine.stop();
  });

  it('does not close a different activity\'s timer', () => {
    // Only Run-All's queue ever puts two different activities' steps in
    // front of the engine in the same run — Script and Solo each see one
    // activity's steps (or the loose set) at a time, so this is the one
    // real path that can interleave them.
    const recorded = [];
    const dungeonStart = stepAt(100, 'd-start', { activity: 'dungeon', restAuto: true });
    const dungeonEnd = stepAt(150, 'd-end', { activity: 'dungeon', endsTimer: true });
    const raidEnd = stepAt(200, 'r-end', { activity: 'raid', endsTimer: true });
    const engine = createEngine({
      getScriptSteps: () => [dungeonStart, dungeonEnd, raidEnd],
      getScaleMode: () => 'scale',
      getActivities: () => [
        { id: 'dungeon', name: 'Dungeon', enabled: true },
        { id: 'raid', name: 'Raid', enabled: true },
      ],
      recordRestMeasurement: (stepId, measurement) => recorded.push({ stepId, measurement }),
    });

    lit = new Set([100]);
    engine.start(TaskId.RUN_ALL); // clicks dungeonStart during the internal tick()
    expect(recorded).toEqual([]);

    // Nothing else matches for dungeon; the queue idles its way to Raid.
    lit = new Set();
    advance(IDLE_ADVANCE_MS + 1000);
    engine.tick();

    lit = new Set([200]); // raid's own end-timer step, not dungeon's
    engine.tick();

    expect(recorded, 'a different activity must not close this one').toEqual([]);
    engine.stop();
  });

  it('discards the measurement if the task stopped before the end-timer fired', () => {
    const recorded = [];
    const start = stepAt(100, 'start', { activity: 'dungeon', restAuto: true });
    const end = stepAt(200, 'end', { activity: 'dungeon', endsTimer: true });
    const engine = build([start, end], (stepId, measurement) =>
      recorded.push({ stepId, measurement })
    );

    lit = new Set([100]);
    engine.start(TaskId.SOLO, 'dungeon');
    engine.stop();

    lit = new Set([200]);
    engine.start(TaskId.SOLO, 'dungeon');
    engine.tick();

    expect(recorded, 'the half-measurement from before stop() must not surface').toEqual([]);
    engine.stop();
  });

  it('discards a measurement past the ceiling rather than writing a huge rest', async () => {
    const { REST_CEILING_SEC } = await import('../src/bot/step.js');
    const recorded = [];
    const start = stepAt(100, 'start', { activity: 'dungeon', restAuto: true });
    const end = stepAt(200, 'end', { activity: 'dungeon', endsTimer: true });
    const engine = build([start, end], (stepId, measurement) =>
      recorded.push({ stepId, measurement })
    );

    lit = new Set([100]);
    engine.start(TaskId.SOLO, 'dungeon');

    advance((REST_CEILING_SEC + 5) * 1000);
    lit = new Set([200]);
    engine.tick();

    expect(recorded).toEqual([]);
    engine.stop();
  });

  it('does not open a self-closed loop when a step is both restAuto and endsTimer', () => {
    const recorded = [];
    const both = stepAt(100, 'both', { activity: 'dungeon', restAuto: true, endsTimer: true });
    const engine = build([both], (stepId, measurement) =>
      recorded.push({ stepId, measurement })
    );

    lit = new Set([100]);
    engine.start(TaskId.SOLO, 'dungeon');

    // Only one click has happened; there is nothing to close yet.
    expect(recorded).toEqual([]);
    engine.stop();
  });

  it('is a silent no-op when an endsTimer step fires with nothing pending', () => {
    // No restAuto step in this list at all — the ordinary case on almost
    // every tick of almost every activity that has not opted into this.
    const recorded = [];
    const end = stepAt(100, 'end', { activity: 'dungeon', endsTimer: true });
    const engine = build([end], (stepId, measurement) =>
      recorded.push({ stepId, measurement })
    );

    lit = new Set([100]);
    expect(() => engine.start(TaskId.SOLO, 'dungeon')).not.toThrow();

    expect(recorded).toEqual([]);
    engine.stop();
  });

  it('exposes the learned seconds in engine state once a measurement lands', () => {
    const start = stepAt(100, 'start', { activity: 'dungeon', restAuto: true });
    const end = stepAt(200, 'end', { activity: 'dungeon', endsTimer: true });
    const engine = build([start, end]);

    lit = new Set([100]);
    engine.start(TaskId.SOLO, 'dungeon');
    expect(engine.getState().activityRestSeconds).toBe(0);

    advance(40_000);
    lit = new Set([200]);
    engine.tick();

    expect(engine.getState().activityRestSeconds).toBe(40);
    engine.stop();
  });

  it('shows a value already learned in an earlier session as soon as the activity starts', () => {
    const start = stepAt(100, 'start', {
      activity: 'dungeon',
      restAuto: true,
      restObserved: 55,
    });
    const engine = build([start]);

    engine.start(TaskId.SOLO, 'dungeon');

    expect(engine.getState().activityRestSeconds).toBe(55);
    engine.stop();
  });

  it('starts over instead of blending when the step is now asking for a different speed', () => {
    const recorded = [];
    // A history of 40s at 1x; the step has since been set to ask for 10x.
    const start = stepAt(100, 'start', {
      activity: 'dungeon',
      restAuto: true,
      restObserved: 40,
      restSpeedTo: 1,
      speedTo: 10,
    });
    const end = stepAt(200, 'end', { activity: 'dungeon', endsTimer: true });
    const engine = build([start, end], (stepId, measurement) =>
      recorded.push({ stepId, measurement })
    );

    lit = new Set([100]);
    engine.start(TaskId.SOLO, 'dungeon');

    advance(8_000);
    lit = new Set([200]);
    engine.tick();

    expect(recorded).toHaveLength(1);
    // Not blended with the 40s/1x history: this run's 8s at 10x stands alone.
    expect(recorded[0].measurement.restObserved).toBe(8);
    expect(recorded[0].measurement.restSpeedTo).toBe(10);
    engine.stop();
  });
});
