# Auto-learned rest duration

## Problem

`restSec` tells a step to sit still for N real seconds after it clicks,
which is how the bot survives a battle without re-reading the same frame
for the length of a Dungeon run, a Raid, or a Trials/Gauntlet fight. Today
that number is typed in by hand: the user runs the activity, times the
fight with a stopwatch, and enters the result. It goes stale whenever gear,
tier, or the chosen speed multiplier changes the fight's real length, and
nothing tells the user it has.

## Goal

A step can measure its own fight length from how the bot actually ran, and
keep `restSec` current on its own, with the user's typed number always
able to override it.

## Non-goals

- This does not change `restSec`'s meaning or its consumers (`engine.js`'s
  `restingUntil`). A learned value is still just a `restSec` the engine
  reads exactly as before.
- This does not attempt to time a fight when the user has not pointed at
  both ends of it. No guessing from step order.
- Loose Script steps are in scope exactly as far as the user tags two of
  them; there is no dependency on the sequence cursor.

## Design

### Two tags, not an inferred order

Two independent booleans on `Step`:

- `restAuto` — this step starts a timed wait, and that wait's length
  should be learned rather than typed. Only meaningful on a step that also
  has `kind: CLICK` (or the implicit click kind) and is the one `restSec`
  already lives on.
- `endsTimer` — clicking this step is the signal that the fight begun by a
  `restAuto` step is over.

Both are opt-in, default `false`; every existing profile is unaffected.

**Exactly one of each per activity.** An activity gets one `restAuto` step
and one `endsTimer` step, never two of either — there is one fight to time
per activity, not several. Turning the toggle on for a step turns it off
on every other step sharing that `activity`, in the same editor action, so
the constraint holds by construction rather than by a rule the engine has
to notice and recover from. The loose Script set (`activity: null`) is its
own group for this purpose, same as everywhere else `step.activity` groups
steps.

This also settles Run-All: it runs the same steps Solo would for whichever
activity has its turn (`stepsForActivity`, unchanged), so it is already
using that activity's one pair — there is nothing Run-All-specific to
configure. What one activity learned, every task that runs it (Script tag,
Solo, Run-All) benefits from, because it is the same step either way.

### Measuring

The engine keeps one pending timer at a time per activity, keyed by the
`restAuto` step's id:

1. A `restAuto` step clicks. The engine records `{ stepId, startedAt: realNow() }`
   for that step's activity. Any previous pending timer for that activity
   (e.g. the fight before it never found its end before a new one started)
   is discarded unrecorded — it already proved itself unmeasurable.
2. The bot carries on exactly as it does today: it rests for the step's
   current `restSec` (0 the first time, so no change in behaviour), then
   resumes the ordinary scan once that runs out.
3. The first click of a step tagged `endsTimer` in the same activity, while
   a pending timer for that activity exists, closes it: `elapsed = realNow()
   - startedAt`.

This fires regardless of which task is running it (Script, one activity on
its own, or Run-All), since it only depends on two steps' own click events,
not on cursor position.

### Turning a measurement into the number the bot uses

A hidden, per-step field, `restObserved` (seconds), holds a running
estimate — never shown in the Steps tab, only `restSec` is.

On every accepted measurement:

```
restObserved = restObserved === 0
  ? elapsed
  : restObserved * 0.7 + elapsed * 0.3
restSec = min(ceiling, round(restObserved * 1.15))
```

30% weight for the newest fight, 70% kept from history: a few fights
settle the average, and one odd lag spike does not swing it far. The 15%
pad on top covers ordinary run-to-run variance so the bot does not wake
early into a fight that is still finishing — undershooting only costs a
few wasted scan ticks, so the pad is there for the common case, not as a
hard safety requirement.

`ceiling` is the existing count-cap pattern: `AUTO_STOP_TIMEOUT/1000 - 10`,
so a learned value can never itself trigger the auto-stop it is trying to
avoid.

### Discarding a bad sample

If `elapsed > ceiling`, the sample is thrown away entirely — not folded
into the average, not used to set `restSec`. An elapsed time that long
almost always means something other than a normal fight happened (a
watchdog reload, the user stepping away, a hang the escape key cleared) and
would otherwise drag the average toward a number that wastes real time on
every future run.

### Resetting when the speed changes

`restSpeedTo` (hidden, alongside `restObserved`) records the `speedTo` in
effect on the `restAuto` step at the last accepted measurement. If the
step's current `speedTo` differs from it when a new measurement comes in,
the old average is not blended with the new one — a fight timed at 1x and
one timed at 10x are not samples of the same thing. `restObserved` is set
directly to this run's `elapsed`, and `restSpeedTo` updated to match.

### Manual override

Typing directly into the `restSec` number input while `restAuto` is on
turns `restAuto` off for that step — the typed number is now what the user
wants, and the engine does not overwrite it again. Turning `restAuto` back
on resets `restObserved` to 0, so it learns fresh rather than resuming an
average that might be stale by however long it was off.

### UI

- Steps tab: a small toggle button next to the existing rest-seconds input,
  for `restAuto`, visible for `CLICK`-kind steps. A second, similar toggle
  for `endsTimer`. Turning either on clears it from every other step in the
  same activity in that one action, so the one-pair-per-activity rule is
  never something the user has to remember or clean up by hand.
- HUD pill: once a `restAuto` step for the running activity has a nonzero
  `restObserved`, the pill shows it next to the speed badge (e.g. `DUN 10x
  · ~42s`), always, whether or not the bot is resting right now. Nothing is
  shown before the first measurement exists.

## Data model

New fields on `Step` (`src/bot/step.js`), all defaulted in `createStep`:

```
restAuto: false
endsTimer: false
restObserved: 0
restSpeedTo: 0
```

No migration: a step loaded from storage without these reads them as their
defaults via the same spread pattern every other optional field already
uses.

## Engine changes

`src/core/engine.js` gains:

- A small map of pending timers, keyed by `step.activity || ''` the same
  null-safe way `renumberAutoLabels` already groups by activity, cleared
  on `stop()`/`start()` the way `cursor`/`restingUntil` already are.
- `tick()` already has one place all three click paths (`tryStep`,
  `runSequence`'s forward click, `lookBack`'s resync click) funnel through
  before anything else happens: the `if (hit.clicked) { ... }` block
  (`engine.js:950`) that currently handles `speedForStep` and `restSec`.
  The timer open/close logic is added there, after a click actually went
  out: if the clicked step has `restAuto`, open or replace that activity's
  pending timer; if it has `endsTimer` and a pending timer exists for its
  activity, close it out, run the update above, and write the result back.
- A new dependency, `deps.recordRestMeasurement(stepId, { restSec,
  restObserved, restSpeedTo })`, wired in `main.js` to a new
  `stepEditor.recordAutoRest(...)` that mutates and persists the step the
  same way `setRest` does today — the engine never holds a write path to
  storage itself.

`src/ui/hud.js` reads a new `getState()` field, e.g. `activityRestSeconds`
— the `restObserved` of the running activity's `restAuto` step, kept in
engine state across ticks (set when a timer opens/closes for the active
activity, cleared on activity/task change) so the pill does not need to
search steps itself.

## Testing

- `src/bot/step.js`: defaults for the four new fields; `recordAutoRest`-
  equivalent pure helper for the EMA/ceiling/discard math, unit tested the
  way `pointsByPlace`/`waitSatisfied` already are.
- `src/bot/step-editor.js`: setting `restAuto` (or `endsTimer`) on a step
  clears it from every other step with the same `activity`, including the
  loose-Script group (`activity: null`) and across different activities
  staying independent.
- `src/core/engine.js`: an engine-level test (same harness as
  `tests/sequence-scan.test.js`) that clicks a `restAuto` step, advances
  fake time, clicks an `endsTimer` step, and asserts the step's `restSec`/
  `restObserved` were written through the editor dependency; a second test
  for the speed-change reset; a third for the oversized-sample discard;
  a fourth proving a different activity's `endsTimer` does not close this
  activity's timer.
- `src/ui/hud.js`: the pill shows the learned number once present, and
  stays silent before any measurement exists.
