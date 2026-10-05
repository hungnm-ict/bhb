/**
 * Timing a round: an `endsRun` step clicked under Run-All both ends the
 * activity's turn and is the one moment worth measuring. An idle advance
 * (Run-All giving up rather than the resource running out) must not be
 * folded in — it says how long the bot waited, not how long a round takes.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
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

let lit = new Set();

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

beforeEach(() => {
  lit = new Set();
  now = 1_000_000;
});

describe('measuring a round', () => {
  function build(recordAvgRound = () => {}) {
    const dungeonEnd = stepAt(100, 'd-end', { activity: 'dungeon', endsRun: true });
    const raidStart = stepAt(200, 'r-start', { activity: 'raid' });
    return {
      dungeonEnd,
      raidStart,
      engine: createEngine({
        getScriptSteps: () => [dungeonEnd, raidStart],
        getScaleMode: () => 'scale',
        getActivities: () => [
          { id: 'dungeon', name: 'Dungeon', enabled: true },
          { id: 'raid', name: 'Raid', enabled: true },
        ],
        recordAvgRound,
      }),
    };
  }

  it('records the elapsed time once the activity runs its resource dry', () => {
    const recorded = [];
    const { engine, dungeonEnd } = build((activityId, measurement) =>
      recorded.push({ activityId, measurement })
    );

    engine.start(TaskId.RUN_ALL);
    advance(70_000);
    lit = new Set([100]);
    engine.tick(); // clicks the endsRun step, ending dungeon's turn

    expect(recorded).toHaveLength(1);
    expect(recorded[0].activityId).toBe('dungeon');
    expect(recorded[0].measurement.avgRoundObserved).toBe(70);
    engine.stop();
  });

  it('does not record anything for an activity Run-All only idled away from', () => {
    const recorded = [];
    const { engine } = build((activityId, measurement) =>
      recorded.push({ activityId, measurement })
    );

    engine.start(TaskId.RUN_ALL);
    // Nothing matches for dungeon; the queue idles its way to raid instead
    // of dungeon's resource ever running out.
    lit = new Set();
    advance(IDLE_ADVANCE_MS + 1000);
    engine.tick();

    expect(recorded, 'an idle advance says nothing about a round length').toEqual([]);
    engine.stop();
  });

  it('shows a value already learned in an earlier session as soon as the activity is entered', () => {
    const dungeonEnd = stepAt(100, 'd-end', { activity: 'dungeon', endsRun: true });
    const engine = createEngine({
      getScriptSteps: () => [dungeonEnd],
      getScaleMode: () => 'scale',
      getActivities: () => [{ id: 'dungeon', name: 'Dungeon', enabled: true, avgRoundObserved: 55 }],
    });

    engine.start(TaskId.RUN_ALL);

    expect(engine.getState().activityAvgRoundSeconds).toBe(55);
    engine.stop();
  });
});
