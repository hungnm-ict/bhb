# Auto-switch the Run target from the screen on show

## Problem

Choosing what to run is a manual step: open the Run tab, pick an activity
from the dropdown, press Run. A player who already knows what they want to
do — they just opened the Raid dialog, or World Boss, or Expedition, or
Trials — has to leave that screen, flip to the panel, and pick it by name.
The game already said which one it is; the bot should read that instead of
asking again.

## Goal

A Screen can be tagged with the activity it means. The moment that Screen
is the one thing on show, the Run target quietly becomes that activity.
Starting it is still the user's own press of Run — this only saves the
trip to the dropdown.

## Non-goals

- This never presses Run itself. It only changes which activity the
  dropdown is sitting on.
- This never interrupts a fight. A step's blind rest is time the engine
  already refuses to look at anything; this is no exception.
- This does not replace or change screen-gated steps, `stopsTask`, or any
  existing use of a Screen. A Screen with no activity tag behaves exactly
  as it always has.
- This does not attempt to resolve an ambiguous match on its own — see
  "Two trigger Screens at once" below.

## Design

### Tagging a Screen

A Screen gains one new, optional field:

```
triggerActivity: string | null   // an Activity id, or none
```

Default `null` on every existing and new Screen — nothing changes for a
Screen nobody tags. Set from the Screens tab: a dropdown next to each
Screen's row, listing the current activities plus a blank "— none —"
entry. The same list and the same blank-means-off convention the Steps
tab's own activity picker already uses.

A Screen's anchors, `minRatio`, and matching are completely unchanged —
tagging it only adds a consequence to the Screen already matching or not.

### The poll

A new, small loop, independent of the engine's own task scheduler — it
runs whether or not a task is active, because the whole point is to notice
a screen the user opened *instead of* starting anything:

- Every 400ms (real time; this never needs the speed hack, and 400ms is
  cheap enough not to matter either way), check:
  1. Is there a render target (`getRenderTarget()`)? If not, skip this
     tick.
  2. Is the engine currently resting (`engine.getState().restingMs > 0`)?
     If so, skip this tick entirely — mid-fight is not a moment to go
     looking for a different screen, and the engine already is not
     reading anything itself.
  3. Score every Screen whose `triggerActivity` is set **and** still
     names an activity that exists (`getActivities()`), the same
     `scoreScreen(gl, screen, buffer, mode)` the engine's own screen
     detection already uses.
  4. Collect every Screen that matched. If the count is anything other
     than exactly one, do nothing this tick (see "Two trigger Screens at
     once" and "A tagged activity gets deleted").
  5. Exactly one match: see "Edge-triggered, not level-triggered" for
     whether it actually changes anything.

### Edge-triggered, not level-triggered

The poll remembers which trigger Screen (if any) matched on the *previous*
tick. Three cases:

- **Newly matching** (it did not match last tick, it matches now): if its
  `triggerActivity` differs from the current Run target
  (`getRunTarget()`), call `setRunTarget(triggerActivity)`. If it is
  already the Run target, nothing to do.
- **Still matching** (same Screen matched last tick too): do nothing,
  even if the user has since picked a different Run target by hand in the
  meantime. Forcing it back every 400ms while the screen just sits there
  would fight the user's own choice.
- **No longer matching** (it matched last tick, nothing does now, or a
  different one does): forget it. The next time this same Screen's turn
  comes around, it is "newly matching" again and applies once more.

This means leaving and returning to the same dialog re-applies the
switch; staying on it while the user overrides the dropdown does not
re-fight them.

### Two trigger Screens at once

If two or more tagged Screens match the same frame, this is the exact
shape of bug already described in the Screens tab's own clash warning
(`screens.clash`): two Screens that cannot be told apart by their anchors.
The poll does not guess — it does nothing that tick, the same as if
nothing had matched. The existing clash warning, already visible in the
Screens tab whenever this happens, is the mechanism that tells the user
to tighten one Screen's anchors; nothing new is built for it here.

### A tagged activity gets deleted

A Screen's `triggerActivity` can end up naming an activity that no longer
exists (the user deleted it). Such a Screen is treated as if untagged:
excluded from scoring, no warning. This is expected to be rare — deleting
an activity a Screen still points at — and the Screen keeps the stale id
quietly until the user picks a new activity for it or deletes the Screen;
nothing reads the stale id for anything else in the meantime.

## Data model

`src/bot/screen.js`: `createScreen()` gains `triggerActivity: null` in its
defaults. No migration — a Screen loaded without the field reads the
default, same as every other optional field here.

## New module

`src/core/autoswitch.js`, mirroring the shape of `src/core/speed.js` — a
small, dependency-injected module, not a class:

```js
/**
 * @param {object} deps
 * @param {() => import('../bot/screen.js').Screen[]} deps.getScreens
 * @param {() => { id: string }[]} deps.getActivities
 * @param {() => { restingMs: number }} deps.getEngineState
 * @param {() => string | null} deps.getRunTarget
 * @param {(target: string) => void} deps.setRunTarget
 * @param {() => string} deps.getScaleMode
 * @returns {{ stop: () => void }}
 */
export function createAutoSwitch(deps) { ... }
```

Started once from `main.js` alongside the engine and the editors, passing
the same `store.get().runTarget` / `store.setRunTarget` plumbing the Run
tab itself already uses. Internally it is a `realSetInterval` (the
existing real-time primitives in `timers.js`, same reasoning every other
poller in this codebase already uses: the speed hack must never touch
this clock). Each tick: `getRenderTarget()` from `core/canvas.js` for
`{ canvas, gl }`, `getBufferSize(canvas)` from `core/coords.js` for the
buffer `scoreScreen` needs, then `scoreScreen(gl, screen, buffer,
deps.getScaleMode())` from `bot/screen.js` per candidate Screen — the
exact same three calls `engine.js`'s own `updateScreen` already makes for
its own screen detection. Returns `{ stop }` for symmetry with the rest
of the codebase's lifecycle objects, though in practice it runs for the
page's whole life, the same as the speed hack's own frame counters do.

## UI

Screens tab, per row: a `<select>` beside the existing controls (minRatio
slider, stopsTask, notify), titled with a hint explaining what it does.
Blank/"— none —" is the first option and the default. Picking an activity
sets `triggerActivity`; blank clears it.

## Testing

- `src/bot/screen.js`: `createScreen()` defaults `triggerActivity` to
  `null`.
- `src/core/autoswitch.js`: a fake clock and a fake `getRenderTarget`
  (the same mocking pattern `tests/sequence-scan.test.js` already uses
  for the engine) proving: a single matching trigger Screen calls
  `setRunTarget` once; a second tick where it still matches does not call
  it again; the user changing `getRunTarget()`'s return value in between
  is not fought on the next still-matching tick; the Screen un-matching
  and re-matching calls `setRunTarget` again; two trigger Screens matching
  at once calls `setRunTarget` zero times; a `triggerActivity` naming a
  deleted activity is excluded from scoring entirely; `restingMs > 0`
  skips the tick with no scoring at all.
- `src/bot/screen-editor.js` (or wherever the setter lands): setting and
  clearing `triggerActivity` on a Screen.
- Screens tab UI: the dropdown shows the current activities, defaults to
  blank, and calls the setter with the chosen id or `null`.
