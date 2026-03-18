# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BHB** (Bit Heroes Bot) — A C# WPF automation bot for [Bit Heroes Quest](https://store.steampowered.com/app/666860/Bit_Heroes_Quest/) (Steam).

**Goal:** Recreate the best of the [9-9-9-9 bot](https://github.com/9-9-9-9/Bit-Heroes-bot) with:
- Beautiful WPF + Telerik UI
- Simultaneous multi-account support via **Sandboxie**
- **Non-intrusive input** (no cursor hijacking) using Win32 `PostMessage`
- Background window capture using Win32 `PrintWindow`
- All farming features from 9999 plus NFT switching, advanced familiar selection, and drop notifications
- **Offline Game Knowledge base** + calculator (upgrade planner, mat requirements, zone/familiar reference)

## Tech Stack

| Layer | Choice | Package/Source |
|-------|--------|----------------|
| Language | C# .NET 8 | — |
| UI Framework | WPF | — |
| UI Controls | Telerik UI for WPF | License owned |
| Theme | Material Design + Telerik | Copy from Honsen Theme project |
| Screen Capture | `PrintWindow` Win32 API | P/Invoke (background, per-window, no focus needed) |
| Image Matching | OpenCvSharp4 | NuGet: `OpenCvSharp4`, `OpenCvSharp4.runtime.win` |
| Mouse/Keyboard Input | `PostMessage` Win32 API | P/Invoke — sends clicks directly to HWND, **no cursor movement** |
| Window Detection | `EnumWindows` Win32 API | P/Invoke — finds all game instances including Sandboxie |
| Notifications | Discord webhook + Windows Toast | `System.Net.Http`, `Microsoft.Toolkit.Uwp.Notifications` |
| Logging | Serilog | Copy `LogHelpers` from Honsen |
| Config | `System.Text.Json` | Per-account JSON profiles |
| MVVM | BaseViewModel / BaseWindow | Copy from Honsen Common |
| Async | `Task` + `CancellationToken` | Built-in .NET |

## Key Technical Architecture Decisions

### 1. Non-Intrusive Input (PostMessage)
The #1 differentiator from 9999. Instead of `Robot.mouseMove()` that hijacks the cursor:
```csharp
// Click at (x,y) on a specific window WITHOUT moving the real cursor
PostMessage(hWnd, WM_LBUTTONDOWN, MK_LBUTTON, MAKELPARAM(x, y));
Thread.Sleep(50);
PostMessage(hWnd, WM_LBUTTONUP, 0, MAKELPARAM(x, y));
```
User can use their PC normally while the bot runs in the background.

### 2. Per-Window Screenshot (PrintWindow)
Capture a specific game window without bringing it to focus:
```csharp
// Capture window content into a Bitmap without focusing it
PrintWindow(hWnd, hdc, PW_RENDERFULLCONTENT);
```
This enables multiple simultaneous bot instances — each one captures its own window.

### 3. Sandboxie Multi-Instance Support
- Enumerate all windows with `EnumWindows` matching the Bit Heroes process/title
- Each can come from a different Sandboxie box (separate Steam account)
- UI shows a list of detected game windows; user assigns each to an account profile
- Each account runs its own independent `BotInstance` with its own HWND, capture loop, and state machine

### 4. Multi-Account Architecture
```
BotManager
├── BotInstance [Account 1] → hWnd1 (Steam native)
├── BotInstance [Account 2] → hWnd2 (Sandboxie Box 1)
├── BotInstance [Account 3] → hWnd3 (Sandboxie Box 2)
└── BotInstance [Account N] → hWndN (Sandboxie Box N)
```
Each `BotInstance` is independent: own thread, own state machine, own config, own log stream.

## Features

### Farming Automation (all from 9999)
| Feature | Description |
|---------|-------------|
| Dungeons / Quest | Auto-farm zones with configurable zone, difficulty, re-run count |
| Raids | Configurable level and mode (normal/hard) |
| PVP | Auto-battle with configurable opponent slot (1–4) |
| World Boss | Solo and team modes with tier/difficulty config |
| GVG | Guild vs Guild with opponent placement |
| Invasion | Wave-based farming with auto wave-increase and max wave cap |
| Expedition | Multi-difficulty with portal selection (Inferno Dimension, etc.) |
| Trials | Challenge automation with difficulty |
| Gauntlet | Extends Trials logic |
| Fishing | Auto-fish with hook detection |
| AFK / Run All | Chain multiple activities in configurable priority order |
| Change Character | Switch between character slots (1–3) |

### New Features (beyond 9999 and PBHB)
| Feature | Description |
|---------|-------------|
| **Auto-Launch from Steam** | Launch Bit Heroes for each account via `steam://rungameid/666860`; for Sandboxie: `Start.exe /box:BoxName steam://rungameid/666860` |
| **Steam Account Binding** | Store Sandboxie box name + Steam account per profile; auto-match window on launch |
| **Run-All Priority Queue** | Like PBHB: configurable sequence (PVP→GVG→Invasion→Expedition→TG→WB→Raid→Dungeon), enable/disable/reorder per account |
| **NFT Switching** | Equip/swap NFT gear sets before specific activities |
| **Advanced Familiar Selection** | UI list of familiars to catch; match by image template; auto-decline everything else |
| **Drop Notifications** | Detect mythical item drops → send Discord webhook + Windows toast |
| **Legendary Familiar Alert** | Detect legendary familiar in persuade screen → notify before auto-catching |
| **Multi-Account Dashboard** | Tile/tab view showing status of all running instances simultaneously |
| **True Non-Intrusive Input** | `PostMessage(WM_LBUTTONDOWN/UP)` — cursor never moves, unlike 9999 and PBHB |
| **Sandboxie Support** | Auto-detect all game windows via `EnumWindows`; bind each to a named profile |
| **Per-Account Logs** | Separate scrollable log panel per account instance |
| **Statistics** | Track runs completed, fish caught, familiars caught, items found per session |

### Notification Channels (configurable per account)
- **Discord webhook** — POST with embed (item name, screenshot, account name)
- **Telegram bot** — same format as 9999 (for users migrating from it)
- **Windows toast** — local desktop notification

## Stats & Logging System

Two layers: **Live Session Stats** (in-memory, shown in UI) and **Persistent History** (saved to JSON per account per day).

### Data Model

```csharp
// Per account, resets each session. Also accumulated into AllTimeStats.
class SessionStats
{
    public DateTime SessionStart { get; set; }

    public PvpStats       Pvp        { get; set; } = new();
    public ActivityStats  Dungeon    { get; set; } = new();
    public ActivityStats  Raid       { get; set; } = new();
    public ActivityStats  WorldBoss  { get; set; } = new();
    public ActivityStats  Gvg        { get; set; } = new();
    public ActivityStats  Invasion   { get; set; } = new();
    public ActivityStats  Expedition { get; set; } = new();
    public ActivityStats  Trials     { get; set; } = new();
    public ActivityStats  Gauntlet   { get; set; } = new();
    public FishingStats   Fishing    { get; set; } = new();

    public List<ItemDropEvent>      ItemDrops     { get; set; } = new();
    public List<FamiliarCatchEvent> FamiliarCatches { get; set; } = new();
}

class ActivityStats
{
    public int Runs { get; set; }
    // Item drops are in SessionStats.ItemDrops filtered by Source
}

class PvpStats : ActivityStats
{
    public int Wins   { get; set; }
    public int Losses { get; set; }
    public double WinRate => Runs == 0 ? 0 : (double)Wins / Runs * 100;
}

class FishingStats
{
    public int FishCaught { get; set; }
}

// An item that dropped (seen on loot screen via template matching)
class ItemDropEvent
{
    public DateTime  Timestamp  { get; set; }
    public string    ItemName   { get; set; }   // detected via OCR or template
    public ItemRarity Rarity   { get; set; }   // Mythical, Set, Legendary, Epic, Rare, Common
    public string    Source     { get; set; }   // "Dungeon", "Raid", "WorldBoss", etc.
    public string?   Screenshot { get; set; }   // relative path to saved PNG (optional)
}

// A familiar that was caught during persuade screen
class FamiliarCatchEvent
{
    public DateTime       Timestamp     { get; set; }
    public string         FamiliarName  { get; set; }
    public FamiliarRarity Rarity        { get; set; }  // Legendary, Epic, Rare, Common
    public string         Source        { get; set; }  // "Dungeon", "Raid", etc.
    public CatchMethod    Method        { get; set; }  // Gold, Gem, AutoDeclined
}

enum ItemRarity    { Common, Rare, Epic, Set, Legendary, Mythical }
enum FamiliarRarity { Common, Rare, Epic, Legendary }
enum CatchMethod   { Gold, Gem, AutoDeclined }
```

### UI Display (per account tab)

**Stats Cards row** — always visible at top of account tab:

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   PVP    │ │ Dungeon  │ │   Raid   │ │  Fams    │ │  Items   │
│ 12 runs  │ │ 34 runs  │ │  8 runs  │ │ 23 caught│ │ 5 drops  │
│ 9W / 3L  │ │          │ │          │ │ 2 legend │ │ 1 mythic │
│  75% WR  │ │          │ │          │ │          │ │ 2 sets   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**Activity Feed** — scrolling log below the stats cards, newest on top:

```
[14:32:05] 🎣 Fish caught (total: 47)
[14:31:44] 💎 LEGENDARY familiar caught — Kaleido  ⭐
[14:28:11] ⚔️  PVP — Win (9W/3L)
[14:21:03] 🗡️  Dungeon run #34 complete
[14:19:55] 🌟 MYTHICAL item dropped — Inferno Blade  🔔 (notified)
[14:15:30] ⚔️  PVP — Loss (8W/3L)
[14:10:12] 🏆 Raid run #8 complete
```

Color coding:
- Mythical drops → **gold** bold text + bell icon
- Legendary familiar → **purple** bold + star icon
- Set items → **teal**
- Wins → green, Losses → red
- Normal runs → default text color

**Session summary** (collapsible, shown when bot is stopped):
```
Session: 2h 14m
─────────────────────────────
PVP         12 runs   9W / 3L   75% WR
Dungeon     34 runs
Raid         8 runs
World Boss   5 runs
Fishing     47 fish
─────────────────────────────
Familiars   23 caught  (2 Legendary, 8 Epic, 13 Rare)
Items        5 drops   (1 Mythical, 2 Set, 2 Legendary)
```

### Persistence

- Saved to `%AppData%\BHB\stats\{accountName}\{yyyy-MM-dd}.json` at end of session and every 5 minutes
- All-time totals accumulated in `{accountName}\alltime.json`
- UI has a **History** button to browse past sessions by date

## Project Structure

```
BHB/
├── BHB.sln
│
├── BHB/                                    # Main WPF application
│   ├── App.xaml / App.xaml.cs
│   ├── MainWindow.xaml                     # Dashboard with account tabs
│   ├── Core/
│   │   ├── Win32/
│   │   │   ├── NativeMethods.cs            # PostMessage, PrintWindow, EnumWindows, etc.
│   │   │   └── WindowFinder.cs             # Enumerate + identify game windows
│   │   ├── Capture/
│   │   │   └── WindowCapture.cs            # PrintWindow → Bitmap/Mat
│   │   ├── Input/
│   │   │   └── WindowInput.cs              # PostMessage mouse/keyboard to HWND
│   │   ├── Vision/
│   │   │   ├── TemplateMatcher.cs          # OpenCvSharp4 matchTemplate wrapper
│   │   │   └── TemplateLibrary.cs          # Load/cache PNG templates from disk
│   │   ├── Bot/
│   │   │   ├── BotManager.cs               # Manages all BotInstance objects
│   │   │   ├── BotInstance.cs              # Per-account bot: HWND, state machine, loop
│   │   │   └── StateMachine.cs             # States: Idle→Running→Rerunning→Dead→Disconnected
│   │   ├── Notifications/
│   │   │   ├── DiscordNotifier.cs
│   │   │   ├── TelegramNotifier.cs
│   │   │   └── ToastNotifier.cs
│   │   └── Stats/
│   │       ├── SessionStats.cs             # In-memory stats for current session
│   │       ├── StatsModels.cs              # PvpStats, ActivityStats, ItemDropEvent, etc.
│   │       ├── StatsService.cs             # Records events, auto-saves every 5min
│   │       └── StatsRepository.cs          # Load/save JSON to AppData
│   │
│   ├── Features/                           # One class per game activity
│   │   ├── Base/
│   │   │   └── BaseFeature.cs              # Abstract: Run(), Stop(), CancellationToken
│   │   ├── DungeonFeature.cs
│   │   ├── RaidFeature.cs
│   │   ├── PvpFeature.cs
│   │   ├── WorldBossFeature.cs
│   │   ├── GvgFeature.cs
│   │   ├── InvasionFeature.cs
│   │   ├── ExpeditionFeature.cs
│   │   ├── TrialsFeature.cs
│   │   ├── GauntletFeature.cs
│   │   ├── FishingFeature.cs
│   │   ├── AfkFeature.cs                   # Chains multiple features
│   │   ├── FamiliarFeature.cs              # Persuade/decline logic
│   │   └── NftSwitcherFeature.cs           # Equip NFT sets
│   │
│   ├── Config/
│   │   ├── AppSettings.cs                  # Global app settings (singleton)
│   │   ├── AccountProfile.cs               # Per-account config model
│   │   └── FamiliarList.cs                 # User's catch/decline list
│   │
│   ├── ViewModels/
│   │   ├── MainViewModel.cs
│   │   ├── AccountViewModel.cs             # One per BotInstance, bound to tab
│   │   ├── SettingsViewModel.cs
│   │   └── FamiliarListViewModel.cs
│   │
│   ├── Views/
│   │   ├── AccountTab.xaml                 # Per-account: status, logs, controls
│   │   ├── SettingsView.xaml
│   │   ├── FamiliarListView.xaml
│   │   └── NotificationSettingsView.xaml
│   │
│   └── templates/                          # PNG templates for image matching
│       ├── ui/                             # Buttons, dialogs, common UI
│       ├── dungeon/
│       ├── raid/
│       ├── familiar/                       # Familiar portraits
│       ├── items/                          # Mythical/legendary item icons
│       └── nft/                            # NFT gear thumbnails
│
├── BHB.Common/                             # Copied/adapted from Honsen Common
│   ├── ViewModels/BaseViewModel.cs
│   ├── Controls/BaseWindow.cs
│   ├── Helpers/LogHelpers.cs
│   ├── Extensions/                         # String, File, etc.
│   └── Converters/                         # 40+ WPF converters
│
└── BHB.Theme/                              # Copied from Honsen Theme
    └── Generic.xaml, Telerik.xaml, etc.
```

## Commands

### Build
```bash
dotnet build BHB.sln
```

### Run
```bash
dotnet run --project BHB/BHB.csproj
```

### Test
```bash
dotnet test
```

### Lint / Format
```bash
dotnet format BHB.sln
```

## Key NuGet Packages

```xml
<!-- BHB/BHB.csproj -->
<PackageReference Include="OpenCvSharp4" Version="4.11.0.20250208" />
<PackageReference Include="OpenCvSharp4.runtime.win" Version="4.11.0.20250208" />
<PackageReference Include="Serilog" Version="4.x" />
<PackageReference Include="Serilog.Sinks.File" Version="6.x" />
<PackageReference Include="System.Text.Json" Version="9.x" />
<!-- Telerik via license - already available -->
<!-- Copy from Honsen: MaterialDesignThemes, etc. -->
```

## Win32 APIs Used

| API | Purpose |
|-----|---------|
| `EnumWindows` | Find all game windows (including Sandboxie instances) |
| `GetWindowText` / `GetClassName` | Identify Bit Heroes windows (`UnityWndClass`) |
| `PrintWindow` + `PW_RENDERFULLCONTENT` | Capture window content without focus |
| `PostMessage(WM_LBUTTONDOWN/UP)` | Click at coordinates without moving cursor |
| `PostMessage(WM_KEYDOWN/UP)` | Send key presses to window |
| `GetWindowRect` / `GetClientRect` | Get window dimensions for coordinate mapping |
| `SetForegroundWindow` | Bring window to front only when strictly necessary |

## Reference Bots (Other Bots/)

| Folder | Lang | Key Learnings |
|--------|------|---------------|
| `Bit-Heroes-bot/` | Java | Feature completeness, BW matrix matching, Telegram notifications, profile system, Telegram photo on drop |
| `PBHB/` | Python | Run-All priority queue (PVP→GVG→Invasion→Expedition→TG→WB→Raid→Dungeon), per-user folder profiles, window binding per account, functions tab UI layout |
| `Bit-HeroesBot/` | Kotlin | State machine design, OpenCV parallel detection via coroutines |
| `BitHeroes-Bot/` | Python | Best GUI reference (CustomTkinter), MSS capture, familiar persuade UI |
| `BHBot/` | Java | Deprecated (Flash era) — ignore |

### PBHB Deep Dive — Verified Features

**Run-All sequence** (`functions/run_all/threads/threaded_scripts.py`):
- Default order: PVP → GVG → Invasion → Expedition → Trials/Gauntlet → World Boss → Raid → Dungeon
- Each function runs as a child thread; waits for completion before next
- Configurable via priority UI (up/down reorder, enable/disable toggles)
- Loops infinitely until out of resources or user stops
- Option to close game after full round completes (`RA_close_game_after_regen`)
- Dungeon reruns up to 999 times via `rerun_button.png` detection

**User Management** (`windows/user_management.py`):
- List of users with Start / Edit / Delete per row
- Each user stored in `data/{username}/user_settings.json`
- On Start: user selects which game window to bind to (by window title)
- Stores last-used window as `G_previous_window` in settings
- Main window has two tabs: **Functions** (play buttons per activity) and **Settings**

**Cursor behaviour** — NOT true non-intrusive:
- Still uses `pyautogui.moveTo()` (cursor moves)
- "Free mode" restricts search region to game window bounds
- Returns cursor to window corner (0,0) after each click
- Less intrusive than 9999 but cursor still moves during actions

**What PBHB does NOT have** (BHB should implement better):
- No true non-intrusive input (no PostMessage/SendMessage)
- No auto-launch of Steam game
- No explicit Steam account ID storage (just window title matching)

## Game Knowledge Module

An offline, structured reference of the game's data — used for in-app calculators and the familiar/item selector UI. Data is pre-compiled from the wiki into JSON files shipped with the bot. A refresh tool can re-fetch from the Fandom API (`bit-heroes.fandom.com/api.php`).

### Data Source
- **Fandom MediaWiki API** — `https://bit-heroes.fandom.com/api.php?action=parse&page={PageName}&prop=wikitext&format=json`
- Direct HTML requests return 403; the API endpoint works fine
- Pages to scrape: `Equipment/Ancient`, `Smithy/Upgrade`, `Zones`, `Familiars`, `Materials`, `Raids`, `Equipment/Legendary`, `Equipment/Mythic`

### Verified Game Data (from wiki API, March 2026)

#### Equipment Rarities (ascending stats order)
`Cosmetic < Generic < Common < Rare < Epic < Legendary < Set < Mythic < Ancient`

#### Zones (20 zones, each with 3–4 dungeons)
| Zone | Name | Dungeons |
|------|------|----------|
| 1 | Bit Valley | Grimz Crossing, Dryad's Heart, Lord Cerulean's Tomb, Grim Valley |
| 2 | Wintermarsh | Yeti's Tundra, Blubber's Gutter, Gemm's Cell, Deathmarsh |
| 3 | Lakehaven | Nosdoodoo Wasteland, Jeb's Chamber, Quirrel's Fortress, Corpse Haven |
| 4 | Ashvale | Rexie's Plateau, Warty's Corridor, Kov'alg Pit, Bonevale |
| 5 | Aramore | Torlim's Vault, Zorul's Gauntlet, Tealk's Palace, Necromore |
| 6 | Morgoroth | Rugum's Sewer, Oozmire, Moghur's Catacomb, Demiroth |
| 7 | Cambora | Scorpius's Plateau, Vedaire Thicket, Grimbora *(3 dungeons)* |
| 8 | Galaran | Googamenz's Vault, The Trilogy Chamber, Oblitaran *(3 dungeons)* |
| 9 | Eshlyn | Eshlyn Void, Eshlyn Abyss, Grimlyn *(3 dungeons)* |
| 10 | Uamor | Calverang's Dominion, Broken Abyss, Elemental Colony, Hero's Ruin |
| 11 | Melvin's Genesis | Eldingverold, Terra Nova Mines, The Obelisk of Mistral, Thiduna Conflux |
| 12 | Zord Attacks! | Bay City, Underground Refuge, Fotovoltaic Center, Capital City |
| 13 | Ancient Odyssey | Viranaco, Uhyuta, Kushatan, Tumalenque |
| 14 | Southpeak | Asuteng's Marshland, Thikad Mul's Wind Hills, Melica's Glacier, Iron Fate |
| 15 | Fenrir's Omen | Haefest's Tumuli, Baga Baya's Fungal Lawn, Calaveragh's Coffin, Seior's Circle |
| 16 | Steamfunk City | Gorobot Pipeline, Trombolini's Bandstand, Pomp Drillo's Tunnel, The Secret Leaf Clover Lodge |
| 17 | Olympian Secret Party | Thanates's Sanctuary, Thebes's Peaks, High Cloud Shrine, Uzum's VIP |
| 18 | Sruxon Attack! | R.A.N or Die!, Edibleghs Frenzy Kitchen-Lab, Washed by the Melvin, Auriga's Exploration |
| 19 | Galactic Trials | Tomorian Graveyard, Espanior's Coliseum, Fisherfish Shrine, Martyr's Garden |
| 20 | Big Claw | Cluck Pit, Avian Post, Roosterville, Wing Terminal |

#### Ancient Equipment — Full List
| Item | Slot | Tier |
|------|------|------|
| Harvester | Mainhand (Sword) | T8 |
| Starweave | Necklace / Ring | T9 |
| Polychromatic Blaster | Mainhand / Offhand | T10 |
| Elementarium | Body / Head | T11 |
| Ladener Broom | Mainhand (Staff) | T12 |
| Aryagn Sight | Mainhand (Bow) | T12 |
| Primordial Codex | Offhand | T13 |
| Evolvium | Ring | T14 |
| Flamium Protector | Head | T15 |
| Firium Helmet | Head | T15 |
| Soul of Escarium | Body | T16 |
| Heart of Escarium | Body | T16 |
| 64-bit Clover | Neck | T17 |
| Shield of Escarium | Mainhand | T18 |
| Sword of Escarium | Mainhand | T18 |
| Spear of Escarium | Mainhand | T18 |
| W3-4TY | Offhand | T19 |
| Sacramentum | Ring | T20 |
| Nevermore | Head | T21 |
| Evermore | Head | T21 |
| Supercharged Harvester | Mainhand (Sword) | T21 |

#### Upgrade Costs (Smithy → Upgrade)

**Legendary / Set / Mythic (T7+) per upgrade level:**
| Level | Leg Mats (Leg gear) | Leg Mats (Set gear) | Leg Mats (Mythic gear) | Epic Mats |
|-------|---------------------|--------------------|------------------------|-----------|
| +1    | 50                  | 60                 | 70                     | 6 / 7 / 8 |
| +2    | 100                 | 120                | 140                    | 10 / 14 / 16 |
| +3    | 150                 | 180                | 210                    | 14 / 21 / 24 |
| +4    | 200                 | 240                | 280                    | 18 / 28 / 32 |
| **Total** | **500**         | **600**            | **700**                | |

*Leg mats used are from the item's current tier. E.g. upgrading a T12 legendary uses T12 leg mats.*

**Ancient gear (flat across all tiers):**
| Level | Gold   | Epic Mats | Leg Mats |
|-------|--------|-----------|----------|
| +1    | 100k   | 10        | 250      |
| +2    | 200k   | 20        | 500      |
| +3    | 300k   | 30        | 750      |
| +4    | 400k   | 40        | 1,000    |
| **Total** | **1m** | **100** | **2,500** |

*Leg mats are from the ancient's current tier.*

#### Uptier Costs (Ancient equipment only)

**T9 (special case):**
- 1× Mythic mat from each source: T9 Raid, T9 Trials/Gauntlet, T9 Orlag Clan WB, T9 Netherworld WB

**T10 and above (standard):**
- 1,000× Legendary mats of **destination tier**
- 1× Mythic mat from each of: Raid, Trials/Gauntlet, World Boss — all at **destination tier**
- Total mythic = 3 per uptier step (from 3 different sources)

*Example: Uptierng an ancient from T11 → T12 costs 1,000× T12 leg mats + 3× T12 mythic mats.*

#### Material Types
1. **Gear Materials** — obtained by melting gear; used for upgrades/uptiers
2. **Crafting Materials** — drop from dungeons, melting, events; tierless
3. **Fusion Materials** — drop from dungeons; used for familiar fusions only; ignore Item Find bonus

### Upgrade Planner / Calculator

Given a player's ancient item and their current hero tier, compute the full material shopping list.

```csharp
class UpgradePlan
{
    // Input
    public string  AncientItemName  { get; set; }  // e.g. "Harvester"
    public int     CurrentTier      { get; set; }  // e.g. 8
    public int     CurrentUpgrade   { get; set; }  // 0–4 (current +level)
    public int     TargetTier       { get; set; }  // e.g. 16
    public int     TargetUpgrade    { get; set; }  // 0–4

    // Output
    public List<MaterialRequirement> RequiredMaterials { get; set; }
    public long TotalGold { get; set; }
}

class MaterialRequirement
{
    public string MaterialType  { get; set; }  // "Legendary", "Mythic", "Epic"
    public int    Tier          { get; set; }  // which tier the mat comes from
    public string Source        { get; set; }  // "Raid", "World Boss", "Trials/Gauntlet", "Dungeon"
    public int    Quantity      { get; set; }
    public string Reason        { get; set; }  // "Uptier T12→T13", "Upgrade +2 at T13", etc.
}
```

**Example output for "Harvester T8+0 → T16+4":**
```
UPTIER STEPS (T8→T16 = 8 steps, skip T9 special):
  T8 →T9 :  1× T9 Mythic (Raid) + 1× T9 Mythic (T/G) + 1× T9 Mythic (Orlag WB) + 1× T9 Mythic (Netherworld WB)
  T9 →T10:  1,000× T10 Leg mats + 3× T10 Mythic (Raid, T/G, WB)
  T10→T11:  1,000× T11 Leg mats + 3× T11 Mythic
  T11→T12:  1,000× T12 Leg mats + 3× T12 Mythic
  T12→T13:  1,000× T13 Leg mats + 3× T13 Mythic
  T13→T14:  1,000× T14 Leg mats + 3× T14 Mythic
  T14→T15:  1,000× T15 Leg mats + 3× T15 Mythic
  T15→T16:  1,000× T16 Leg mats + 3× T16 Mythic

UPGRADE TO +4 (at T16):
  +1 to +4: 2,500× T16 Leg mats + 100× Epic mats + 1m gold

TOTAL SUMMARY:
  T9  Legendary:    0        T9  Mythic:  4 (special)
  T10 Legendary: 1,000       T10 Mythic:  3
  T11 Legendary: 1,000       T11 Mythic:  3
  T12 Legendary: 1,000       T12 Mythic:  3
  T13 Legendary: 1,000       T13 Mythic:  3
  T14 Legendary: 1,000       T14 Mythic:  3
  T15 Legendary: 1,000       T15 Mythic:  3
  T16 Legendary: 3,500       T16 Mythic:  3
  Epic mats:       100
  Gold:            1,000,000
```

### Game Knowledge UI ("Wiki" tab)

Separate tab in the main window, always accessible regardless of bot running state:

```
┌─────────────────────────────────────────────────────────┐
│  Bot  |  Accounts  |  Wiki  |  Planner  |  Settings     │
├─────────────────────────────────────────────────────────┤
│  Wiki tab:                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │  Zones   │ │ Familiars│ │ Ancients │ │ Materials │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│                                                          │
│  Planner tab:                                            │
│  Ancient Item:  [Harvester ▼]   Current Tier:  [T8 ▼]  │
│  Current +lvl:  [+0 ▼]          Target Tier:   [T16 ▼] │
│  Target +lvl:   [+4 ▼]                                  │
│                                                          │
│  [Calculate]                    [Copy to Clipboard]      │
│  ┌───────────────────────────────────────────────────┐  │
│  │ T16 Legendary mats  3,500  (Raid/Dungeon drop)    │  │
│  │ T15 Legendary mats  1,000  ...                    │  │
│  │ T16 Mythic mats         3  (1 Raid, 1 T/G, 1 WB) │  │
│  │ ...                                               │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Files (shipped with bot, refreshable)

```
BHB/Data/
├── zones.json          # Zone list, dungeon names, tier mapping
├── familiars.json      # All familiars with rarity, zone, dungeon source
├── ancients.json       # All ancient items with tier and slot
├── upgrade_costs.json  # Upgrade tables by rarity and tier
├── uptier_costs.json   # Uptier tables for ancients
├── raids.json          # Raid list with tiers
└── world_bosses.json   # WB list with tiers
```

Data versioned with a `data_version` field; bot checks wiki API on startup if online and notifies user if a newer version is available (e.g., new zone/ancient added with game update).

## Architecture Notes

- **State Machine per BotInstance:** `Idle → Starting → Running → Rerunning → OutOfResources → Dead → Reconnecting → Stopped`
- **Template matching threshold:** 0.85 default, configurable per template
- **Capture loop interval:** 500ms default (configurable per account)
- **All UI updates via Dispatcher** since bot loops run on background threads
- **CancellationToken** passed through feature chain for clean stop
- **Per-account log files:** `logs/{accountName}/yyyy/MM/dd.log` (Serilog pattern from Honsen)
- **Settings saved as JSON** in `%AppData%\BHB\accounts\{accountName}.json`
