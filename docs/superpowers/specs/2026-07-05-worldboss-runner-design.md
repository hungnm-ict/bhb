# World Boss Runner — Design Spec

**Date:** 2026-07-05
**Status:** Approved (pending written-spec review)
**Scope:** BHB Phase 1 — first real automation feature

## Goal

Let the user pick a single game activity and run it either **a fixed number of
times** or **until its resources are exhausted**. Ship **World Boss** as the
first complete, verifiable slice. The same runner framework is reused for later
activities (Raid, PVP, GVG, Trials/Gauntlet, …) by declaring new activity data —
no new loop code.

Two stop modes, per the user:

- **Run N times** — user types e.g. `10`; the bot does exactly 10 runs then stops.
- **Until out of resources** — the bot keeps running until the game reports the
  activity's resource is depleted (World Boss: "not enough Xeals").

This runs the activity in its **default in-game configuration** (whatever boss /
tier / difficulty / team the user set up manually). No level/mode selection —
matching the reference bot's World Boss limitation.

## Non-Goals (explicit YAGNI for this slice)

- Other activities beyond World Boss (framework supports them; only WB is wired).
- The full run-all / AFK auto-cycle across activities.
- Full `SessionStats` model + JSON persistence (just an in-memory run counter +
  log lines for now).
- Multi-account tabs (runs against the single selected window in the test window).
- In-app template capture tool (user crops the templates manually).

## Approach

Adapted from the 9-9-9-9 bot's proven reactive model (`AbstractDoFarmingApp`):
each activity is **data** — an ordered list of "if this button/dialog is on
screen, click it" actions — driven by one generic tick loop. This is robust to
the game's reactive nature (popups, variable screen ordering) and makes new
activities cheap to add.

Rejected alternative: a hand-written imperative state machine per activity
(`enter → wait → click start → wait result → collect`). Reads clearly for one
activity but is timing-brittle and every new activity is new bespoke code.

## Architecture

### New types (`BHB/Features/`)

```csharp
// One "if you see X, click it" rule.
public sealed record ReactiveAction(
    string TemplatePath,          // relative to Templates/, e.g. "WorldBoss/regroup.png"
    bool   CountsAsRun      = false,
    bool   IsOutOfResources = false);

// An activity as data: an ordered rule list + how to (re)enter from the map.
public sealed class ActivityDefinition
{
    public required string                       Name       { get; init; }
    public required IReadOnlyList<ReactiveAction> Actions   { get; init; }
    public string?                                EntryIcon  { get; init; }   // template clicked to (re)enter after being lost
    public int                                    LoopIntervalMs      { get; init; } = 2000;
    public int                                    ReentryAfterMisses  { get; init; } = 6;
}

public enum RunMode       { Count, UntilOutOfResources }
public enum RunStopReason { CountReached, OutOfResources, Cancelled, Error }

// Emitted as the run progresses (for UI + logging).
public sealed record ActivityProgress(
    int     RunsCompleted,
    int?    TargetRuns,      // null in UntilOutOfResources mode
    string  CurrentStep);    // template name last acted on, or "searching…"
```

### Testability seams (small interfaces)

The runner must be unit-testable without a live game, so screen input/output are
abstracted:

```csharp
public interface IFrameSource { Mat? Capture(); }                 // prod: wraps WindowCapture + hwnd
public interface IClicker     { void Click(int x, int y); }       // prod: wraps WindowInput.ClickTouch + hwnd
```

- `WindowFrameSource(IntPtr hwnd)` → `WindowCapture.CaptureAsMat(hwnd)`.
- `TouchClicker(IntPtr hwnd)` → `WindowInput.ClickTouch(hwnd, x, y)` (the true
  non-intrusive path).

`FindTemplate` already returns the match **center**, so the returned point is
clicked directly.

### The runner (`ActivityRunner`)

```csharp
public sealed class ActivityRunner
{
    public ActivityRunner(IFrameSource frames, IClicker clicker,
                          TemplateMatcher matcher, TemplateLibrary templates);

    public event Action<ActivityProgress>? Progress;   // runs completed, current step, etc.

    public Task<RunStopReason> RunAsync(
        ActivityDefinition activity, RunMode mode, int targetRuns, CancellationToken ct);
}
```

Tick loop (`LoopIntervalMs`, default 2s):

1. If cancellation requested → `Cancelled`.
2. If `mode == Count` and `completed >= targetRuns` → `CountReached`.
3. Capture a frame; if null (window gone/minimized), delay and continue.
4. Walk `Actions` in order; for the **first** template found on screen:
   - Click its point via `IClicker`.
   - `CountsAsRun` → `completed++`, raise `Progress`.
   - `IsOutOfResources` → return `OutOfResources`.
   - Reset the miss counter; break to next tick.
5. If no action matched, increment the miss counter. After `ReentryAfterMisses`
   consecutive misses, if `EntryIcon` is found on screen, click it to re-enter
   the activity, and reset the miss counter.
6. Delay `LoopIntervalMs`; loop.

Because only one relevant screen is visible at a time, "first match wins" ordering
naturally prioritizes (e.g. the out-of-resources dialog and the confirm popup are
placed early so they're handled promptly).

Exceptions inside the loop → log + return `Error`. Ordinary stop paths transition
the owning `BotInstance` state accordingly.

### World Boss activity (`WorldBossActivity.Create()`)

Ordered action list (derived from 9999's `WorldBossApp.getPredefinedImageActions`
plus the global not-full-team popup):

| # | TemplatePath                          | CountsAsRun | IsOutOfResources | Meaning |
|---|---------------------------------------|-------------|------------------|---------|
| 1 | `Global/confirm_start_not_full_team.png` | – | – | Confirm starting without a full team |
| 2 | `WorldBoss/not_enough_xeals.png`      | – | ✅ | Out of Xeals → stop |
| 3 | `WorldBoss/summon_boss.png`           | – | – | Summon on boss listing |
| 4 | `WorldBoss/summon_party.png`          | – | – | Summon on party listing |
| 5 | `WorldBoss/summon_tier_difficulty.png`| – | – | Summon on tier/difficulty screen |
| 6 | `WorldBoss/start_boss.png`            | – | – | Start the fight |
| 7 | `WorldBoss/regroup.png`               | ✅ | – | Victory → regroup (one run done) |
| 8 | `WorldBoss/regroup_defeated.png`      | ✅ | – | Defeat → regroup (still one run done) |

`EntryIcon` = `WorldBoss/entry_icon.png` (World Boss icon on the world map),
clicked to (re)enter after being lost. Exact set may need ±1 template during live
verification (e.g. an extra intermediate summon screen); the plan treats the flow
as tunable.

### Templates the user must supply (color crops from the live game)

Dropped into `BHB/Templates/…` with these exact names. The 9999 folder
(`Other Bots/…/game-images/800x520/buttons`) is the checklist + rough sizes, but
its images are pre-processed black/white masks and are **not** drop-in usable with
our OpenCV color matcher — fresh color crops are required.

```
Templates/Global/confirm_start_not_full_team.png
Templates/WorldBoss/not_enough_xeals.png
Templates/WorldBoss/summon_boss.png
Templates/WorldBoss/summon_party.png
Templates/WorldBoss/summon_tier_difficulty.png
Templates/WorldBoss/start_boss.png
Templates/WorldBoss/regroup.png
Templates/WorldBoss/regroup_defeated.png
Templates/WorldBoss/entry_icon.png
```

### Engine integration

- `BotInstance` gains
  `Task<RunStopReason> RunActivityAsync(ActivityDefinition, RunMode, int targetRuns, CancellationToken)`,
  which constructs `WindowFrameSource`/`TouchClicker` from its `Hwnd`, drives an
  `ActivityRunner`, and transitions `StateMachine` (`Running` → `OutOfResources`/
  `Stopped`) based on the result.
- Existing `IFeature`/`BaseFeature` scaffolding is left untouched (no unrelated
  churn); it may be retired later once the reactive model proves out.

### UI (existing test window, `MainWindow.xaml` + `MainViewModel`)

New "Activity Runner" group:

- **Activity** `ComboBox` (currently just "World Boss").
- Stop mode `RadioButton`s: **Run [N] times** (with a number input) / **Until out
  of resources**.
- **Start** / **Stop** buttons (`Start` enabled when a window is selected and not
  already running; `Stop` enabled while running).
- Live readout: runs completed / target, current step, and final stop reason.

VM additions: `SelectedActivity`, `IsCountMode`, `RunCount`, `RunsCompleted`,
`RunStatus`, `StartRunCommand`, `StopRunCommand`. `StartRun` runs the activity on
a background task and marshals `Progress` events to the UI via the Dispatcher.
All new bindings use explicit `Path=`.

## Error Handling

- Null frame (window minimized/closed) → skip tick, keep looping (don't crash).
- Missing template file → surfaced at start as a clear error listing the missing
  path(s); runner does not start.
- Loop exception → logged, `RunStopReason.Error`, state → `Dead`.
- `Stop` / cancellation → cooperative via `CancellationToken` → `Cancelled`.

## Testing

Unit tests (xUnit) drive `ActivityRunner` with a scripted `IFrameSource` (returns
a sequence of synthetic frames containing known template crops) and a recording
`IClicker`:

- **Count mode stops exactly at N:** frames yield `regroup` repeatedly → runner
  stops after N `CountsAsRun` hits; `RunsCompleted == N`; reason `CountReached`.
- **Out-of-resources stops:** a frame yields `not_enough_xeals` → reason
  `OutOfResources`, regardless of remaining count.
- **First-match-wins ordering:** a frame containing two templates clicks the
  earlier action only.
- **Re-entry after misses:** N blank frames then a frame with `entry_icon` →
  `entry_icon` is clicked after `ReentryAfterMisses`.
- **Cancellation:** cancelling the token mid-run → reason `Cancelled` promptly.

`TemplateMatcher` runs on real (small, generated) `Mat`s in these tests — no live
game needed.

End-to-end verification (manual, after the user supplies templates): run World
Boss "3 times" against the live game and confirm it enters, fights, counts 3, and
stops; then "until out of resources" and confirm it stops on the Xeals dialog.

## Rollout / Definition of Done

1. Types, interfaces, `ActivityRunner`, `WorldBossActivity`, `BotInstance.RunActivityAsync`.
2. Unit tests above pass (`dotnet test`).
3. UI wired; `dotnet build` clean.
4. User supplies the 9 color templates.
5. Manual end-to-end: both stop modes verified against the live game.
