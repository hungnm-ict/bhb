# Requirements: BHB — Bit Heroes Bot

**Defined:** 2026-03-18
**Core Value:** A cursor-free automation bot that farms all Bit Heroes game modes silently in the background, with live stats and a built-in upgrade planner.

## v1 Requirements

### Core Engine

- [ ] **ENG-01**: Bot captures game window content using Win32 `PrintWindow` without requiring window focus or moving the cursor
- [ ] **ENG-02**: Bot sends mouse clicks to a specific game window HWND using `PostMessage(WM_LBUTTONDOWN/UP)` without moving the real cursor
- [ ] **ENG-03**: Bot detects game UI state using OpenCvSharp4 template matching against stored PNG templates with configurable confidence threshold
- [ ] **ENG-04**: Bot implements a state machine with states: Idle, Starting, Running, Rerunning, OutOfResources, Dead, Disconnected, Reconnecting, Stopped
- [ ] **ENG-05**: Bot auto-detects disconnect or game crash and attempts reconnection automatically
- [ ] **ENG-06**: Bot enumerates all running Bit Heroes windows (`EnumWindows` matching `UnityWndClass`) so user can bind one to a profile
- [ ] **ENG-07**: User can start, pause, and stop the bot cleanly via UI controls with graceful cancellation

### Farming — Dungeon

- [ ] **DUN-01**: User can configure zone number and difficulty (Normal / Hard / Heroic) for dungeon farming
- [ ] **DUN-02**: Bot automatically reruns the same dungeon using the rerun button (up to configurable loop count or until out of energy)
- [ ] **DUN-03**: Bot detects the familiar persuade screen and auto-catches familiars on a user-configured catch list (by name/template)
- [ ] **DUN-04**: Bot auto-declines familiars not on the catch list
- [ ] **DUN-05**: User can manage the familiar catch list in the UI (add, remove, enable/disable per familiar)

### Farming — Raid

- [ ] **RAI-01**: User can configure raid level and mode (Normal / Hard) for raid farming
- [ ] **RAI-02**: Bot reruns raid automatically until out of tokens or configurable loop count

### Farming — PVP

- [ ] **PVP-01**: User can configure opponent slot (1–4) for PVP farming
- [ ] **PVP-02**: Bot plays PVP matches automatically and detects win/loss result for stats

### Farming — World Boss

- [ ] **WB-01**: User can configure World Boss tier and difficulty, and select solo or team mode
- [ ] **WB-02**: Bot farms World Boss automatically until out of tokens or configurable loop count

### Farming — GVG

- [ ] **GVG-01**: User can configure opponent placement for Guild vs Guild farming
- [ ] **GVG-02**: Bot farms GVG automatically until out of tokens or configurable loop count

### Farming — Invasion

- [ ] **INV-01**: Bot farms Invasion with configurable max wave limit
- [ ] **INV-02**: Bot auto-increases wave difficulty as waves are cleared

### Farming — Expedition

- [ ] **EXP-01**: User can configure expedition difficulty and portal selection
- [ ] **EXP-02**: Bot farms Expedition automatically until out of tokens or configurable loop count

### Farming — Trials & Gauntlet

- [ ] **TG-01**: User can configure difficulty for Trials and Gauntlet
- [ ] **TG-02**: Bot farms Trials and Gauntlet automatically until out of tokens or configurable loop count

### Farming — Fishing

- [ ] **FSH-01**: Bot detects fishing hook event and auto-reacts to catch fish
- [ ] **FSH-02**: Bot auto-claims fishing rewards

### Stats & Logging

- [ ] **STAT-01**: Bot tracks per-session stats: PVP runs, wins, losses, win rate; run counts for all other activities; familiars caught by rarity; item drops by rarity
- [ ] **STAT-02**: Activity feed displays timestamped, color-coded events in real time (mythical drop=gold, legendary familiar=purple, PVP win=green, PVP loss=red)
- [ ] **STAT-03**: Session summary is shown when bot stops: total time, all counters, familiar rarity breakdown, item rarity breakdown
- [ ] **STAT-04**: Session stats are saved to `%AppData%\BHB\stats\{account}\{yyyy-MM-dd}.json` and accumulated into all-time totals

### Game Knowledge & Planner

- [ ] **WIKI-01**: Offline JSON data files ship with the bot: zones (Z1–Z20, dungeon names), ancient items (name, tier, slot), upgrade costs, uptier costs, familiar list stubs
- [ ] **WIKI-02**: Zones reference view lists all 20 zones with their dungeon names
- [ ] **WIKI-03**: Ancients reference view lists all 21 ancient items with tier and slot
- [ ] **WIKI-04**: Upgrade Planner accepts: ancient item, current tier, current upgrade level (+0–+4), target tier, target upgrade level — and outputs a grouped material shopping list (quantity of each tier's leg mats, mythic mats, epic mats, gold)
- [ ] **WIKI-05**: Planner output is copyable to clipboard as plain text
- [ ] **WIKI-06**: Data refresh tool fetches latest data from Fandom MediaWiki API and updates local JSON files; user is notified if new data is available

### UI & Account Management

- [ ] **UI-01**: Main window shows a dashboard of account cards — each card displays account name, status (Idle/Running/Stopped), current activity, live run count, and last log event
- [ ] **UI-02**: Clicking an account card opens a detail panel: full stats cards, activity feed, feature enable/disable toggles, per-feature config
- [ ] **UI-03**: "Wiki / Planner" tab is always accessible from the main window regardless of bot running state
- [ ] **UI-04**: User can create, rename, and delete account profiles
- [ ] **UI-05**: Per-account profile stores: display name, bound window HWND title, all feature settings, familiar catch list
- [ ] **UI-06**: App uses WPF + Telerik UI for WPF with Material Design theme consistent with Honsen project styling
- [ ] **UI-07**: User can bind a detected game window to an account profile from a dropdown of available `UnityWndClass` windows

## v2 Requirements

### Multi-Account & Sandboxie

- **SAND-01**: Bot manages multiple simultaneous account instances, each bound to a separate game window (Sandboxie or multiple Steam accounts)
- **SAND-02**: User can store Sandboxie box name per account profile and auto-launch Bit Heroes in that box
- **SAND-03**: Auto-launch game from Steam URL scheme (`steam://rungameid/666860`) per account

### Run-All Automation

- **RA-01**: User can configure a priority-ordered Run-All sequence (enable/disable/reorder each activity)
- **RA-02**: Bot executes the full sequence in order, waiting for each activity to complete before starting next
- **RA-03**: Option to close game window after full round completes

### Notifications

- **NOTF-01**: Discord webhook notification when mythical item drops (with screenshot and account name)
- **NOTF-02**: Discord webhook notification when legendary familiar is caught
- **NOTF-03**: Windows toast notification for same events (local)
- **NOTF-04**: Telegram bot notification (for users migrating from 9999 bot)

### NFT & Gear

- **NFT-01**: User can define named gear sets; bot equips a specified set before a given activity

## Out of Scope

| Feature | Reason |
|---------|--------|
| Sandboxie multi-instance (v1) | Core engine must be solid first; adds significant window management complexity |
| Auto-launch Steam / Sandboxie (v1) | Depends on multi-instance architecture, deferred to v2 |
| Run-All queue (v1) | Good-to-have but individual features ship first |
| NFT gear switching (v1) | Complex inventory navigation; deferred to v2 |
| Notifications (v1) | Nice-to-have; core farming value doesn't depend on it |
| Cross-platform (Linux/macOS) | Win32 API (`PostMessage`, `PrintWindow`) is Windows-only by design |
| Web/browser version of game | Bot targets Steam client (`UnityWndClass`) only |
| BHBot-style Selenium/Chromium | Deprecated approach (Flash era); PostMessage on native window is superior |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENG-01, ENG-02, ENG-03, ENG-04, ENG-05, ENG-06, ENG-07 | Phase 1 | Pending |
| UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07 | Phase 2 | Pending |
| DUN-01, DUN-02, DUN-03, DUN-04, DUN-05 | Phase 3 | Pending |
| RAI-01, RAI-02, PVP-01, PVP-02, WB-01, WB-02 | Phase 4 | Pending |
| GVG-01, GVG-02, INV-01, INV-02, EXP-01, EXP-02 | Phase 4 | Pending |
| TG-01, TG-02, FSH-01, FSH-02 | Phase 4 | Pending |
| STAT-01, STAT-02, STAT-03, STAT-04 | Phase 5 | Pending |
| WIKI-01, WIKI-02, WIKI-03, WIKI-04, WIKI-05, WIKI-06 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 — roadmap created, traceability confirmed*
