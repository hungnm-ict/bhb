# BHB — Bit Heroes Bot

A C# WPF automation bot for [Bit Heroes Quest](https://store.steampowered.com/app/666860/Bit_Heroes_Quest/) (Steam).

> **True non-intrusive automation** — clicks go directly to the game window via Win32 `PostMessage`. Your cursor never moves. Run multiple accounts simultaneously with Sandboxie.

---

## Features

- **Non-intrusive input** — `PostMessage(WM_LBUTTONDOWN/UP)` sends clicks straight to the HWND; no cursor hijacking
- **Background capture** — `PrintWindow` grabs each window without bringing it to focus
- **Multi-account support** — run N accounts simultaneously via Sandboxie; each gets its own bot instance, log stream, and config
- **Full farming suite** — Dungeons, Raids, PVP, World Boss, GVG, Invasion, Expedition, Trials, Gauntlet, Fishing, AFK/Run-All
- **Run-All priority queue** — configurable activity order that loops until resources run out
- **NFT gear switching** — equip sets before specific activities
- **Advanced familiar selection** — catch/decline list matched by image template
- **Drop notifications** — Discord webhook + Windows toast on mythical drops and legendary familiars
- **Game Knowledge module** — offline zone/familiar/ancient reference + upgrade cost calculator
- **Per-account stats** — live session stats and persistent history saved to `%AppData%\BHB`

---

## Requirements

- Windows 10/11
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- Telerik UI for WPF license (already owned)
- [Sandboxie](https://sandboxie-plus.com/) — optional, for multi-account

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Language | C# .NET 8 |
| UI | WPF + Telerik UI for WPF |
| Screen Capture | `PrintWindow` Win32 API |
| Image Matching | OpenCvSharp4 |
| Input | `PostMessage` Win32 API |
| Window Detection | `EnumWindows` Win32 API |
| Notifications | Discord webhook + Windows Toast |
| Logging | Serilog |
| Config | `System.Text.Json` |

---

## Quick Start

```bash
# Build
dotnet build BHB.sln

# Run
dotnet run --project BHB/BHB.csproj
```

---

## Architecture

```
BotManager
├── BotInstance [Account 1] → hWnd1 (Steam native)
├── BotInstance [Account 2] → hWnd2 (Sandboxie Box 1)
└── BotInstance [Account N] → hWndN (Sandboxie Box N)
```

Each `BotInstance` runs its own thread, state machine (`Idle → Running → OutOfResources → Reconnecting`), capture loop, and config profile. All UI updates go through the WPF Dispatcher.

---

## Project Structure

```
BHB/
├── Core/           # Win32, Capture, Input, Vision, Bot, Notifications, Stats
├── Features/       # One class per game activity (DungeonFeature, RaidFeature, …)
├── Config/         # AppSettings, AccountProfile
├── ViewModels/     # MVVM layer
├── Views/          # WPF XAML
└── templates/      # PNG templates for image matching
BHB.Common/         # BaseViewModel, LogHelpers, WPF converters
BHB.Theme/          # Telerik + Material Design theme
```

See [CLAUDE.md](CLAUDE.md) for full architecture, feature specs, game data, and development notes.

---

## License

[MIT](LICENSE)
