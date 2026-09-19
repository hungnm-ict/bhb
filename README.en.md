# BHB <!--version-->v0.16.1<!--/version-->

> 🇻🇳 [Phiên bản tiếng Việt](README.md) · [Changelog](https://github.com/hungnm-ict/bhb/commits/master)

A userscript that automates a casual Gacha + Pokemon-catching + Fashion game.

The bot reads the game's WebGL framebuffer directly to recognise buttons by colour, then dispatches synthetic mouse events at the canvas. **Your real cursor never moves** — you can keep using your machine while it runs.

---

## Install

### Step 1 — Install Tampermonkey

Install [Tampermonkey](https://www.tampermonkey.net/) for Chrome, Edge, Firefox or Brave.

### Step 2 — Allow user scripts ⚠️ (Chrome/Edge)

**Skip this and the script silently never runs.** From Chrome/Edge 138 onward the userscript API sits behind a per-extension switch.

1. Go to `chrome://extensions` (or `edge://extensions`)
2. Find **Tampermonkey** and click **Details**
3. Scroll down and turn **"Allow User Scripts"** **ON**

> The switch lives on **Tampermonkey's own** details page, not the extensions list.

On Chrome/Edge **older than 138**, where that switch does not exist, turn on **Developer mode** at the top right of `chrome://extensions` instead.

**Firefox does not need this step.**

### Step 3 — Install the script

1. Open **[dist/bhb.user.js](https://raw.githubusercontent.com/hungnm-ict/bhb/master/dist/bhb.user.js)**
2. Tampermonkey shows its install page — click **Install**
3. Open the game and press **`` ` ``** (the backtick, under Esc) to open the control panel

> If pressing `` ` `` does nothing, step 2 is almost certainly incomplete. Open the console (F12) and look for `[BHB] ready` — no line means the script never ran.

After that the script **updates itself** — no reinstalling. Tampermonkey checks periodically; to update immediately, go to Tampermonkey → Dashboard → **Installed userscripts** → **Check for userscript updates**.

---

## Interface

A small **HUD** sits in the top-right corner of the game: a status dot, the speed, and a line saying what the bot is doing. It fades after 4 seconds so it stops covering the game; hovering brings it back.

Click it (or press `` ` ``) to open the **control panel**, which has six tabs:

| Tab | Contents |
|---|---|
| **Run** | The Custom and Run All switches, the speed slider, canvas size, auto-stop countdown |
| **Steps** | The step table: rename, enable, tag to an activity, gate to a screen, reorder, delete |
| **Screens** | Screen anchors, with a live ✓/✗ and the measured match ratio |
| **Settings** | Profiles (one per character), the activity queue, reload-on-hang, Discord/Telegram alerts, language, export/import |
| **Log** | Session stats, then what the bot has actually done, newest first |
| **?** | The keyboard reference |

A **step** is "when this colour is here (on this screen), click there", and the bot walks the table **in order**: it tries the step it is waiting for, clicks it, and moves to the next one.

Games do not follow a script — a daily reward pops up, a connection drops, a battle ends on a screen nobody planned for. So when the expected step has not matched for three ticks, the bot gives up its place and takes whatever fits the screen in front of it, then carries on from there. The log records every time it does.

With the **Steps** tab open, every step is drawn as a **marker on the canvas** at the position it watches. Hovering a row lights its marker and the other way round, so you can see which button a step points at. The step the bot is **waiting for** is marked ▶, so a stuck sequence is visible rather than merely silent.

### Capturing a step

Hover a button in the game and press **Capture a step at the cursor** (or the `0` key). That is the whole flow.

The bot handles the hover problem for you: it parks the **synthetic** pointer in a corner of the canvas, waits for the game to repaint, reads the resting colour, and puts the synthetic pointer back. Your real cursor never moves. Both shades — lit and resting — are stored, so the step matches either way.

### Screens — telling the bot where it is standing

The easiest tab to skip, and the one that decides whether the bot runs sensibly. It has nothing to do with lag detection (that is *reload on hang*, in Settings).

**Why it exists.** A colour only means something in context. The green "Yes" on the raid dialog and the green button on the loot screen can be the same shade — a bot that cannot tell them apart clicks both. Declaring a screen buys three things:

1. **Steps limited to a screen** — each step in the Steps tab can say "only on this screen", so a colour that repeats elsewhere stops being a hazard.
2. **Knowing a resource ran out** — the **⏹** button marks a screen `stopsTask`. Meeting it makes the queue **move to the next activity** instead of clicking at a wall, which is what replaces waiting out the blind three-minute timeout.
3. **Alerts** — the **★** button: see this screen, send a Discord/Telegram message. That is also how rare-drop detection works, with no vision code of its own.

**Capturing one.** Press **Capture a screen anchor** → the panel steps aside → **drag a box** around something **only that screen shows**: a title, a unique icon, the word `HEROIC`. Then name it. Avoid anything with characters, effects or ticking numbers in it.

**Reading the row:**

| What you see | What it means |
|---|---|
| `unknown` in the corner | Right now the bot **does not recognise** where it is |
| The cyan number (`0.19`, `0.83`…) | Share of sample points matching, live. Each anchor samples 16 |
| The number by the slider (`0.75`) | The threshold to clear. `0.19 < 0.75` means no match (✗) |
| `Anchors 1` | One anchor so far. **＋** adds another — every anchor must match, which is stricter |

**Tuning the threshold:** stand on that screen in the game and watch the number. On the screen but only scoring `0.6`? Lower the threshold. **Not** on it and still scoring `0.8`? The box is not distinctive — capture somewhere else.

### Keyboard shortcuts

| Key | Action |
|:---:|---|
| `` ` `` | Open/close the control panel |
| `Esc` | Close the panel (with it closed, the key stays the game's) |
| `C` | Custom — runs the steps not tagged to an activity, every 3s |
| `A` | Run All — every activity in the queue, in order |
| `X` | Capture a step at the cursor (capture mode must be on) |
| `= / +` | Increase game speed (next stop, up to 20×) |
| `-` | Decrease game speed (down to 0.1×) |
| `0` | Back to normal speed (1×) |

---

## Features

- **Game speed from 0.1× to 20×** — patches the game's clocks and frame loop, not a fake fast-forward
- **Non-intrusive input** — events go straight to the canvas; your real cursor stays put
- **Runs in the background** — the game keeps going when you switch tabs
- **Steps you capture yourself** — point at a button and the bot learns its position and colour
- **In order, and self-healing** — the bot follows the step order; when it loses the thread it picks up at whichever step fits the screen in front of it
- **Region matching** — a step can read a whole rectangle and score 16 samples in it, so one stray frame does not flip the match
- **Screen awareness** — a step fires only on the screens you allow, and an out-of-resources screen moves the queue on
- **Run All** — an ordered activity queue that skips what has run dry and starts the round again
- **Resolution-independent steps** — see below
- **Profiles** — one set of steps, screens and queue per character, with export and import
- **Reload on hang** — optional; without it the bot simply stops after 3 idle minutes
- **Keeps running when the window is covered** — see below
- **Canvas size in the corner** — fades out, lights up as the cursor nears it, and never swallows a click
- **Session stats** — at the top of the Log tab, and they survive the watchdog's reloads
- **Discord / Telegram alerts** — with a screenshot of the game; see below

### A covered window freezes the game

Chrome and Edge treat a window **covered edge to edge** as hidden and stop painting it. `requestAnimationFrame` is driven by the compositor, so it stops firing and the game's loop dies with it. A partly visible window is fine — which is why switching apps is harmless and only maximising one over the browser freezes it.

No amount of lying about `document.hidden` brings the frames back; that decision is made below JavaScript. So BHB drives the loop itself: it already intercepts `requestAnimationFrame` for the speed hack, so it holds the game's callback, and runs it by hand when 250ms pass with no real frame.

The heartbeat comes from the **audio thread** (a silent `ScriptProcessorNode`), because `setInterval` is clamped to once a second in exactly this situation and the audio thread is not. Browsers only start audio after a user gesture, so press any key in the page once after loading the game.

It can be turned off in Settings.

### Session stats

The **Log** tab opens on six numbers for the session: running time, clicks, queue rounds, alerts sent, resyncs, and hangs that forced a reload. Under them is a row per activity — how many clicks it took, how many times the queue visited it, and how often it ran dry.

They **do not reset when the watchdog reloads the page**. That is deliberate: farming overnight is worth nothing to read if every hang starts the count again. Only **Reset** clears them, and it moves the session's start time with it.

### Rare drop alerts

There is no separate vision for "rare loot" — it reuses **screens**. Capture the drop popup (or the legendary familiar) as a screen like any other, then press **★** on its row. From then on each appearance is one alert — exactly one, not one per tick, because it fires when the screen *changes*.

Channels live in **Settings → Alerts**:

- **Discord**: paste a channel webhook URL (Server Settings → Integrations → Webhooks).
- **Telegram**: both a **bot token** (from [@BotFather](https://t.me/BotFather)) and a **chat ID**. Message the bot once, then open `https://api.telegram.org/bot<TOKEN>/getUpdates` to read the chat ID.

Configure both and both get the alert. Besides drops you can subscribe to: out of resources, a hang that forced a reload, and a task starting or stopping. Each kind goes out at most **once a minute**, so a flickering screen cannot flood a channel.

**Send a test** is there because a mistyped webhook fails silently out on the network — without it, the first thing you learn is that last night's alert never arrived.

The screenshot is read straight off the game canvas (the bot already forces `preserveDrawingBuffer`), and can be turned off if you only want the text.

### Several characters, several accounts

Each **profile** in Settings holds its own steps, screens and queue — one per character, switched from a dropdown. Clicking through the game's own character menu is a captured step list like anything else.

A second account needs nothing: a second browser profile is a second `localStorage`, so the script keeps a separate configuration there.

### Resolution-independent steps

This is the main difference from the original.

Upstream stored bare pixel coordinates. On macOS the canvas is pinned to a fixed minimum size so that worked, **but on Windows the framebuffer tracks the window and the display scaling** — change zoom, resize, or move to a different-DPI monitor and every coordinate drifts.

BHB stores **the framebuffer size each step was captured at**, so steps are rescaled onto whatever the framebuffer currently is. Resizing and zooming keep working.

Steps imported from the original carry no such size, so they **cannot be rescaled**: the Steps tab counts them and warns, and each one is marked with an **orange ⚠** beside its coordinate. Press `0` over the button to re-capture and the warning goes.

---

> 📋 What is planned next: [docs/ROADMAP.md](docs/ROADMAP.md)

## Development

```bash
npm install
npm run build     # produces dist/bhb.user.js
npm run watch     # rebuild on change
npm test          # run the unit tests
```

Edit `src/`, run `npm run build`, reload the game page. To ship an update that other browsers pick up automatically: bump `version` in `package.json`, build, commit, push — the build stamps that version into the userscript's `@version` and into these READMEs' titles.

Numbering: finishing a milestone in the [roadmap](docs/ROADMAP.md) bumps the minor (`0.5.0` → `0.6.0`), anything smaller bumps the patch. `1.0.0` is when it is polished enough to share widely.

> ⚠️ Tampermonkey never auto-updates **down** to a lower version. Anyone still on an old 2.x build has to remove and reinstall the script once.

### Layout

```
src/
├── main.js          entry point — the start-up ordering lives here
├── core/
│   ├── canvas.js    canvas lookup, preserveDrawingBuffer patch
│   ├── coords.js    coordinate mapping — where the resolution problem is solved
│   ├── pixel.js     single WebGL pixel reads
│   ├── region.js    whole-rectangle reads scored over 16 samples
│   ├── color.js     colour comparison
│   ├── input.js     synthetic click dispatch
│   ├── focus.js     reports the page visible so the game never self-throttles
│   ├── speed.js     speed hack, and hand-driven frames for a covered window
│   ├── keepalive.js an audio-thread heartbeat the browser does not throttle
│   ├── watchdog.js  what to resume after a reload, and when to stop trying
│   ├── timers.js    the native timers, captured before the speed hack
│   ├── engine.js    the automation loop: step cursor, queue, auto-stop
│   └── storage.js   profiles and settings (schema v5)
├── bot/
│   ├── step.js          the step model
│   ├── step-editor.js   capture, edit, reorder
│   ├── screen.js        screen detection
│   ├── screen-editor.js anchor capture
│   ├── activity.js      the Run-All queue
│   └── builtin.js       the built-in re-run and solo WB steps
├── ui/              HUD, control panel, canvas markers, size badge
└── i18n/            Vietnamese and English
```

Tests live in `tests/` and run under vitest. Everything that could lose a user's work — coordinate mapping, storage migrations, the step cursor — is pinned by one.

---

## Origin

The first idea for this project came from [`laviehihi/bh-scripts`](https://github.com/laviehihi/bh-scripts) — thanks to its author for showing that the game can be read straight from its framebuffer and driven with synthetic events.

BHB is written from scratch and ships none of that project's code. [NOTICE.md](NOTICE.md) sets out what was learned from it and what is original here.

## Disclaimer

This tool is for educational and personal use. Automating a game may breach the host platform's or the publisher's terms of service — use it at your own risk.
