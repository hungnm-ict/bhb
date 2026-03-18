# BHB — Bit Heroes Bot

## What This Is

BHB is a C# WPF desktop automation bot for the Steam game Bit Heroes Quest. It automates repetitive farming loops (dungeons, raids, PVP, world boss, and more) by capturing the game window with Win32 `PrintWindow` and injecting input via `PostMessage` — meaning the bot runs fully in the background without moving the user's mouse cursor. It also includes an offline game knowledge base with an upgrade planner for calculating ancient equipment material requirements.

## Core Value

A bot that runs silently in the background — cursor-free, multi-account capable — letting players farm all game modes while using their PC normally, with a clear dashboard showing live stats and a built-in game knowledge planner.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Core Engine**
- [ ] Bot captures game window screenshots using Win32 `PrintWindow` (no focus, no cursor)
- [ ] Bot sends mouse clicks via Win32 `PostMessage(WM_LBUTTONDOWN/UP)` to specific HWND (no cursor movement)
- [ ] Bot detects game state using OpenCvSharp4 template matching against PNG templates
- [ ] State machine handles: Idle → Running → Rerunning → OutOfResources → Dead → Disconnected → Reconnecting
- [ ] Bot auto-detects and reconnects on disconnect/crash

**Farming Features**
- [ ] Dungeon automation (zone + difficulty selection, rerun loop, familiar persuade/decline)
- [ ] Raid automation (level + mode config, rerun loop)
- [ ] PVP automation (opponent slot 1–4 config)
- [ ] World Boss automation (solo + team modes, tier + difficulty)
- [ ] GVG automation (guild vs guild, opponent placement)
- [ ] Invasion automation (wave tracking, auto wave-increase, configurable max wave)
- [ ] Expedition automation (difficulty + portal selection)
- [ ] Trials automation (difficulty config)
- [ ] Gauntlet automation (extends Trials)
- [ ] Fishing automation (hook detection, auto-claim)
- [ ] Familiar system (image-based selection list: catch specific, decline others)

**Stats & Logging**
- [ ] Live session stats: PVP runs/wins/losses/winrate, per-activity run counts, familiars caught (by rarity), item drops (by rarity)
- [ ] Activity feed: scrollable log with color-coded events (mythical=gold, legendary familiar=purple, wins=green, losses=red)
- [ ] Session summary on stop: total time, all counters, familiar breakdown, item breakdown
- [ ] Stats persisted to JSON per account per day, all-time totals accumulated

**Game Knowledge / Planner**
- [ ] Offline data store: zones, dungeons, ancient items, upgrade costs, uptier costs (JSON files shipped with bot)
- [ ] Data sourced from Fandom MediaWiki API (`bit-heroes.fandom.com/api.php`) and pre-compiled
- [ ] Upgrade Planner: user inputs ancient item + current tier/upgrade + target tier/upgrade → outputs full material shopping list per tier
- [ ] Wiki browser tabs: Zones, Familiars, Ancients, Materials reference views
- [ ] Data refresh tool: re-fetch from Fandom API when online, notify if newer data available

**UI**
- [ ] Dashboard overview: all configured accounts visible as cards in a grid
- [ ] Each account card shows: status indicator, current activity, live run count, last event
- [ ] Click account card to open detail view: full stats, activity feed, feature controls
- [ ] Separate "Wiki / Planner" tab always accessible regardless of bot state
- [ ] WPF + Telerik UI for WPF controls, Material Design theme (from Honsen project)

**Account & Config**
- [ ] Per-account profile: name, bound game window (HWND), feature settings, familiar catch list
- [ ] Settings saved to `%AppData%\BHB\accounts\{name}.json`
- [ ] Auto-detect all running Bit Heroes windows (`EnumWindows` for `UnityWndClass`)
- [ ] Manual window binding: user assigns detected window to account profile

### Out of Scope (v1)

- Multi-account simultaneous running (Sandboxie) — v2
- Auto-launch game from Steam / Sandboxie box binding — v2
- Run-All priority queue (full round automation) — v2
- NFT gear set switching — v2
- Notifications (Discord webhook, Telegram, Windows Toast) — v2
- AFK chaining / multi-activity sequences — v2

## Context

- Developer is a senior C# / .NET developer with WPF experience
- Has Telerik UI for WPF license
- Has reusable infrastructure from Honsen project: `BaseViewModel`, `BaseWindow`, `LogHelpers` (Serilog), 40+ WPF converters, extension methods, Material Design + Telerik theme
- Five reference bots studied in `Other Bots/`:
  - `Bit-Heroes-bot/` (Java/9999): most feature-complete, Telegram notifications, BW matrix matching
  - `PBHB/` (Python/sontoong): best multi-account pattern, Run-All priority queue design
  - `Bit-HeroesBot/` (Kotlin): best state machine design, OpenCV parallel detection
  - `BitHeroes-Bot/` (Python/elwoujdi): best GUI reference, familiar persuade UI
  - `BHBot/` (Java/ilpersi): deprecated (Flash era), ignore
- Game wiki data fetched via Fandom API (direct page requests return 403, API works)
- Verified upgrade data: Ancient upgrade +1→+4 = 2,500 leg mats + 100 epic + 1m gold (flat all tiers); uptier T10+ = 1,000 leg mats + 3 mythic mats per step

## Constraints

- **Tech Stack**: C# .NET 8, WPF, Telerik UI for WPF — developer's primary stack, license available
- **Windows only**: Win32 API (`PostMessage`, `PrintWindow`, `EnumWindows`) — bot is Windows-specific
- **Image detection**: OpenCvSharp4 — same API as Python's cv2, used by all reference bots
- **Game window**: Must run in windowed mode (not fullscreen) for `PrintWindow` to work
- **No cursor movement**: All input via `PostMessage` — this is a hard constraint, not optional

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| C# + WPF over Python | Developer's primary language; reuse Honsen infrastructure; Telerik license | — Pending |
| PostMessage over Robot/PyAutoGUI | Cursor-free operation — the #1 differentiator from all reference bots | — Pending |
| PrintWindow over BitBlt/CopyFromScreen | Per-window capture without focus — enables background + future multi-account | — Pending |
| OpenCvSharp4 for image matching | Same OpenCV API used by best reference bots; well-maintained .NET binding | — Pending |
| Single account in v1 | Reduces complexity; multi-account (Sandboxie) is v2 once core is proven | — Pending |
| Dashboard overview UI | All accounts visible at once vs tabbed — user preference | — Pending |
| Fandom MediaWiki API for wiki data | Direct HTML requests return 403; API endpoint works fine | ✓ Good |

---
*Last updated: 2026-03-18 after initialization*
