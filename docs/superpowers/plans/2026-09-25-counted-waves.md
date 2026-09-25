# Counted waves Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A step that holds the sequence until a region of the screen has changed a given number of times, so an Invasion run can quit after seven waves and start again.

**Architecture:** A new `StepKind.COUNT`. It watches one region point, compares the region's raw pixels against the previous tick's reading, and counts a change only once the picture has settled at a new value. The engine's cursor carries the tally; counting refreshes the idle and auto-stop clocks and pins the poll to its fastest rung while it runs.

**Tech Stack:** Plain ES modules, esbuild bundle, vitest (jsdom where a test touches the DOM). No dependencies added.

**Spec:** `docs/superpowers/specs/2026-09-25-counted-waves-design.md`

## Global Constraints

- Always braces on control flow; no expression-body functions; no `///` doc blocks.
- Comments only where a reader would otherwise get it wrong, one line, under ~100 chars; roughly one per 30 lines of new code.
- Booleans are named with `is`/`has`/`can`/`should`/`needs`.
- Nothing may go through the patched globals: scheduling and clocks use `realNow`/`realSetTimeout` from `src/core/timers.js`.
- Steps are stored verbatim (`src/core/storage.js` does not normalise them), so every new field must read correctly as `undefined` on a profile saved before this change. No migration, no schema bump.
- Both locales must carry every new key; `tests/i18n.test.js` fails otherwise.
- `npm test` passes before each commit.

## Review Focus

1. **A count step with no region point** — a step the user made but never captured. It must be treated as not ready rather than counting forever. Test in Task 2.
2. **`countTo` of 0 or missing** (an old step, a half-made new one) — passes straight through instead of blocking the sequence. Test in Task 3.
3. **A region that never settles** (constant animation behind a badly drawn box) — the cap releases the cursor instead of parking the bot until auto-stop. Test in Task 3.
4. **`readRegion` returning null** (canvas resized, context lost) — the tick counts nothing and does not crash or miscount. Test in Task 1.
5. **Two readings of different sizes** — the framebuffer changed between ticks; they must read as "different" without indexing past the end of either buffer. Test in Task 1.

---

## File Structure

- `src/core/region.js` — gains `regionsDiffer`, the pixel comparison. It already owns reading and scoring rectangles; this is the third question you can ask about one.
- `src/bot/step.js` — `StepKind.COUNT`, and `countTo` / `countCap` on a step.
- `src/core/engine.js` — the counting branch in `runSequence`, the tally on the cursor, and the three clocks.
- `src/bot/step-editor.js` — `captureRegion` and `setCount`.
- `src/ui/panel/steps.js` — the behaviour option, the two number fields, the region capture button.
- `src/bot/dry-run.js` — a verdict for a count step.
- `src/i18n/en.js`, `src/i18n/vi.js` — labels.
- Tests: `tests/region-change.test.js`, `tests/count-step.test.js`, `tests/count-step-ui.test.js`.

---

### Task 1: `regionsDiffer`

**Files:**
- Modify: `src/core/region.js`
- Test: `tests/region-change.test.js` (create)

**Interfaces:**
- Consumes: `readRegion(gl, x, y, w, h)` → `{ x, y, w, h, data: Uint8Array } | null`, already exported.
- Produces: `regionsDiffer(left, right, tolerance, changeRatio?) => boolean` and `DEFAULT_CHANGE_RATIO = 0.02`, both exported from `src/core/region.js`.

- [ ] **Step 1: Write the failing test**

Create `tests/region-change.test.js`:

```js
/**
 * Counting waves asks a question the fingerprint cannot answer: did these
 * exact pixels change? A sixteen-sample grid can cross one redrawn digit
 * once or not at all, so this reads the whole rectangle.
 */
import { describe, it, expect } from 'vitest';
import { regionsDiffer, DEFAULT_CHANGE_RATIO } from '../src/core/region.js';

/** A w×h region filled with one colour, with `litPixels` pixels set white. */
function region(w, h, litPixels = 0) {
  const data = new Uint8Array(w * h * 4);
  for (let index = 0; index < w * h; index += 1) {
    const lit = index < litPixels;
    data[index * 4] = lit ? 255 : 20;
    data[index * 4 + 1] = lit ? 255 : 20;
    data[index * 4 + 2] = lit ? 255 : 20;
    data[index * 4 + 3] = 255;
  }
  return { x: 0, y: 0, w, h, data };
}

describe('regionsDiffer', () => {
  it('reads two identical readings as the same', () => {
    expect(regionsDiffer(region(20, 20), region(20, 20), 10)).toBe(false);
  });

  it('sees a handful of pixels change', () => {
    // 20 of 400 pixels is 5%, over the 2% floor — one redrawn digit's worth.
    expect(regionsDiffer(region(20, 20), region(20, 20, 20), 10)).toBe(true);
  });

  it('ignores a change smaller than the ratio', () => {
    expect(regionsDiffer(region(20, 20), region(20, 20, 4), 10)).toBe(false);
  });

  it('ignores a shade inside the tolerance', () => {
    const left = region(4, 4);
    const right = region(4, 4);
    for (let index = 0; index < right.data.length; index += 4) {
      right.data[index] += 5;
    }
    expect(regionsDiffer(left, right, 10)).toBe(false);
    expect(regionsDiffer(left, right, 2)).toBe(true);
  });

  it('treats a missing reading as a difference', () => {
    expect(regionsDiffer(null, region(4, 4), 10)).toBe(true);
    expect(regionsDiffer(region(4, 4), null, 10)).toBe(true);
  });

  it('treats a resized reading as a difference without reading past either', () => {
    expect(regionsDiffer(region(4, 4), region(8, 8), 10)).toBe(true);
  });

  it('exposes the ratio it defaults to', () => {
    expect(DEFAULT_CHANGE_RATIO).toBe(0.02);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/region-change.test.js`
Expected: FAIL — `regionsDiffer is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `src/core/region.js`, after `sampleRegion`:

```js
/** Share of pixels that must move before two readings are a different picture. */
export const DEFAULT_CHANGE_RATIO = 0.02;

/**
 * Did this rectangle change between two readings?
 *
 * Whole pixels rather than the sample grid: one redrawn digit is a few
 * hundred pixels and might not cross a single grid point.
 *
 * @param {{ w: number, h: number, data: Uint8Array } | null} left
 * @param {{ w: number, h: number, data: Uint8Array } | null} right
 * @param {number} tolerance per-channel, as a step's tolerance
 * @param {number} [changeRatio]
 * @returns {boolean}
 */
export function regionsDiffer(left, right, tolerance, changeRatio = DEFAULT_CHANGE_RATIO) {
  if (!left || !right) {
    return true;
  }
  if (left.w !== right.w || left.h !== right.h) {
    return true;
  }

  const pixels = left.w * left.h;
  if (pixels === 0) {
    return false;
  }

  let moved = 0;
  for (let offset = 0; offset < pixels * 4; offset += 4) {
    if (
      Math.abs(left.data[offset] - right.data[offset]) > tolerance ||
      Math.abs(left.data[offset + 1] - right.data[offset + 1]) > tolerance ||
      Math.abs(left.data[offset + 2] - right.data[offset + 2]) > tolerance
    ) {
      moved += 1;
    }
  }

  return moved / pixels > changeRatio;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/region-change.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/core/region.js tests/region-change.test.js
git commit -m "feat(region): ask whether a rectangle changed, by its pixels"
```

---

### Task 2: The count step's shape

**Files:**
- Modify: `src/bot/step.js`
- Test: `tests/count-step.test.js` (create)

**Interfaces:**
- Consumes: `createStep(overrides)`, `isStepReady(step)`, `StepKind` from `src/bot/step.js`.
- Produces: `StepKind.COUNT === 'count'`; `createStep()` returns `countTo: 0` and `countCap: 180`; `isStepReady` requires a region point on a count step.

- [ ] **Step 1: Write the failing test**

Create `tests/count-step.test.js`:

```js
/**
 * A count step watches one rectangle and lets the sequence through when it
 * has settled at a new picture often enough.
 */
import { describe, it, expect } from 'vitest';
import { createStep, isStepReady, StepKind } from '../src/bot/step.js';

const REGION_POINT = {
  x: 10,
  y: 10,
  w: 20,
  h: 8,
  bw: 800,
  bh: 500,
  samples: [{ dx: 0.5, dy: 0.5, hex: '#101010' }],
};

describe('a count step', () => {
  it('is its own kind', () => {
    expect(StepKind.COUNT).toBe('count');
  });

  it('starts with nothing to count and a cap', () => {
    const step = createStep();
    expect(step.countTo).toBe(0);
    expect(step.countCap).toBe(180);
  });

  it('is not ready until it has a region to watch', () => {
    const bare = createStep({ kind: StepKind.COUNT, countTo: 7, hex: '#ffffff', points: [{ x: 1, y: 2 }] });
    expect(isStepReady(bare)).toBe(false);

    const watching = createStep({ kind: StepKind.COUNT, countTo: 7, points: [REGION_POINT] });
    expect(isStepReady(watching)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/count-step.test.js`
Expected: FAIL — `StepKind.COUNT` is undefined.

- [ ] **Step 3: Write minimal implementation**

In `src/bot/step.js`, extend `StepKind` and its comment:

```js
export const StepKind = Object.freeze({
  CLICK: 'click',
  WAIT: 'wait',
  COUNT: 'count',
});
```

In `createStep`, after `maxMatches`:

```js
    /**
     * For a count step: how many times its region must settle at a new
     * picture before the sequence goes on. Seven is an Invasion's waves.
     */
    countTo: 0,
    /** Seconds before a count that is going nowhere gives up and moves on. */
    countCap: 180,
```

Extend `isStepReady`:

```js
export function isStepReady(step) {
  if (!step.enabled || step.points.length === 0) {
    return false;
  }
  // A count reads a rectangle, so a lone pixel is nothing it can watch.
  if (step.kind === StepKind.COUNT) {
    return step.points.some(isRegionPoint);
  }
  return Boolean(step.hex) || step.points.every(isRegionPoint);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/count-step.test.js`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/bot/step.js tests/count-step.test.js
git commit -m "feat(step): a kind that counts a rectangle changing"
```

---

### Task 3: The engine counts

**Files:**
- Modify: `src/core/engine.js`
- Test: `tests/count-step.test.js` (extend)

**Interfaces:**
- Consumes: `StepKind.COUNT`, `countTo`, `countCap` from Task 2; `regionsDiffer` from Task 1; `readRegion`, `resolveRect`, `isRegionPoint` from `src/core/region.js`.
- Produces: no new exports. `engine.getState().lastMessage` reads `"<label>: 3/7"` while counting.

- [ ] **Step 1: Write the failing test**

Append to `tests/count-step.test.js`:

```js
import { createEngine, TaskId } from '../src/core/engine.js';
import { ScaleMode } from '../src/core/coords.js';

/**
 * A canvas whose region reads are whatever the test says they are.
 *
 * `frames` is an array of fill bytes; each `readPixels` takes the next one,
 * repeating the last forever, which is what "the picture settled" looks like.
 */
function fakeTarget(frames) {
  let index = 0;
  const gl = {
    readPixels(x, y, w, h, format, type, out) {
      const fill = frames[Math.min(index, frames.length - 1)];
      index += 1;
      out.fill(fill);
    },
  };
  return { canvas: { width: 800, height: 500 }, gl };
}
```

Because `createEngine` reads the canvas through `getRenderTarget`, the test stubs that module:

```js
import { vi } from 'vitest';

vi.mock('../src/core/canvas.js', () => ({
  getCanvas: () => currentTarget.canvas,
  getRenderTarget: () => currentTarget,
}));
vi.mock('../src/core/coords.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getBufferSize: () => ({ width: 800, height: 500 }),
}));

let currentTarget = null;
```

The counting tests drive the engine one tick at a time through its exported
`tickOnce` (added in Step 3):

```js
describe('counting in the engine', () => {
  function engineWith(step, frames) {
    currentTarget = fakeTarget(frames);
    const engine = createEngine({
      getScriptSteps: () => [step],
      getScaleMode: () => ScaleMode.SCALE,
    });
    engine.start(TaskId.SCRIPT);
    return engine;
  }

  it('counts once the picture has settled somewhere new', () => {
    // 10 10 | 40 40 -> one settled change; the first read only sets the mark.
    const step = createStep({ kind: StepKind.COUNT, countTo: 1, points: [REGION_POINT] });
    const engine = engineWith(step, [10, 10, 40, 40]);

    engine.tickOnce();
    engine.tickOnce();
    expect(engine.getState().lastMessage).toContain('0/1');
    engine.tickOnce();
    // Differs from the mark but has not settled yet: still nothing counted.
    expect(engine.getState().lastMessage).toContain('0/1');
    engine.tickOnce();
    expect(engine.getState().lastMessage).toContain('1/1');
    engine.stop();
  });

  it('counts an animation as one wave, not three', () => {
    const step = createStep({ kind: StepKind.COUNT, countTo: 1, points: [REGION_POINT] });
    // 10 10 | 30 50 70 (moving) | 70 70 (settled) = exactly one change.
    const engine = engineWith(step, [10, 10, 30, 50, 70, 70, 70]);
    for (let tick = 0; tick < 7; tick += 1) {
      engine.tickOnce();
    }
    expect(engine.getState().lastMessage).toContain('1/1');
    engine.stop();
  });

  it('never counts a picture that does not change', () => {
    const step = createStep({ kind: StepKind.COUNT, countTo: 2, points: [REGION_POINT] });
    const engine = engineWith(step, [10]);
    for (let tick = 0; tick < 10; tick += 1) {
      engine.tickOnce();
    }
    expect(engine.getState().lastMessage).toContain('0/2');
    engine.stop();
  });

  it('passes straight through when there is nothing to count', () => {
    const step = createStep({ kind: StepKind.COUNT, countTo: 0, points: [REGION_POINT] });
    const engine = engineWith(step, [10]);
    engine.tickOnce();
    expect(engine.getState().lastMessage).not.toContain('0/0');
    engine.stop();
  });

  it('gives up at the cap instead of parking the bot', () => {
    const step = createStep({
      kind: StepKind.COUNT,
      countTo: 5,
      countCap: 0.01,
      points: [REGION_POINT],
    });
    const engine = engineWith(step, [10]);
    engine.tickOnce();
    const waited = Date.now() + 30;
    while (Date.now() < waited) {
      // Busy-wait past the cap; the engine reads the real clock.
    }
    engine.tickOnce();
    expect(engine.getState().lastMessage).toContain('gave up');
    engine.stop();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/count-step.test.js`
Expected: FAIL — `engine.tickOnce is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `src/core/engine.js`:

Extend the import from `./region.js`:

```js
import { matchPoint, readRegion, resolveRect, isRegionPoint, regionsDiffer } from './region.js';
```

Extend the cursor:

```js
  /** Where the runner is in the current step list. See `runSequence`. */
  const cursor = { key: null, index: 0, missingSince: 0 };

  /**
   * A count step's tally.
   *
   * `mark` is the picture of the wave being counted from and `previous` the
   * one read last tick: a change lands only when the current read matches
   * `previous` and differs from `mark`, so an animation is one wave, not three.
   */
  const tally = { stepId: null, count: 0, mark: null, previous: null, since: 0 };

  /** Read by the pacer and the clocks; set while a count step is live. */
  let isCounting = false;
  let hasCounted = false;
```

Add `runCount` beside `countPlaces`:

```js
  /**
   * @returns {'waiting' | 'done' | 'capped'}
   */
  function runCount(step, gl, buffer, scaleMode) {
    const watched = step.points.find(isRegionPoint);
    if (!watched) {
      return 'done';
    }

    if (tally.stepId !== step.id) {
      tally.stepId = step.id;
      tally.count = 0;
      tally.mark = null;
      tally.previous = null;
      tally.since = realNow();
    }

    const goal = Math.max(0, Math.round(Number(step.countTo) || 0));
    if (tally.count >= goal) {
      return 'done';
    }

    const rect = resolveRect(watched, buffer, scaleMode);
    const now = readRegion(gl, rect.x, rect.y, rect.w, rect.h);
    if (now) {
      if (!tally.mark) {
        tally.mark = now;
        tally.previous = now;
      } else {
        const hasSettled = !regionsDiffer(now, tally.previous, step.tolerance);
        const hasMoved = regionsDiffer(now, tally.mark, step.tolerance);
        if (hasSettled && hasMoved) {
          tally.count += 1;
          tally.mark = now;
          hasCounted = true;
        }
        tally.previous = now;
      }
    }

    if (tally.count >= goal) {
      return 'done';
    }
    const cap = Number(step.countCap) || 0;
    if (cap > 0 && realNow() - tally.since >= cap * 1000) {
      return 'capped';
    }
    return 'waiting';
  }
```

In `runSequence`, inside the hop loop, immediately after the `WAIT` branch:

```js
      if (expected.kind === StepKind.COUNT) {
        isCounting = true;
        const verdict = runCount(expected, gl, buffer, scaleMode);
        const label = expected.label || expected.id;
        if (verdict === 'waiting') {
          cursor.missingSince = 0;
          setMessage(`${label}: ${tally.count}/${expected.countTo || 0}`);
          return null;
        }
        if (verdict === 'capped') {
          report('idle', { label });
          setMessage(`${label}: gave up after ${expected.countCap}s`);
        }
        cursor.index = (cursor.index + 1) % steps.length;
        continue;
      }
```

Note the `matchStep` call above the `WAIT` branch runs for every kind; a count
step's region point is harmless there, and the branch returns before its result
is used. Leave it.

In `tick`, clear the flags before `runSequence` and honour them after:

```js
    const task = TASKS[state.activeTask];
    nearest = null;
    isCounting = false;
    hasCounted = false;
    const hit = runSequence(task.getSteps(), target.canvas, target.gl, state.screen);

    // A counted wave is the bot working, not the bot stuck: without this the
    // queue moves on after 12s and the run auto-stops after three minutes.
    if (hasCounted) {
      idleSince = realNow();
      state.lastActionAt = realNow();
    }
```

In `schedulePoll`, pin the pace while counting:

```js
    const resting = restingUntil > realNow();
    const delay = resting
      ? SCRIPT_PACE_LADDER[SCRIPT_PACE_LADDER.length - 1]
      : isCounting
        ? FIRST_PACE
        : pace;
```

and stop the ladder from backing off underneath it, in the same callback:

```js
      if (!wasResting) {
        pace = nextPace(pace, clicked || screenJustChanged || isCounting);
      }
```

Expose a single tick for the tests, in the returned object beside `start`/`stop`:

```js
    /** One tick, for tests; the running engine books its own. */
    tickOnce: tick,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/count-step.test.js`
Expected: PASS, 8 tests.

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS. If `tests/sequence.test.js` or `tests/dry-run.test.js` fail, the count branch is firing for steps that are not counts — check the `kind` guard.

- [ ] **Step 6: Commit**

```bash
git add src/core/engine.js tests/count-step.test.js
git commit -m "feat(engine): hold the sequence until a region has changed enough"
```

---

### Task 4: Capturing the region, and the numbers

**Files:**
- Modify: `src/bot/step-editor.js`
- Modify: `src/bot/dry-run.js:66-75`

**Interfaces:**
- Consumes: `captureFingerprint` from `src/core/region.js`, `clientToBuffer`/`getBufferSize` from `src/core/coords.js`, both already used this way in `src/bot/screen-editor.js:28-52`.
- Produces: on the object `createStepEditor` returns — `captureRegion(rect, stepId)` where `rect` is `{ left, top, width, height }` in client space, and `setCount(stepId, { countTo, countCap })`.

- [ ] **Step 1: Write the failing test**

Append to `tests/count-step.test.js`:

```js
import { createStepEditor } from '../src/bot/step-editor.js';

describe('the count step editor', () => {
  function editorWith(step) {
    const steps = [step];
    return {
      steps,
      editor: createStepEditor({
        getSteps: () => steps,
        persist: () => {},
        report: () => {},
        getScaleMode: () => ScaleMode.SCALE,
      }),
    };
  }

  it('clamps the count and the cap', () => {
    const step = createStep({ kind: StepKind.COUNT });
    const { editor } = editorWith(step);

    editor.setCount(step.id, { countTo: '7', countCap: '90' });
    expect(step.countTo).toBe(7);
    expect(step.countCap).toBe(90);

    editor.setCount(step.id, { countTo: -3, countCap: 99999 });
    expect(step.countTo).toBe(0);
    expect(step.countCap).toBe(3600);
  });

  it('stores a dragged rectangle as the only region', () => {
    const step = createStep({ kind: StepKind.COUNT, points: [{ x: 1, y: 2 }] });
    const { editor } = editorWith(step);
    currentTarget = fakeTarget([10]);

    editor.captureRegion({ left: 100, top: 50, width: 60, height: 20 }, step.id);

    expect(step.points).toHaveLength(1);
    expect(Array.isArray(step.points[0].samples)).toBe(true);
    expect(step.points[0].w).toBeGreaterThan(0);
  });
});
```

The `clientToBuffer` stub for this block extends the existing `coords.js` mock:

```js
  clientToBuffer: (canvas, x, y) => ({ x: Math.round(x), y: Math.round(500 - y) }),
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/count-step.test.js`
Expected: FAIL — `editor.setCount is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `src/bot/step-editor.js`, add to the imports:

```js
import { captureFingerprint } from '../core/region.js';
```

Add both functions beside `setMaxMatches`:

```js
  /** A count step's two numbers: how many changes, and when to give up. */
  function setCount(stepId, { countTo, countCap }) {
    const step = find(stepId);
    if (!step) {
      return;
    }
    if (countTo !== undefined) {
      step.countTo = Math.max(0, Math.min(99, Math.round(Number(countTo) || 0)));
    }
    if (countCap !== undefined) {
      step.countCap = Math.max(0, Math.min(3600, Math.round(Number(countCap) || 0)));
    }
    deps.persist();
  }

  /**
   * Store a dragged rectangle as the one region a count step watches.
   *
   * A count has exactly one place to look, so this replaces rather than adds —
   * unlike `＋`, which is how a wait step gains another party slot.
   *
   * @param {{ left: number, top: number, width: number, height: number }} rect
   */
  function captureRegion(rect, stepId) {
    const step = find(stepId);
    if (!step) {
      return null;
    }
    const target = getRenderTarget();
    if (!target) {
      deps.report(t('msg.noCanvas'));
      return null;
    }

    const { canvas, gl } = target;
    // Client space has its origin top-left, buffer space bottom-left.
    const origin = clientToBuffer(canvas, rect.left, rect.top + rect.height);
    const far = clientToBuffer(canvas, rect.left + rect.width, rect.top);
    const buffer = getBufferSize(canvas);

    const fingerprint = captureFingerprint(gl, {
      x: origin.x,
      y: origin.y,
      w: Math.max(1, far.x - origin.x),
      h: Math.max(1, far.y - origin.y),
      bw: buffer.width,
      bh: buffer.height,
    });
    if (!fingerprint) {
      deps.report(t('msg.noWebgl'));
      return null;
    }

    step.points = [fingerprint];
    deps.persist();
    return step;
  }
```

Extend `setBehaviour` so the new kind survives the dropdown:

```js
    step.kind =
      kind === StepKind.WAIT
        ? StepKind.WAIT
        : kind === StepKind.COUNT
          ? StepKind.COUNT
          : StepKind.CLICK;
```

Export both:

```js
    setCount,
    captureRegion,
```

In `src/bot/dry-run.js`, give a count step a verdict of its own — line 66 and line 72 both currently assume wait-or-click:

```js
      return { verdict: step.kind === StepKind.WAIT ? 'waiting' : 'match' };
```

becomes

```js
      if (step.kind === StepKind.COUNT) {
        return { verdict: 'counting' };
      }
      return { verdict: step.kind === StepKind.WAIT ? 'waiting' : 'match' };
```

and the `StepKind.WAIT` check at line 72 gains the same guard above it:

```js
  if (step.kind === StepKind.COUNT) {
    return { verdict: 'counting' };
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/count-step.test.js`
Expected: PASS, 10 tests.

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/bot/step-editor.js src/bot/dry-run.js tests/count-step.test.js
git commit -m "feat(steps): capture a rectangle for a count step"
```

---

### Task 5: The panel

**Files:**
- Modify: `src/ui/panel/steps.js:329-460`
- Modify: `src/i18n/en.js`, `src/i18n/vi.js`
- Test: `tests/count-step-ui.test.js` (create)

**Interfaces:**
- Consumes: `deps.stepEditor.setCount` and `deps.stepEditor.captureRegion` from Task 4; `startDragSelect` from `src/ui/dragselect.js`, used exactly as `src/ui/panel/screens.js:22-33` uses it.
- Produces: nothing other modules read.

- [ ] **Step 1: Write the failing test**

Create `tests/count-step-ui.test.js`:

```js
/**
 * The count step's row: a fifth behaviour, its two numbers, and the only
 * place in the steps tab that draws a box on the game.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { renderStepsTab } from '../src/ui/panel/steps.js';
import { createUiStore } from '../src/ui/store.js';
import { createStep, StepKind } from '../src/bot/step.js';

// The dep fixture is the one `tests/step-pack-panel.test.js:31-42` uses; keep
// them in step, since the tab reads more of it than any one test needs.
function render(step, overrides = {}) {
  document.body.replaceChildren();
  const store = createUiStore();
  const node = renderStepsTab({
    store,
    getSteps: () => [step],
    getEngineState: () => ({ expectedStepId: null }),
    getActivities: () => [],
    getScreens: () => [],
    getCanvasLock: () => ({ width: 640, height: 400 }),
    settings: { scaleMode: 'scale', showScreens: false },
    stepEditor: {
      setActivity: () => {},
      rename: () => {},
      setScreens: () => {},
      replaceAll: () => {},
      setBehaviour: () => {},
      setRest: () => {},
      setMaxMatches: () => {},
      setCount: () => {},
      captureRegion: () => {},
      ...overrides,
    },
    dryRunner: { start: () => {}, stop: () => {} },
    refresh: () => {},
  });
  document.body.append(node);
  return node;
}

describe('a count step in the panel', () => {
  it('offers counting as a behaviour', () => {
    const options = [...render(createStep()).querySelectorAll('.bhb-rule__gate option')];
    expect(options.map((option) => option.value)).toContain('count');
  });

  it('shows the target and the cap instead of the rest seconds', () => {
    const step = createStep({ kind: StepKind.COUNT, countTo: 7, countCap: 120 });
    const node = render(step);
    const numbers = [...node.querySelectorAll('.bhb-rest')].map((input) => input.value);
    expect(numbers).toContain('7');
    expect(numbers).toContain('120');
  });

  it('writes the target back through the editor', () => {
    const step = createStep({ kind: StepKind.COUNT, countTo: 7 });
    const setCount = vi.fn();
    const node = render(step, { setCount });
    const target = [...node.querySelectorAll('.bhb-rest')][0];
    target.value = '9';
    target.dispatchEvent(new Event('change', { bubbles: true }));
    expect(setCount).toHaveBeenCalledWith(step.id, { countTo: '9' });
  });

  it('gives a count step a button to draw its box', () => {
    const node = render(createStep({ kind: StepKind.COUNT }));
    expect(node.querySelector('.bhb-step__region')).not.toBeNull();
  });

  it('gives a click step no such button', () => {
    const node = render(createStep());
    expect(node.querySelector('.bhb-step__region')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/count-step-ui.test.js`
Expected: FAIL — `count` is not among the option values.

- [ ] **Step 3: Write minimal implementation**

In `src/ui/panel/steps.js`, add the import:

```js
import { startDragSelect } from '../dragselect.js';
```

Add the fifth option to the behaviour list:

```js
      ['click', 'steps.kindClick'],
      ['optional', 'steps.kindOptional'],
      ['wait', 'steps.kindWait'],
      ['count', 'steps.kindCount'],
      ['spent', 'steps.kindSpent'],
```

Read and write it:

```js
    behaviour.value =
      step.kind === StepKind.WAIT
        ? 'wait'
        : step.kind === StepKind.COUNT
          ? 'count'
          : step.endsRun
            ? 'spent'
            : step.optional
              ? 'optional'
              : 'click';
    behaviour.addEventListener('change', () => {
      const kinds = { wait: StepKind.WAIT, count: StepKind.COUNT };
      deps.stepEditor.setBehaviour(step.id, {
        kind: kinds[behaviour.value] || StepKind.CLICK,
        optional: behaviour.value === 'optional',
        endsRun: behaviour.value === 'spent',
      });
      deps.refresh();
    });
```

Beside the `threshold` field, add the count's two:

```js
    const countTarget = el('input', { class: 'bhb-rest bhb-mono', title: t('steps.countToHint') });
    countTarget.type = 'number';
    countTarget.min = '0';
    countTarget.max = '99';
    countTarget.value = String(step.countTo || 0);
    countTarget.addEventListener('change', () => {
      deps.stepEditor.setCount(step.id, { countTo: countTarget.value });
      deps.refresh();
    });

    const countCap = el('input', { class: 'bhb-rest bhb-mono', title: t('steps.countCapHint') });
    countCap.type = 'number';
    countCap.min = '0';
    countCap.max = '3600';
    countCap.value = String(step.countCap || 0);
    countCap.addEventListener('change', () => {
      deps.stepEditor.setCount(step.id, { countCap: countCap.value });
      deps.refresh();
    });

    const drawRegion = el('button', {
      class: 'bhb-icon bhb-step__region',
      title: t('steps.drawRegion'),
      text: '▭',
    });
    drawRegion.addEventListener('click', () => {
      // The panel covers the game, so it gets out of the way for the drag.
      deps.store.closePanel();
      deps.refresh();
      startDragSelect((rect) => {
        if (rect) {
          deps.stepEditor.captureRegion(rect, step.id);
        }
        deps.store.openPanel();
        deps.refresh();
      });
    });
```

Replace the meta row's kind-dependent cells:

```js
    const isWait = step.kind === StepKind.WAIT;
    const isCount = step.kind === StepKind.COUNT;
```

```js
        behaviour,
        placeCount,
        isCount ? countTarget : isWait ? threshold : rest,
        isCount ? countCap : null,
```

and add the draw button to the actions:

```js
        el('span', { class: 'bhb-rule__actions' }, [
          isCount ? drawRegion : null,
          addPlace,
          toggle,
          up,
          down,
          remove,
        ]),
```

Add to `src/i18n/en.js`, beside the other `steps.kind*` keys:

```js
  'steps.kindCount': 'count changes',
  'steps.countToHint': 'How many times the watched box must change before the sequence goes on',
  'steps.countCapHint': 'Seconds before a count that is going nowhere gives up',
  'steps.drawRegion': 'Draw the box to watch',
```

and to `src/i18n/vi.js`:

```js
  'steps.kindCount': 'đếm đổi',
  'steps.countToHint': 'Ô được theo dõi phải đổi bao nhiêu lần thì mới đi tiếp',
  'steps.countCapHint': 'Quá bao nhiêu giây không đếm được thì bỏ qua',
  'steps.drawRegion': 'Khoanh ô cần theo dõi',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/count-step-ui.test.js`
Expected: PASS, 5 tests.

- [ ] **Step 5: Run the whole suite and build**

Run: `npm test && npm run build`
Expected: PASS, and the bundle builds.

- [ ] **Step 6: Commit**

```bash
git add src/ui/panel/steps.js src/i18n/en.js src/i18n/vi.js tests/count-step-ui.test.js
git commit -m "feat(panel): a count step's box, target and cap"
```

---

### Task 6: Ship it

**Files:**
- Modify: `docs/ROADMAP.md`

`src/ui/panel/help.js` lists keyboard shortcuts only — it has no list of step
behaviours — so nothing there needs changing. The behaviour dropdown carries
its own `title` hints, which is where a user meets this feature.

- [ ] **Step 1: Note it in the roadmap**

Add a line under the current milestone in `docs/ROADMAP.md` recording that
counted waves shipped, matching the surrounding style.

- [ ] **Step 2: Run the whole suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 3: Bump, build, commit, push**

```bash
npm run bump minor
npm run build
git add -A
git commit -m "feat(steps): count a region's changes, for Invasion's seven waves"
git push origin master
```

A minor bump: this is a milestone-sized addition, per the project's versioning.
