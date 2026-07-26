# Multi-Account UI — Design

**Date:** 2026-07-26
**Scope:** Restructure the ViewModel layer for N concurrent accounts and replace the single-account
main window with a nav rail + master-detail layout.

## Problem

The UI cannot express "account 1 reruns World Boss, account 2 reruns Raid, account 3 does PVP".

This is not a layout problem. `MainViewModel` is singular throughout — one `SelectedWindow`, one
`SelectedActivity`, one `IsCountMode`, one `RunCount`, one `RunStatus`, one `LogOutput`, one
`_runInstance`, one `_activityRunning` — and `StartRunAsync` hardcodes the account name `"WB"`.
`BotManager` already keys instances by account name, but nothing above it does. No arrangement of
pixels fixes this; the ViewModel has to change.

A secondary complaint: the 12 "Bot Features" cards occupy the largest region of the window
(`Grid.Row="3"`, scrolling) and are pure decoration — `Border`s with an icon and description text,
no `Command` bindings, wired to nothing.

## ViewModel Architecture

### AccountViewModel (new)

Owns everything currently singular in `MainViewModel`:

| Member | Purpose |
|---|---|
| `Name` | Display name, entered on creation. Also the `BotManager` instance key. |
| `SelectedWindow` | Bound game window; rebindable at any time. |
| `SelectedActivity` | Which activity this account runs. |
| `IsCountMode`, `RunCount` | Stop condition. |
| `State` | `BotState` from the instance's state machine, rendered as the list row's status dot. |
| `RunsCompleted`, `RunStatus` | Progress count and the human-readable line (`"Runs 7/20 — Regroup"`), fed by the runner's `Progress` event. |
| `Log` | `ObservableCollection<string>` of this account's entries, appended from the runner's `Log` event. Bound directly so the detail pane needs no string rebuilding. |
| `StartCommand`, `StopCommand` | Per-account control. |
| `BotInstance` | This account's runner + state machine. |
| `Matcher` | This account's own `TemplateMatcher` — see below. |

### MainViewModel (rewritten as a shell)

Retains only: the `AccountViewModel` collection, `SelectedAccount`, the shared detected-window
list with its refresh command, add/remove account commands, and nav selection.

### Per-account TemplateMatcher

Each account gets its own `TemplateMatcher`. It is currently a DI singleton, and the
`_lastMatchedScale` cache added on 2026-07-26 assumes a single window size — three game windows at
different sizes would thrash it. Behaviour stays correct either way; this preserves the
optimisation.

`TemplateLibrary` stays shared. It is a read-only cache of decoded `Mat`s, safe for concurrent
readers.

## Layout

```
┌──┬─ACCOUNTS────┬──────── Acc2 — Raid ──────────┐
│▣ │● Acc1        │ Window:   [BitHeroes #2    ▾] │
│  │  WB 7/20     │ Activity: [Raid            ▾] │
│▤ │● Acc2        │ Mode: (●) Count  ( ) Until    │
│  │  Raid 3/10   │ Runs: [ 10 ]                  │
│⚙ │○ Acc3        │ [▶ Start]  [■ Stop]           │
│  │  PVP  idle   │ ─── log ───────────────────── │
│  │              │ [14:02] matched Regroup → …   │
│  │[+ Account]   │ [14:01] matched StartBoss → … │
└──┴──────────────┴───────────────────────────────┘
```

**Nav rail** (narrow, icon-only):

| Item | Contents |
|---|---|
| Accounts | The master-detail view above. Default page. |
| Features | The 12 cards, relocated and labelled Planned. |
| Tools | Capture / Save / Click (cursor) / Click (touch) / Diagnose / Demo, acting on the selected account's window. |

Three rail items only. There is deliberately no Settings page: the sole thing `AppSettings` holds
today is the window-placement preference, which `BaseWindow` manages automatically and which needs
no UI. Adding an empty Settings page would be a placeholder pretending to be a feature. Wiki and
Planner are likewise future rail items, not built here.

Master-detail beats tabs because all account states stay visible while three run at once, and
beats a tile grid because the detail pane has room for real per-account configuration.

Moving the dead cards out of the main flow and the dev tools onto their own page is what reclaims
the space.

## Account Creation

`+ Account` prompts for a display name. The window is then chosen from the detected-window
dropdown in that account's detail pane, and can be rebound at any time. No Sandboxie box binding
and no auto-launch — those depend on work that does not exist yet.

## Concurrent Clicking

`ClickMethod.Focused` (today's default) performs `SetForegroundWindow` → `SetCursorPos` →
`SendInput`, roughly 250 ms of globally-shared state.

**The failure mode is not a missed click — it is a click delivered to the wrong account's game
window.** If account B activates its window while account A is mid-sequence, A's real mouse click
lands on B's UI. Retrying cannot fix this; a retry would simply repeat the misdirected click.

**Resolution:** serialize the click, do not block the run. `ClickCoordinator`, a DI singleton
wrapping a `SemaphoreSlim(1, 1)`. `WindowInputSink` acquires it only when
`ClickMethod == Focused`; `PostMessage` and `Touch` bypass it entirely and cost nothing. All
accounts run concurrently; only their clicks queue. At a 2 s tick with 3 accounts, contention is
negligible.

Retry needs no new code. The runner is reactive: if a click fails to register, the same template
is still on screen next tick and the rule fires again.

## Files

**New**
- `BHB/ViewModels/AccountViewModel.cs`
- `BHB/Views/AccountsPage.xaml`
- `BHB/Views/FeaturesPage.xaml`
- `BHB/Views/ToolsPage.xaml`
- `BHB/Core/Input/ClickCoordinator.cs`

**Rewritten**
- `BHB/ViewModels/MainViewModel.cs` — reduced to a shell
- `BHB/MainWindow.xaml` — nav rail + `ContentControl`

## Out of Scope

- **Account persistence.** Accounts are re-added on each launch. Flagged as a known annoyance
  (~6 fields across 3 accounts, every start); a small follow-up on top of this design.
- Wiring the other 11 activities. Only World Boss exists; the rest would fail on missing
  templates.
- Wiki and Planner pages.
- Solving the input-intrusiveness problem itself. `ClickCoordinator` makes `Focused` safe to run
  concurrently; it does not make it non-intrusive. The cursor still moves and focus still shifts.

## Verification

The build must stay clean. Runtime behaviour cannot be verified from this environment — the app
has to be launched on Windows and checked by hand:

1. Add three accounts, bind each to a different game window.
2. Confirm each account's activity, run mode, and count are independent.
3. Start all three; confirm each list row shows its own live status and each detail pane shows
   only its own log.
4. Confirm clicks land in the correct window under `Focused` mode with all three running.
