# Roadmap: BHB — Bit Heroes Bot

## Overview

BHB is built in six phases. Phase 1 establishes the C# solution scaffold, Win32 layer, and image detection engine — the invisible foundation everything runs on. Phase 2 delivers the WPF UI shell: account management, dashboard cards, and the wiki tab placeholder. Phase 3 implements dungeon automation end-to-end including the familiar system, proving the entire capture-detect-click-state-machine loop works. Phase 4 completes the remaining nine farming modes, each following the same engine pattern Phase 3 proved. Phase 5 adds live stats tracking, the activity feed, and persistent session storage. Phase 6 ships the offline game knowledge data files and the upgrade planner UI.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Scaffold & Engine** - Solution structure, NuGet packages, Win32 layer, OpenCV integration, state machine skeleton, app boots
- [ ] **Phase 2: Account Management & UI Shell** - Dashboard window, account profile CRUD, window binding, Wiki tab placeholder, Honsen theme applied
- [ ] **Phase 3: Dungeon Automation** - Full dungeon farming loop with zone/difficulty config, rerun loop, familiar catch/decline system — proves the engine end-to-end
- [ ] **Phase 4: Remaining Farming Modes** - Raid, PVP, World Boss, GVG, Invasion, Expedition, Trials, Gauntlet, Fishing
- [ ] **Phase 5: Stats & Logging** - Live session stats, color-coded activity feed, session summaries, JSON persistence
- [ ] **Phase 6: Game Knowledge & Planner** - Offline JSON data files, Zones/Ancients reference views, Upgrade Planner UI, data refresh tool

## Phase Details

### Phase 1: Scaffold & Engine
**Goal**: A running WPF application that can capture a game window, match image templates, send click input, and drive a state machine — all with no cursor movement
**Depends on**: Nothing (first phase)
**Requirements**: ENG-01, ENG-02, ENG-03, ENG-04, ENG-05, ENG-06, ENG-07
**Success Criteria** (what must be TRUE):
  1. Solution builds with zero errors and the app window opens
  2. User can point the app at a running Bit Heroes window and see a live screenshot captured via PrintWindow (no cursor movement, no focus steal)
  3. A test template match against a known UI element returns a confident hit coordinates
  4. A simulated PostMessage click reaches the target window without the real cursor moving
  5. The state machine cycles through Idle → Running → Stopped when start/stop is triggered from UI
**Plans**: TBD

### Phase 2: Account Management & UI Shell
**Goal**: Users can create account profiles, bind them to game windows, and see the dashboard — the full UI skeleton is in place before any farming logic ships
**Depends on**: Phase 1
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07
**Success Criteria** (what must be TRUE):
  1. User can create, rename, and delete an account profile and the change persists after app restart
  2. User can select a detected Bit Heroes window from a dropdown and bind it to an account profile
  3. Dashboard shows at least one account card with name, status, and placeholder activity fields
  4. Clicking an account card opens the detail panel with feature toggle placeholders and stats area
  5. Wiki / Planner tab is visible and accessible from the main window at all times
**Plans**: TBD

### Phase 3: Dungeon Automation
**Goal**: Users can configure and run the dungeon farming loop — zone, difficulty, familiar catch list — and the bot runs it until stopped, proving every layer of the engine works together
**Depends on**: Phase 2
**Requirements**: DUN-01, DUN-02, DUN-03, DUN-04, DUN-05
**Success Criteria** (what must be TRUE):
  1. User can set zone number and difficulty in the account detail panel and save the config
  2. Bot enters the configured dungeon, completes a run, and automatically reruns using the rerun button
  3. When the familiar persuade screen appears, bot catches familiars on the catch list and declines all others
  4. User can add and remove familiars from the catch list in the UI and changes take effect on the next persuade screen
  5. Bot detects out-of-energy and transitions to OutOfResources state, stopping cleanly
**Plans**: TBD

### Phase 4: Remaining Farming Modes
**Goal**: All nine remaining game modes can be configured and automated; the bot can farm any single activity the user enables
**Depends on**: Phase 3
**Requirements**: RAI-01, RAI-02, PVP-01, PVP-02, WB-01, WB-02, GVG-01, GVG-02, INV-01, INV-02, EXP-01, EXP-02, TG-01, TG-02, FSH-01, FSH-02
**Success Criteria** (what must be TRUE):
  1. User can configure and start Raid farming; bot reruns until out of tokens
  2. User can configure PVP opponent slot; bot plays matches and records win/loss result
  3. User can configure and start World Boss (solo or team), GVG, Invasion (with wave-increase), Expedition, Trials, and Gauntlet farming
  4. Bot detects the fishing hook event and auto-catches and claims fishing rewards
  5. Each mode stops cleanly when out of tokens/resources or when the user hits stop
**Plans**: TBD

### Phase 5: Stats & Logging
**Goal**: Users see live session stats and a color-coded activity feed while the bot runs, and can review a session summary after stopping, with all data saved to disk
**Depends on**: Phase 4
**Requirements**: STAT-01, STAT-02, STAT-03, STAT-04
**Success Criteria** (what must be TRUE):
  1. Activity feed displays timestamped events in real time with correct colors (mythical=gold, legendary familiar=purple, PVP win=green, PVP loss=red)
  2. Account card and detail panel show live run counts and PVP win rate that update as the bot runs
  3. Stopping the bot shows a session summary with total time, all run counts, familiar rarity breakdown, and item rarity breakdown
  4. After a session, a dated JSON file exists under `%AppData%\BHB\stats\{account}\` and all-time totals are updated
**Plans**: TBD

### Phase 6: Game Knowledge & Planner
**Goal**: Users can look up zones and ancient items offline and use the Upgrade Planner to calculate the exact materials needed to reach any upgrade target
**Depends on**: Phase 5
**Requirements**: WIKI-01, WIKI-02, WIKI-03, WIKI-04, WIKI-05, WIKI-06
**Success Criteria** (what must be TRUE):
  1. Zones tab lists all 20 zones with their dungeon names from offline JSON data (no network required)
  2. Ancients tab lists all 21 ancient items with tier and slot from offline JSON data
  3. User selects an ancient item, sets current and target tier/upgrade, and the planner outputs a grouped material shopping list
  4. User can copy the planner output to clipboard as plain text with one click
  5. Data refresh tool fetches updated data from the Fandom API and notifies the user if newer data is available
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold & Engine | 0/TBD | Not started | - |
| 2. Account Management & UI Shell | 0/TBD | Not started | - |
| 3. Dungeon Automation | 0/TBD | Not started | - |
| 4. Remaining Farming Modes | 0/TBD | Not started | - |
| 5. Stats & Logging | 0/TBD | Not started | - |
| 6. Game Knowledge & Planner | 0/TBD | Not started | - |
