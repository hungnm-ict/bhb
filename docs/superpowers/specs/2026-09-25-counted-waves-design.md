# Counted waves — design

A step that waits for a spot on screen to *change* a given number of times,
and the Invasion sequence it exists to make possible.

## Why

Invasion cannot be won. It is an endless ladder of waves, and the reward is
capped: 21 enemies — seven waves of three — pays out the full drop, gold and
experience. Everything fought after the twenty-first enemy is time spent for
nothing. The fast way to farm it is to enter at a low wave, kill seven waves,
quit, and enter again. Quitting is scored as a defeat and pays in full.

Every other activity the bot runs ends by itself: the energy runs out, a
screen says so, a button goes grey. Invasion has no such ending. The only
thing that marks progress is the wave counter at the top of the battle
screen — a box whose digits change once per wave.

The bot matches colours. It cannot read "13". But it does not need to: seven
waves is seven *changes* to that box, whatever the digits say. That is the
one thing missing, and it is what this adds.

## Shape

**A new step kind, `COUNT`.** It owns a region rather than a pixel, and it
holds the sequence until that region's contents have changed `countTo` times.
Then the cursor moves on, exactly as a `WAIT` step does when its condition
clears.

```
  kind:     'count'
  countTo:  7        how many changes to wait for
  countCap: 180      seconds after which it gives up and moves on anyway
```

Nothing else about a step changes. It is stored, exported, gated by screen
and tagged to an activity like any other.

## Why counting changes rather than reading the number

The wave counter shows absolute waves: entering at 490 shows 490, 491, 492.
A captured "497" would be a step that has to be re-captured every time the
user picks a different entry wave — and picking a lower wave to go faster is
the whole point of the technique. A change is a change at any number.

It also generalises. "Wait for this spot to blink three times" is a thing the
bot could not say before, and several game screens are built out of exactly
that.

## Counting

Each tick, while the cursor sits on a `COUNT` step:

1. Resolve the step's region against the live framebuffer, the same way a
   region point resolves today.
2. Read it and sample it — `captureFingerprint`, already written for screen
   anchors.
3. Compare, sample by sample, against the reading from the previous tick,
   using the step's own tolerance. Different → one change.
4. At `countTo` changes, clear the counter and let the cursor through.

The first tick on the step has nothing to compare against; it stores the
reading and counts nothing. The counter and the stored reading are cleared
whenever the cursor arrives at the step, so a second lap starts at zero.

### Undercounting is the safe direction

The poll can be slower than a wave, and a change seen late is a change not
seen at all. That makes the bot quit *later* than asked, which still collects
the full reward — it only costs time. There is no mechanism that counts a
wave twice, so overcounting, the failure that would actually lose the
reward, cannot happen.

## The three clocks that must be told

A count is a long stretch with no click, and the engine already has three
timers that read a long stretch with no click as "stuck":

| Clock | Today | With a count step |
|---|---|---|
| `IDLE_ADVANCE_MS` (12s) | Run-All moves to the next activity | each counted change refreshes `idleSince` |
| `AUTO_STOP_TIMEOUT` (3min) | the whole run stops | each counted change refreshes `lastActionAt` |
| pace ladder (300→1000ms) | polling backs off when nothing matches | pinned to the fastest rung while counting |

The pace pin is not an optimisation. A low wave at 15.5× game speed can be
shorter than a second, and a 1000ms poll would walk straight past it.

`RESYNC_AFTER_MS` needs nothing: a count step, like a wait step, resets
`missingSince` on every tick, so the runner never decides it has lost its
place while one is running.

### The cap

`countCap` seconds without reaching `countTo` lets the cursor through anyway
and logs it. Without it, a region that stops changing — the box covered by a
popup, a capture pointed at the wrong place — parks the bot in the battle
until the three-minute auto-stop kills the whole run. With it, the worst case
is one wasted lap.

## Capturing the region

The steps tab has no way to draw a box; only the screens tab does. A `COUNT`
step gets a capture button that runs the same drag-select the screen anchors
use, and stores the result as a region point on the step. The panel gets out
of the way for the drag and comes back after, as it already does for a screen
anchor.

Pixel capture is untouched. A step is a region step or a pixel step by what
its points hold, which is how `matchPoint` already decides.

## The Invasion sequence

What the user will build once the step exists — no code, just steps tagged
`invasion`:

1. Invasion icon → the Invasion dialog
2. `PLAY`
3. `YES` on "your team is not full", optional
4. `AUTO` **while red** — quitting the previous run left auto-battle off, and
   nothing clears waves until it is back on
5. **count 7 changes of the wave box**
6. `AUTO` **while green** — off again, which is what makes the ✕ reachable
7. `✕` top-right → the EXIT dialog
8. `YES`
9. `TOWN` on the DEFEAT screen
10. back at the town, the cursor wraps and the next run starts

Two steps on one button, told apart by its colour. The button says which
state it is in, so a step matching red fires only when auto needs turning on
and a step matching green only when it needs turning off; neither can fire in
the other's place. This is the existing colour language, not an addition.

The loop needs nothing new either: a step sequence already wraps to the top.
Badges running out ends it the ordinary way, through a `stopsTask` screen or
an `endsRun` step on the greyed-out `PLAY`.

## Error handling

- **Region no longer readable** (canvas gone, size changed past resolving) —
  the tick reads nothing and counts nothing; the cap ends it.
- **A count step with no region** — not ready, the same as a pixel step with
  no colour, and skipped by `isStepReady`.
- **`countTo` of zero** — passes through immediately. It is a step that waits
  for nothing, which is a thing a user may reasonably build while setting up.

## Testing

- counting: a fake gl whose region reads change on demand — n changes
  advances the cursor at exactly n, not n±1; an unchanged region never
  advances; the first tick counts nothing.
- reset: leaving and re-entering the step starts from zero.
- the cap releases the cursor and reports it.
- the three clocks: a counted change refreshes idle and action times; the
  pace stays at the fastest rung while a count step is live.
- storage: an old profile loads with the new fields defaulted; a profile with
  a count step survives export and re-import.

## Not in this

- Sending keys. The ✕ button reaches the EXIT dialog, so the bot stays a
  mouse.
- Reading digits. Nothing here knows what wave it is on, only that the wave
  changed.
- A built-in Invasion sequence. The steps are the user's, captured on their
  own screen, like every other activity.
