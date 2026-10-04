/**
 * The poll that notices a tagged Screen and switches the Run target to
 * match: edge-triggered (fires once per new match, not once per tick),
 * never while the engine is resting, never on an ambiguous or stale match.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

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
}));

/** Captures the interval callback so a test can fire ticks by hand. */
let tickFn = null;
vi.mock('../src/core/timers.js', () => ({
  realSetInterval: (fn) => {
    tickFn = fn;
    return 1;
  },
  realClearInterval: () => {
    tickFn = null;
  },
}));

function tick() {
  tickFn();
}

const { createAutoSwitch } = await import('../src/core/autoswitch.js');
const { captureFingerprint } = await import('../src/core/region.js');
const { createScreen } = await import('../src/bot/screen.js');

const RED = { r: 255, g: 0, b: 0 };
const BLUE = { r: 0, g: 0, b: 255 };

/** An anchor captured off a frame of one flat colour. */
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

function screenFor(color, activityId) {
  return createScreen({
    name: activityId,
    anchors: [anchorOf(color)],
    tolerance: 0,
    triggerActivity: activityId,
  });
}

function build({ screens = [], activities = [], restingMs = 0, activeTask = null, runTarget = null }) {
  const setRunTarget = vi.fn((target) => {
    runTarget = target;
  });
  const autoSwitch = createAutoSwitch({
    getScreens: () => screens,
    getActivities: () => activities,
    getEngineState: () => ({ restingMs, activeTask }),
    getRunTarget: () => runTarget,
    setRunTarget,
    getScaleMode: () => 'scale',
  });
  return {
    autoSwitch,
    setRunTarget,
    setResting: (ms) => { restingMs = ms; },
    setActiveTask: (task) => { activeTask = task; },
    // A manual pick from the Run tab's own dropdown, not something this
    // poll called, so setRunTarget (the spy) must not record it.
    pickManually: (target) => { runTarget = target; },
  };
}

/** The poll only forgets a match after this many consecutive misses. */
const MISSES_TO_FORGET = 3;

beforeEach(() => {
  frame = () => ({ r: 0, g: 0, b: 0 });
  tickFn = null;
});

describe('the auto-switch poll', () => {
  it('switches the Run target the moment a trigger Screen starts matching', () => {
    const raid = screenFor(RED, 'raid');
    const { setRunTarget } = build({
      screens: [raid],
      activities: [{ id: 'raid', name: 'Raid' }],
    });

    frame = () => RED;
    tick();

    expect(setRunTarget).toHaveBeenCalledWith('raid');
    expect(setRunTarget).toHaveBeenCalledTimes(1);
  });

  it('does not call it again while the same Screen keeps matching', () => {
    const raid = screenFor(RED, 'raid');
    const { setRunTarget } = build({
      screens: [raid],
      activities: [{ id: 'raid', name: 'Raid' }],
    });

    frame = () => RED;
    tick();
    tick();
    tick();

    expect(setRunTarget).toHaveBeenCalledTimes(1);
  });

  it('does not fight a manual change while the same Screen is still showing', () => {
    const raid = screenFor(RED, 'raid');
    const { setRunTarget, pickManually } = build({
      screens: [raid],
      activities: [{ id: 'raid', name: 'Raid' }],
    });

    frame = () => RED;
    tick(); // matches, switches to 'raid'
    expect(setRunTarget).toHaveBeenCalledTimes(1);

    // The user picks something else entirely from the Run tab's own
    // dropdown, by hand, while the Raid dialog is still the thing on show.
    setRunTarget.mockClear();
    pickManually('worldboss');
    tick();
    tick();

    expect(setRunTarget, 'the same still-matching Screen must not force raid back').not.toHaveBeenCalled();

    // The dialog closes for long enough to count as genuinely gone (not
    // just one flickered frame), then the same Raid dialog opens again
    // later: a new occasion to apply the switch, overriding the manual
    // pick made while it was last open.
    frame = () => ({ r: 0, g: 0, b: 0 });
    for (let i = 0; i < MISSES_TO_FORGET; i += 1) {
      tick();
    }
    frame = () => RED;
    tick();

    expect(setRunTarget, 'reopening the dialog applies the switch again').toHaveBeenCalledWith('raid');
  });

  it('does not forget a match on a single flickered miss', () => {
    // One bad tick (a toast, a transition frame) must not be enough to
    // re-arm the trigger and fight a manual pick made while the real
    // screen never actually left.
    const raid = screenFor(RED, 'raid');
    const { setRunTarget, pickManually } = build({
      screens: [raid],
      activities: [{ id: 'raid', name: 'Raid' }],
    });

    frame = () => RED;
    tick();
    expect(setRunTarget).toHaveBeenCalledTimes(1);

    setRunTarget.mockClear();
    pickManually('worldboss');
    frame = () => ({ r: 0, g: 0, b: 0 }); // one flickered miss, short of the threshold
    tick();
    frame = () => RED; // the real screen is still there
    tick();

    expect(setRunTarget, 'a single miss must not re-apply raid').not.toHaveBeenCalled();
  });

  it('resets its memory on un-match, so a later real change is still caught', () => {
    // Nothing to apply the second time if the Run target is still 'raid'
    // from the first match ("already the Run target, nothing to do" is
    // the spec's own explicit rule) — the thing actually worth proving is
    // that un-matching clears the memory, so a real divergence after that
    // point is caught on the next re-match rather than suppressed by a
    // leftover "already did this one" marker.
    const raid = screenFor(RED, 'raid');
    const { setRunTarget, pickManually } = build({
      screens: [raid],
      activities: [{ id: 'raid', name: 'Raid' }],
    });

    frame = () => RED;
    tick();
    expect(setRunTarget).toHaveBeenCalledTimes(1);

    frame = () => ({ r: 0, g: 0, b: 0 });
    for (let i = 0; i < MISSES_TO_FORGET; i += 1) {
      tick();
    }
    pickManually('worldboss'); // something else claims it while Raid is off screen
    frame = () => RED;
    tick();

    expect(setRunTarget).toHaveBeenCalledTimes(2);
    expect(setRunTarget).toHaveBeenNthCalledWith(2, 'raid');
  });

  it('does nothing while another task is actively running', () => {
    // The Run button and its hotkey decide Stop-vs-Run by comparing the
    // Run target against what the engine is doing, so changing the
    // target mid-task would turn the user's own Stop control into
    // "start something else" instead.
    const raid = screenFor(RED, 'raid');
    const { setRunTarget } = build({
      screens: [raid],
      activities: [{ id: 'raid', name: 'Raid' }],
      activeTask: 'runAll',
      runTarget: 'worldboss',
    });

    frame = () => RED;
    tick();

    expect(setRunTarget).not.toHaveBeenCalled();
  });

  it('switches to a different trigger Screen the very next tick', () => {
    const raid = screenFor(RED, 'raid');
    const worldboss = screenFor(BLUE, 'worldboss');
    const { setRunTarget } = build({
      screens: [raid, worldboss],
      activities: [{ id: 'raid', name: 'Raid' }, { id: 'worldboss', name: 'World Boss' }],
    });

    frame = () => RED;
    tick();
    frame = () => BLUE;
    tick();

    expect(setRunTarget).toHaveBeenNthCalledWith(1, 'raid');
    expect(setRunTarget).toHaveBeenNthCalledWith(2, 'worldboss');
  });

  it('does nothing while the engine is resting', () => {
    const raid = screenFor(RED, 'raid');
    const { setRunTarget } = build({
      screens: [raid],
      activities: [{ id: 'raid', name: 'Raid' }],
      restingMs: 5000,
    });

    frame = () => RED;
    tick();

    expect(setRunTarget).not.toHaveBeenCalled();
  });

  it('does nothing when two trigger Screens match the same frame', () => {
    // Both anchors are RED, so both "match" a RED frame, the ambiguous
    // case this feature deliberately refuses to guess through.
    const raid = screenFor(RED, 'raid');
    const worldboss = screenFor(RED, 'worldboss');
    const { setRunTarget } = build({
      screens: [raid, worldboss],
      activities: [{ id: 'raid', name: 'Raid' }, { id: 'worldboss', name: 'World Boss' }],
    });

    frame = () => RED;
    tick();

    expect(setRunTarget).not.toHaveBeenCalled();
  });

  it('excludes a Screen whose triggerActivity names a deleted activity', () => {
    const raid = screenFor(RED, 'raid'); // 'raid' is not in getActivities() below
    const { setRunTarget } = build({
      screens: [raid],
      activities: [{ id: 'worldboss', name: 'World Boss' }],
    });

    frame = () => RED;
    tick();

    expect(setRunTarget).not.toHaveBeenCalled();
  });

  it('does nothing when no Screen is tagged at all', () => {
    const untagged = createScreen({ anchors: [anchorOf(RED)], tolerance: 0 });
    const { setRunTarget } = build({ screens: [untagged], activities: [] });

    frame = () => RED;
    expect(() => tick()).not.toThrow();
    expect(setRunTarget).not.toHaveBeenCalled();
  });

  it('does nothing when there is no render target', async () => {
    const canvasModule = await import('../src/core/canvas.js');
    const original = canvasModule.getRenderTarget;
    canvasModule.getRenderTarget = () => null;

    const raid = screenFor(RED, 'raid');
    const { setRunTarget } = build({
      screens: [raid],
      activities: [{ id: 'raid', name: 'Raid' }],
    });
    frame = () => RED;
    expect(() => tick()).not.toThrow();
    expect(setRunTarget).not.toHaveBeenCalled();

    canvasModule.getRenderTarget = original;
  });
});
