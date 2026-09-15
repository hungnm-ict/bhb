# Stability and profiles — design

Milestone 4 of the roadmap.

## Why

Two things end a farming session early, and neither is the bot's logic being
wrong:

1. **The game hangs.** Unity stops advancing, or the session is logged out
   while the tab sits in the background. Today the bot notices only as silence
   and stops itself after three idle minutes, hours before the user comes back.
2. **There is only ever one configuration.** Storage has held a list of
   profiles since Milestone 1, but nothing can create, rename or switch one.
   A second character, or a second account, has nowhere to live.

## Watchdog

The engine already measures idleness — `lastActionAt`, the clock the three
minute auto-stop runs on. The watchdog does not add a second timer; it changes
what happens when that one fires:

- **off** (default) — stop the task, as today.
- **on** — reload the page, and start the same task again once the game is
  back.

Reloading is the only recovery that works for every cause. The bot cannot tell
a hung WebGL context from an expired session, and both are fixed the same way.

### Resuming

A reload is a fresh page, so intent has to survive it. `localStorage` carries a
small resume record:

```js
{ task: 'runAll', at: 1757900000000, reloads: 2 }
```

On boot, the record is used only when it is **fresh** (younger than
`RESUME_MAX_AGE`). A stale record is a session the user walked away from days
ago, and resuming that would start the bot behind their back.

Resuming waits `RESUME_DELAY` after the canvas appears. The game has to load,
and a login screen may need clicking through; starting into that would just
burn the watchdog's own patience.

### Not reloading forever

If reloading does not help, reloading again will not either. `reloads` counts
consecutive reloads with no click in between; the first successful click
clears it. At `MAX_RELOADS` the bot stops and says so, rather than leaving the
user with a tab that has refreshed four hundred times overnight.

## Profiles

A profile already holds everything that makes a configuration: rules, screens
and the activity queue. What is missing is the UI, so Milestone 4 adds it:
create, rename, duplicate, delete, switch, export, import.

**Character slots are profiles.** A slot named MAIN, NFT or CLONE is a profile
with that name; there is no separate concept, and there does not need to be.
What is genuinely out of reach here is the in-game switching itself — clicking
through the character menu is a rule set that has to be captured against a
running game, so the bot can hold three configurations but the user still picks
the character.

**Multi-account needs nothing.** A second browser profile is a second
`localStorage`, so it already keeps its own rules and its own queue. It belongs
in the README, not in the code.

Deleting the last profile is refused rather than handled: a state with no
profiles has no meaning, and every read would have to defend against it.

## UI — a Settings tab

A sixth tab, which is also the first home for the settings that have only ever
been readable from storage:

- Profiles: a picker, plus new / rename / duplicate / delete.
- Export and import, through a textarea. A file picker would need `@grant`,
  and the clipboard is not reliable inside a userscript sandbox.
- Watchdog on/off, and the reload count when it is not zero.
- Language and coordinate scale mode.

Switching profile or language re-renders everything, so both go through the
same refresh the rest of the UI uses.

## Tests

- Watchdog: a fresh record resumes, a stale one does not; the reload count
  rises per reload and clears on a click; it gives up at the limit.
- Engine: an idle timeout reloads when the watchdog is on and stops when it is
  off.
- Storage: create, rename, duplicate and delete; deleting the last profile is
  refused; switching changes what `getActiveProfile` returns.

## Files

**New** — `src/core/watchdog.js`, `src/ui/panel/settings.js`

**Changed** — `src/core/engine.js`, `src/core/storage.js`, `src/core/constants.js`,
`src/ui/store.js`, `src/ui/panel/index.js`, `src/main.js`, `src/i18n/{vi,en}.js`,
`src/ui/styles.js`, `README.md`

## Out of scope

- Clicking through the in-game character menu. That is a captured rule set.
- Driving several browser profiles from one place. Each one runs its own copy
  of the script; coordinating them would mean a server.
- Session stats and Discord/Telegram alerts. Milestone 5.
