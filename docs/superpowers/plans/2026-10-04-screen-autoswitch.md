# Auto-switch the Run target from the screen on show Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Screen can be tagged with the activity it means; the moment
that Screen is the only thing on show, the Run target dropdown quietly
switches to it, without pressing Run and without interrupting a fight.

**Architecture:** One new optional field on `Screen` (`triggerActivity`),
one new small polling module (`src/core/autoswitch.js`) independent of the
engine's own task scheduler, and one dropdown per row in the Screens tab
UI that sets the field. The poll reuses the engine's own screen-scoring
function (`scoreScreen`) and the engine's own `restingMs` to know when not
to look.

**Tech Stack:** Vanilla JS (ES modules), Vitest, jsdom. No new dependency.

**Spec:** `docs/superpowers/specs/2026-10-04-screen-autoswitch-design.md`

## Global Constraints

- Never presses Run itself — only ever calls `setRunTarget`.
- Never runs while the engine is mid-fight: skips the entire tick when
  `engine.getState().restingMs > 0`.
- Two or more tagged Screens matching the same frame at once is treated
  exactly like zero matching: do nothing that tick. No new warning is
  built — the Screens tab's existing `screens.clash` message already
  covers this.
- A `triggerActivity` naming an activity that no longer exists is excluded
  from scoring entirely, silently.
- Edge-triggered: only acts the tick a trigger Screen's match turns from
  false to true. A Screen matching on consecutive ticks causes exactly
  one `setRunTarget` call, not one per tick.
- No migration: `triggerActivity` defaults to `null` via `createScreen`'s
  existing spread pattern.

## Review Focus

- A trigger Screen stops matching and a *different* trigger Screen starts
  matching on the very next tick (switching dialogs quickly) — the second
  one must still fire as "newly matching", not be suppressed by the
  first's leftover state. Covered in Task 3.
- The user manually picks a different Run target while the same trigger
  Screen is still on show, then that Screen is replaced by a *different*
  frame and the *same* trigger Screen reappears later — it must switch
  again, since "no longer matching" cleared its memory in between.
  Covered in Task 3.
- A Screen tagged with `triggerActivity` that also has `stopsTask` or
  `notify` set (both already exist on `Screen`) must not have either of
  those behaviours touched by this feature — they are the engine's own
  concern, scored by the engine's own detection, entirely separate from
  this poll. Covered by Task 1 only adding a field and Task 3 only ever
  reading `triggerActivity`/anchors, never `stopsTask`/`notify`.
- Zero trigger Screens configured anywhere (nobody has used this feature
  yet) must cost nothing beyond one empty scoring loop per tick, never
  throw, and never call `setRunTarget`. Covered in Task 3.
- The dropdown's list of activities can change (one gets renamed or
  deleted) while a Screen still holds its old id — the Screens tab must
  not crash rendering a `<select>` whose stored value matches no current
  `<option>`. Covered in Task 4.

---

## Task 1: Screen gains `triggerActivity`

**Files:**
- Modify: `src/bot/screen.js`
- Test: `tests/screen-autoswitch-data.test.js` (create)

**Interfaces:**
- Produces: `createScreen()` returns objects with `triggerActivity: string
  | null`, defaulting to `null`.

- [ ] **Step 1: Write the failing test**

Create `tests/screen-autoswitch-data.test.js`:

```js
/**
 * The one new field a Screen carries for auto-switching the Run target:
 * which activity it means, or none.
 */
import { describe, it, expect } from 'vitest';
import { createScreen } from '../src/bot/screen.js';

describe('createScreen: triggerActivity', () => {
  it('defaults to null, so an existing Screen is unaffected', () => {
    expect(createScreen().triggerActivity).toBeNull();
  });

  it('can be set at creation, the same as every other field', () => {
    expect(createScreen({ triggerActivity: 'raid' }).triggerActivity).toBe('raid');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/screen-autoswitch-data.test.js --reporter=dot`
Expected: FAIL — `triggerActivity` is `undefined`, not `null`.

- [ ] **Step 3: Add the field**

In `src/bot/screen.js`, find (`grep -n "listBh: 0," src/bot/screen.js`):

```js
    listTop: 0,
    pitch: 0,
    listBh: 0,
    ...overrides,
  };
}
```

Replace with:

```js
    listTop: 0,
    pitch: 0,
    listBh: 0,
    /**
     * The activity this Screen means, for auto-switching the Run target —
     * see `src/core/autoswitch.js`. `null` is "no consequence", the same
     * as every Screen before this field existed.
     */
    triggerActivity: null,
    ...overrides,
  };
}
```

Also add the field to the `@property` JSDoc block just above `createScreen`
(find `@property {boolean} notify` and add directly after it):

```js
 * @property {string | null} triggerActivity which activity this Screen
 *   means; `null` for a Screen that does not drive auto-switching
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/screen-autoswitch-data.test.js --reporter=dot`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/bot/screen.js tests/screen-autoswitch-data.test.js
git commit -m "feat(screen): a Screen can be tagged with the activity it means"
```

---

## Task 2: The editor setter

**Files:**
- Modify: `src/bot/screen-editor.js`
- Test: `tests/screen-autoswitch-data.test.js` (extend)

**Interfaces:**
- Consumes: `createScreen` (Task 1).
- Produces: `screenEditor.setTriggerActivity(screenId: string, activityId:
  string | null): void`.

- [ ] **Step 1: Write the failing tests**

In `tests/screen-autoswitch-data.test.js`, add after the existing
`describe` block:

```js

describe('screenEditor.setTriggerActivity', () => {
  it('sets it', async () => {
    const { createScreenEditor } = await import('../src/bot/screen-editor.js');
    const screens = [createScreen({ id: 'a' })];
    const editor = createScreenEditor({ getScreens: () => screens, persist: () => {} });

    editor.setTriggerActivity('a', 'raid');

    expect(screens[0].triggerActivity).toBe('raid');
  });

  it('clears it with null', async () => {
    const { createScreenEditor } = await import('../src/bot/screen-editor.js');
    const screens = [createScreen({ id: 'a', triggerActivity: 'raid' })];
    const editor = createScreenEditor({ getScreens: () => screens, persist: () => {} });

    editor.setTriggerActivity('a', null);

    expect(screens[0].triggerActivity).toBeNull();
  });

  it('does nothing for a screen that is not there', async () => {
    const { createScreenEditor } = await import('../src/bot/screen-editor.js');
    const screens = [createScreen({ id: 'a' })];
    const editor = createScreenEditor({ getScreens: () => screens, persist: () => {} });

    expect(() => editor.setTriggerActivity('gone', 'raid')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/screen-autoswitch-data.test.js --reporter=dot`
Expected: FAIL — `editor.setTriggerActivity is not a function`.

- [ ] **Step 3: Add the setter**

In `src/bot/screen-editor.js`, find `function setBossId` (`grep -n
"function setBossId" src/bot/screen-editor.js`):

```js
  function setBossId(screenId, bossId) {
    const screen = find(screenId);
    if (!screen) {
      return;
    }
    screen.bossId = bossId || null;
    deps.persist();
  }
```

Add directly after it:

```js

  /** Which activity this Screen means for auto-switching, or none. */
  function setTriggerActivity(screenId, activityId) {
    const screen = find(screenId);
    if (!screen) {
      return;
    }
    screen.triggerActivity = activityId || null;
    deps.persist();
  }
```

- [ ] **Step 4: Export it**

Find the `return { ... }` block at the end of `createScreenEditor`
(`grep -n "setBossId," src/bot/screen-editor.js`) and add the name next
to it:

```js
    setBossId,
    setTriggerActivity,
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/screen-autoswitch-data.test.js --reporter=dot`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add src/bot/screen-editor.js tests/screen-autoswitch-data.test.js
git commit -m "feat(screen-editor): set or clear a Screen's trigger activity"
```

---

## Task 3: The poll

**Files:**
- Create: `src/core/autoswitch.js`
- Modify: `src/core/constants.js`
- Test: `tests/autoswitch.test.js` (create)

**Interfaces:**
- Consumes: `scoreScreen` from `../bot/screen.js` (already exported).
  `getRenderTarget` from `./canvas.js`. `getBufferSize` from `./coords.js`.
  `realSetInterval`/`realClearInterval` from `./timers.js`.
- Produces: `createAutoSwitch(deps): { stop(): void }` where `deps` is
  `{ getScreens, getActivities, getEngineState, getRunTarget, setRunTarget,
  getScaleMode }`.

- [ ] **Step 1: Add the poll interval constant**

In `src/core/constants.js`, find `export const IDLE_ADVANCE_MS = 12000;`
and add directly after it:

```js

/** How often the auto-switch poll checks the screen, in real ms. See
 *  `core/autoswitch.js`. Cheap enough that speed never needs to touch it. */
export const AUTO_SWITCH_POLL_MS = 400;
```

- [ ] **Step 2: Write the failing tests**

Create `tests/autoswitch.test.js`:

```js
/**
 * The poll that notices a tagged Screen and switches the Run target to
 * match — edge-triggered (fires once per new match, not once per tick),
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

function build({ screens = [], activities = [], restingMs = 0, runTarget = null }) {
  const setRunTarget = vi.fn((target) => {
    runTarget = target;
  });
  const autoSwitch = createAutoSwitch({
    getScreens: () => screens,
    getActivities: () => activities,
    getEngineState: () => ({ restingMs }),
    getRunTarget: () => runTarget,
    setRunTarget,
    getScaleMode: () => 'scale',
  });
  return {
    autoSwitch,
    setRunTarget,
    setResting: (ms) => { restingMs = ms; },
    // A manual pick from the Run tab's own dropdown — not something this
    // poll called, so setRunTarget (the spy) must not record it.
    pickManually: (target) => { runTarget = target; },
  };
}

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

    // The dialog closes, then the same Raid dialog opens again later —
    // this is a new occasion to apply the switch, overriding the manual
    // pick made while it was last open.
    frame = () => ({ r: 0, g: 0, b: 0 });
    tick();
    frame = () => RED;
    tick();

    expect(setRunTarget, 'reopening the dialog applies the switch again').toHaveBeenCalledWith('raid');
  });

  it('switches again once the Screen un-matches and re-matches', () => {
    const raid = screenFor(RED, 'raid');
    const { setRunTarget } = build({
      screens: [raid],
      activities: [{ id: 'raid', name: 'Raid' }],
    });

    frame = () => RED;
    tick();
    frame = () => ({ r: 0, g: 0, b: 0 });
    tick();
    frame = () => RED;
    tick();

    expect(setRunTarget).toHaveBeenCalledTimes(2);
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
    // Both anchors are RED, so both "match" a RED frame — the ambiguous
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
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run tests/autoswitch.test.js --reporter=dot`
Expected: FAIL — `src/core/autoswitch.js` does not exist yet.

- [ ] **Step 4: Write the module**

Create `src/core/autoswitch.js`:

```js
import { getRenderTarget } from './canvas.js';
import { getBufferSize } from './coords.js';
import { scoreScreen } from '../bot/screen.js';
import { realSetInterval, realClearInterval } from './timers.js';
import { AUTO_SWITCH_POLL_MS } from './constants.js';

/**
 * Auto-switch the Run target from the screen on show.
 *
 * Independent of the engine's own task scheduler on purpose: it runs
 * whether or not a task is active, because the whole point is to notice a
 * screen the user opened instead of starting anything. It never presses
 * Run — only ever changes which activity the dropdown is sitting on.
 *
 * Edge-triggered: a Screen that keeps matching across many ticks changes
 * the Run target exactly once, the tick it started matching. Forcing it
 * back every tick while the screen just sits there would fight a user who
 * picked something else by hand in the meantime.
 *
 * @param {object} deps
 * @param {() => import('../bot/screen.js').Screen[]} deps.getScreens
 * @param {() => { id: string }[]} deps.getActivities
 * @param {() => { restingMs: number }} deps.getEngineState
 * @param {() => string | null} deps.getRunTarget
 * @param {(target: string) => void} deps.setRunTarget
 * @param {() => string} deps.getScaleMode
 * @returns {{ stop: () => void }}
 */
export function createAutoSwitch(deps) {
  /** The trigger Screen that matched last tick, or null. */
  let lastMatchedId = null;

  function tick() {
    // Mid-fight is not a moment to go looking for a different screen, and
    // the engine already is not reading anything itself while resting.
    if ((deps.getEngineState().restingMs || 0) > 0) {
      return;
    }

    const target = getRenderTarget();
    if (!target) {
      return;
    }

    const activityIds = new Set(deps.getActivities().map((activity) => activity.id));
    const candidates = deps
      .getScreens()
      .filter((screen) => screen.triggerActivity && activityIds.has(screen.triggerActivity));

    const buffer = getBufferSize(target.canvas);
    const scaleMode = deps.getScaleMode();
    const matched = candidates.filter(
      (screen) => scoreScreen(target.gl, screen, buffer, scaleMode).matched
    );

    // Anything other than exactly one match is treated as no match: zero
    // is nothing to act on, and two or more is the same ambiguity the
    // Screens tab's own clash warning already exists to point out.
    if (matched.length !== 1) {
      lastMatchedId = null;
      return;
    }

    const screen = matched[0];
    if (screen.id === lastMatchedId) {
      return;
    }
    lastMatchedId = screen.id;

    if (deps.getRunTarget() !== screen.triggerActivity) {
      deps.setRunTarget(screen.triggerActivity);
    }
  }

  const timer = realSetInterval(tick, AUTO_SWITCH_POLL_MS);

  return {
    stop() {
      realClearInterval(timer);
    },
  };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/autoswitch.test.js --reporter=dot`
Expected: PASS, 10 tests.

- [ ] **Step 6: Commit**

```bash
git add src/core/autoswitch.js src/core/constants.js tests/autoswitch.test.js
git commit -m "feat(autoswitch): poll for a tagged screen, switch the Run target"
```

---

## Task 4: Screens tab UI and wiring

**Files:**
- Modify: `src/ui/panel/screens.js`
- Modify: `src/i18n/en.js`
- Modify: `src/i18n/vi.js`
- Modify: `src/main.js`
- Test: `tests/screen-autoswitch-ui.test.js` (create)

**Interfaces:**
- Consumes: `screenEditor.setTriggerActivity` (Task 2).
  `createAutoSwitch` (Task 3).

- [ ] **Step 1: Add the i18n keys**

In `src/i18n/en.js`, find `'screens.ratioHint':` (`grep -n
"'screens.ratioHint'" src/i18n/en.js`) and add directly after its line:

```js
  'screens.ratioHint': 'Share of samples matching right now',
  'screens.triggerHint': 'When this screen is the only one on show, the Run target switches to this activity. It never presses Run by itself.',
  'screens.triggerUnset': '— none —',
```

In `src/i18n/vi.js`, find `'screens.ratioHint':` and add directly after
its line:

```js
  'screens.ratioHint': 'Tỉ lệ điểm mẫu đang khớp',
  'screens.triggerHint': 'Khi màn hình này là thứ duy nhất đang hiện, ô Run target tự chuyển sang activity này. Không tự bấm Run.',
  'screens.triggerUnset': '— không —',
```

- [ ] **Step 2: Write the failing UI test**

Create `tests/screen-autoswitch-ui.test.js`:

```js
/**
 * The Screens tab's own dropdown for `triggerActivity`: lists the current
 * activities, defaults to blank, and survives a stored id that no longer
 * names one of them.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { renderScreensTab } from '../src/ui/panel/screens.js';
import { createScreen } from '../src/bot/screen.js';

function renderInto(screen, activities, screenEditorOverrides = {}) {
  document.body.replaceChildren();
  const node = renderScreensTab({
    getScreens: () => [screen],
    getActivities: () => activities,
    getEngineState: () => ({ screen: null, screenName: null }),
    screenEditor: {
      probe: () => null,
      setTriggerActivity: vi.fn(),
      ...screenEditorOverrides,
    },
    refresh: () => {},
  });
  document.body.append(node);
  return node;
}

function triggerSelect(node) {
  return [...node.querySelectorAll('select')].find((select) =>
    [...select.options].some((option) => option.value === '')
  );
}

describe('the trigger-activity dropdown', () => {
  it('defaults to blank on an untagged screen', () => {
    const screen = createScreen({ id: 'a' });
    const node = renderInto(screen, [{ id: 'raid', name: 'Raid' }]);

    expect(triggerSelect(node).value).toBe('');
  });

  it('shows the screen\'s own activity selected', () => {
    const screen = createScreen({ id: 'a', triggerActivity: 'raid' });
    const node = renderInto(screen, [{ id: 'raid', name: 'Raid' }]);

    expect(triggerSelect(node).value).toBe('raid');
  });

  it('calls setTriggerActivity with the chosen id', () => {
    const screen = createScreen({ id: 'a' });
    const setTriggerActivity = vi.fn();
    const node = renderInto(screen, [{ id: 'raid', name: 'Raid' }], { setTriggerActivity });

    const select = triggerSelect(node);
    select.value = 'raid';
    select.dispatchEvent(new Event('change'));

    expect(setTriggerActivity).toHaveBeenCalledWith('a', 'raid');
  });

  it('calls setTriggerActivity with null for the blank option', () => {
    const screen = createScreen({ id: 'a', triggerActivity: 'raid' });
    const setTriggerActivity = vi.fn();
    const node = renderInto(screen, [{ id: 'raid', name: 'Raid' }], { setTriggerActivity });

    const select = triggerSelect(node);
    select.value = '';
    select.dispatchEvent(new Event('change'));

    expect(setTriggerActivity).toHaveBeenCalledWith('a', null);
  });

  it('does not throw when the stored activity no longer exists', () => {
    const screen = createScreen({ id: 'a', triggerActivity: 'deleted-activity' });

    expect(() => renderInto(screen, [{ id: 'raid', name: 'Raid' }])).not.toThrow();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/screen-autoswitch-ui.test.js --reporter=dot`
Expected: FAIL — no second `<select>` with a blank option exists yet (the
only current `<select>` in a party row is the World Boss picker, and this
Screen is not a party screen).

- [ ] **Step 4: Add the dropdown**

In `src/ui/panel/screens.js`, find the `partyToggle` block (`grep -n
"const partyToggle = " src/ui/panel/screens.js`) and add directly before
it:

```js
    // Which activity this screen means, for auto-switching the Run
    // target. Blank is "no consequence" — every screen before this field
    // existed, and every screen the user never tags.
    const triggerSelect = el('select', {
      class: 'bhb-rule__gate',
      title: t('screens.triggerHint'),
    });
    const triggerBlank = el('option', { text: t('screens.triggerUnset') });
    triggerBlank.value = '';
    triggerSelect.append(triggerBlank);
    for (const activity of deps.getActivities ? deps.getActivities() : []) {
      const option = el('option', { text: activity.name });
      option.value = activity.id;
      triggerSelect.append(option);
    }
    // A screen whose stored id no longer names an activity (it was
    // deleted) still needs a place to sit in the control without
    // crashing — a bare option carrying just that stale id does it.
    if (screen.triggerActivity && !triggerSelect.querySelector(`option[value="${screen.triggerActivity}"]`)) {
      const stale = el('option', { text: screen.triggerActivity });
      stale.value = screen.triggerActivity;
      triggerSelect.append(stale);
    }
    triggerSelect.value = screen.triggerActivity || '';
    triggerSelect.addEventListener('change', () => {
      deps.screenEditor.setTriggerActivity(screen.id, triggerSelect.value || null);
      deps.refresh();
    });

```

- [ ] **Step 5: Show it in the row**

Find `el('div', { class: 'bhb-screen__tune' }, [` (`grep -n
"bhb-screen__tune" src/ui/panel/screens.js`):

```js
      el('div', { class: 'bhb-screen__tune' }, [
        el('span', { class: 'bhb-note', text: `${t('screens.anchors')} ${screen.anchors.length}` }),
        ratio,
        el('span', { class: 'bhb-mono bhb-note', text: screen.minRatio.toFixed(2) }),
      ]),
```

Replace with:

```js
      el('div', { class: 'bhb-screen__tune' }, [
        el('span', { class: 'bhb-note', text: `${t('screens.anchors')} ${screen.anchors.length}` }),
        ratio,
        el('span', { class: 'bhb-mono bhb-note', text: screen.minRatio.toFixed(2) }),
        triggerSelect,
      ]),
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/screen-autoswitch-ui.test.js --reporter=dot`
Expected: PASS, 5 tests.

- [ ] **Step 7: Run the existing Screens tab tests to check nothing regressed**

Run: `npx vitest run tests/screens-ambiguous.test.js tests/screens-toggle.test.js tests/screen-capture-arm.test.js tests/i18n.test.js --reporter=dot`
Expected: PASS (unchanged).

- [ ] **Step 8: Wire `createAutoSwitch` into `main.js`**

In `src/main.js`, find the inline `setRunTarget` currently defined only
inside the `createPanel({...})` call (`grep -n "setRunTarget: (target)"
src/main.js`):

```js
    getRunTarget: () => settings.runTarget,
    setRunTarget: (target) => {
      settings.runTarget = target;
      saveSettings(settings);
    },
```

Replace with (hoisting the setter so the new poll can share it rather
than duplicating the save-on-change logic):

```js
    getRunTarget: () => settings.runTarget,
    setRunTarget,
```

Then find `const screenEditor = createScreenEditor({` (`grep -n "const
screenEditor = createScreenEditor" src/main.js`) and add, directly above
it:

```js
  function setRunTarget(target) {
    settings.runTarget = target;
    saveSettings(settings);
  }

```

Then, directly after the `screenEditor` declaration's closing `});`, add:

```js

  createAutoSwitch({
    getScreens,
    getActivities,
    getEngineState: engine.getState,
    getRunTarget: () => settings.runTarget,
    setRunTarget,
    getScaleMode: () => settings.scaleMode,
  });
```

Add the import, alongside the other `./core/*` imports (`grep -n
"from './core/keys.js'" src/main.js`):

```js
import { Keys } from './core/keys.js';
import { createAutoSwitch } from './core/autoswitch.js';
```

- [ ] **Step 9: Build to check for syntax errors**

Run: `node build.js`
Expected: `built dist/bhb.user.js  vX.Y.Z  ...KB` with no errors.

- [ ] **Step 10: Commit**

```bash
git add src/ui/panel/screens.js src/i18n/en.js src/i18n/vi.js src/main.js tests/screen-autoswitch-ui.test.js
git commit -m "feat(screens): a dropdown per row to auto-switch the Run target"
```

---

## Task 5: Full verification and release

**Files:** none (verification only)

- [ ] **Step 1: Run the entire test suite**

Run: `npx vitest run --reporter=dot --testTimeout=15000`
Expected: every test file passes. If a file fails, read the failure and
fix it in the task that owns the touched file before continuing — do not
proceed to the version bump with a red suite.

- [ ] **Step 2: Build**

Run: `node build.js`
Expected: `built dist/bhb.user.js  vX.Y.Z  ...KB` with no errors.

- [ ] **Step 3: Bump the version**

This is a new feature (a milestone, per this project's versioning
convention: a milestone is a minor bump), not a bugfix, so:

Run: `node bump.js minor`
Expected: prints the old and new version and rebuilds `dist/bhb.user.js`.

- [ ] **Step 4: Commit the version bump**

```bash
git add package.json dist/bhb.user.js README.md README.en.md
git commit -m "chore: bump version for screen auto-switch"
```

- [ ] **Step 5: Push**

```bash
git push origin master
```
