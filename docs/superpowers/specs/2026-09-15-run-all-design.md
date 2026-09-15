# Run-All — design

Milestone 3 of the roadmap. What the vision layer was built for.

## Why

Today a task is one rule set on one timer, started by hand. Farming a day's
worth of Bit Heroes means starting PVP, watching it run dry, starting GVG,
and so on — eight times, in an order the user has to remember. The bot can
already see where it is and tell when a resource is gone; it just cannot yet
be told *what to do next*.

Run-All is one task that walks an ordered queue of activities and loops until
everything is spent.

## Shape

- **Activity** — a named slot in the queue: PVP, GVG, Invasion, Expedition,
  Trials/Gauntlet, World Boss, Raid, Dungeon. It owns nothing; it is a label
  that rules and screens point at.
- **A rule gains `activity`.** The rule list does not split. A rule tagged
  `pvp` is PVP's; a rule tagged nothing is the loose Script rule set it always
  was, so every existing rule and export keeps working.
- **Run-All** — a new task id. It runs the current activity's rules, advances
  when that activity is done, and starts the round again at the top.

## Why a tag and not a rule list per activity

Activities owning `rules: Rule[]` would restructure storage, fork the rules
table into eight of them, and make a rule impossible to move without
re-capturing it. A tag keeps one list, one table, one export, and reduces
"move a rule to GVG" to changing a dropdown.

## Advancing

An activity is done when either of two things happens:

1. **A `stopsTask` screen appears** — out of energy, tickets or badges. This
   is the Milestone 2 mechanism, reused: under Run-All it advances the queue
   instead of stopping the task, and the activity is marked spent for the rest
   of the round so the queue does not come back to it.
2. **Nothing matches for `IDLE_ADVANCE_TICKS` ticks in a row** — the activity
   has no rule for whatever is on screen. Without this the queue would wedge
   on a misconfigured activity forever. A match resets the count.

A round ends when the queue wraps. Spent activities are cleared, so the next
round tries everything again — resources regenerate. When every enabled
activity is spent in the same round, Run-All stops and says why, rather than
spinning.

## One interval, deliberately

Each activity could carry its own poll interval, which would mean re-arming
the timer on every advance. It is not worth it: the intervals in play differ
by a second or two and the cost of polling a second early is one framebuffer
read. Run-All polls on `INTERVAL_RUN_ALL` throughout. If an activity ever
genuinely needs a different cadence, it becomes a field then.

## Model

```js
// profile.activities — order is the queue order
{ id: 'pvp', name: 'PVP', enabled: true }
```

Storage goes to schema **v4**: a profile without `activities` gets the default
eight, in the roadmap's order (PVP → GVG → Invasion → Expedition → TG → WB →
Raid → Dungeon), all enabled. Nothing else changes, so a v2 or v3 export still
loads with every rule it had.

`closeAfterRound` joins settings: when set, the browser tab is closed at the
end of a completed round. It is off by default — a bot that closes the game
unasked is a bot that loses a session.

## Engine

`TaskId.RUN_ALL` joins the task table. Run-All state — the queue position, the
round number, the spent set — lives beside the existing task state and is
reset on start, so stopping and starting begins a clean round.

`state.activity` joins `getState()` for the HUD, and an advance emits one log
entry (`kind: 'activity'`), the same way a screen change does.

## UI — a Queue tab

A fifth tab. Each row is an activity: an enable toggle, ▲▼ to reorder, the
count of rules tagged to it, and a live ▶ on the one currently running.
Reordering is ▲▼ rather than drag-and-drop, to match the rules table — one
interaction to learn, not two. The round number and the spent set show at the
top while Run-All runs.

The rules table gains an activity dropdown per rule, beside the screen gate,
and a filter at the top so eight activities' rules do not become one
unreadable list.

`6` starts and stops Run-All, joining the existing task hotkeys.

## Tests

- Queue: advances on a `stopsTask` screen; advances after the idle count;
  a match resets the idle count; skips disabled activities; wraps and clears
  the spent set; stops when every activity is spent in one round.
- Rules: only the current activity's rules are evaluated; an untagged rule
  belongs to Script, not to the queue.
- Storage: v3 → v4 adds the default queue and preserves rules and screens.

## Files

**New** — `src/rules/activity.js`, `src/ui/panel/queue.js`

**Changed** — `src/core/engine.js`, `src/core/constants.js`, `src/core/storage.js`,
`src/rules/model.js`, `src/rules/editor.js`, `src/ui/store.js`,
`src/ui/panel/{index,rules}.js`, `src/ui/hud.js`, `src/main.js`, `src/i18n/{vi,en}.js`

## Out of scope

- The rules that make each activity actually work. Those are captured against
  a running game, not written here; this milestone ships the queue that runs
  them.
- Lag and hang detection, character slots, multi-account. Milestone 4.
- Per-activity stats. Milestone 5.
