# Vision and screen state — design

Milestone 2 of the roadmap. The reliability layer everything after it needs.

## Why

A rule is one pixel. That is enough to click Rerun and enough to be wrong in
three ways:

1. **Fragile.** One pixel is one sample. An animation frame, a particle, a
   tooltip edge — any of them flips the match.
2. **Blind.** The bot does not know where it is. A colour that means "Yes" on
   the raid dialog means something else on the loot screen, and the bot will
   click it either way.
3. **Silent when out of resources.** Running dry looks exactly like a rule that
   stopped matching. The only backstop is a five-minute idle auto-stop, which
   wastes five minutes and explains nothing.

Longer action chains make all three worse, so they are fixed before the
per-activity runners of Milestone 3 are written.

## Shape

Three additions, each reusing what exists:

- **Fingerprint** — a region and a sparse set of sample points inside it,
  replacing the single pixel where more confidence is wanted.
- **Screen** — a named set of fingerprints that identifies where the game is.
- **Gate** — a rule declares which screens it may fire on. The engine detects
  the screen once per tick and skips rules that do not belong.

## Fingerprint — `src/core/region.js`

Sibling of `pixel.js`; `pixel.js` is left alone.

```js
{ x, y, w, h, bw, bh, samples: [{ dx, dy, hex }, ...] }   // dx, dy in 0..1
```

- `readRegion(gl, x, y, w, h)` — **one** `readPixels` for the whole region,
  sampled from the result. Cheaper than 16 single-pixel reads.
- `captureFingerprint(gl, rect)` — a 4×4 grid of 16 samples spread over the
  region.
- `matchFingerprint(gl, fp, buffer, scaleMode, tolerance, minRatio)` →
  `{ matched, ratio }`. Matches when the share of samples within tolerance is
  at least `minRatio` (default 0.75), so 4 of 16 samples may be wrong.

`dx`/`dy` are relative to the region, and the region carries `bw`/`bh` like
every stored point, so a fingerprint rescales through the existing
`resolvePoint` path. The coordinate system does not change.

## Rule model — extended, not replaced

`RulePoint` gains three optional fields: `w`, `h`, `samples`. A point with
`samples` is matched as a region; a point without is matched as a pixel,
exactly as today. `model.js` keeps its one shape, and **every existing rule and
exported profile keeps working untouched**.

The engine's `readPixel(...)` call becomes `matchPoint()`, which picks the
branch. That is the whole change to `evaluateRules`.

## Screen — `src/rules/screen.js`

```js
{ id, name, anchors: [fingerprint, ...], minRatio, stopsTask: false }
```

`detectScreen(gl, screens, buffer, mode)` returns the first screen whose
anchors **all** match, or `null` for unknown. List order is priority, as it is
for rules.

Screens live in the profile beside `rules`, so export/import carries them for
free. Storage goes to schema **v3**; migrating v2 adds `screens: []` and
changes nothing else.

Out of energy, tickets or badges is not a separate mechanism: it is a screen
with `stopsTask: true`.

## Engine

Each tick detects the screen once, before walking any rule.

- `state.screen` joins `getState()`, so the HUD shows where the bot is. A
  change of screen emits one log entry (`kind: 'screen'`).
- A rule gains `screens: string[]`. Empty or absent means anywhere —
  backward compatible. A rule that does not belong on the current screen is
  skipped before any pixel is read, which pays back part of the detection cost.
- A screen with `stopsTask` stops the task and logs `kind: 'resource'`. This is
  what replaces waiting out the blind five-minute idle timeout.

Per tick the cost is one `readPixels` per anchor. Six screens with one anchor
each at a 500 ms poll is negligible, and reads are cached per frame so several
rules over the same region do not re-read it.

## UI — a Screens tab

A fourth tab beside Tasks / Rules / Log:

- The screen list: reorder, rename, delete, toggle `stopsTask`.
- **Capture**: drag a rectangle on the canvas, reusing the marker layer the
  rule editor already draws with, then name it. That is one anchor.
- A live ✓/✗ and the measured `ratio` per screen while the bot runs, so
  `minRatio` is tuned by eye instead of guessed.

Strings are added to both `i18n/vi.js` and `i18n/en.js`.

## Tests

Against a fake `gl`, as the existing tests do. No jsdom needed except where
already used.

- Fingerprint: capturing then matching itself gives ratio 1.0; the match holds
  when the framebuffer is resized; the ratio drops by the expected step as
  samples are dirtied.
- Screen: order decides priority; unknown when nothing matches; `stopsTask`
  stops the engine.
- Storage: v2 → v3 migration preserves existing rules.
- Engine: a gated rule fires only on its screens.

## Files

**New** — `src/core/region.js`, `src/rules/screen.js`, `src/ui/panel/screens.js`

**Changed** — `src/core/engine.js`, `src/rules/model.js`, `src/core/storage.js`,
`src/ui/store.js`, `src/ui/panel/index.js`, `src/i18n/{vi,en}.js`

## Out of scope

- A transition graph (screen A + action must lead to screen B, with recovery).
  Which flows exist is only clear once the activity runners are written.
- Reading resource bars by pixel width to stop before running dry. The
  `stopsTask` screen is the safety net; measuring the bar is a refinement.
- Per-activity runners and the priority queue. That is Milestone 3, and it is
  what this layer exists to support.
