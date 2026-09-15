# BHB

> 🇻🇳 [Phiên bản tiếng Việt](README.md)

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
3. Open the game and press **`1`** for the keyboard reference

> If pressing `1` does nothing, step 2 is almost certainly incomplete. Open the console (F12) and look for `[BHB] ready` — no line means the script never ran.

After that the script **updates itself** — no reinstalling. Tampermonkey checks periodically; to update immediately, go to Tampermonkey → Dashboard → **Installed userscripts** → **Check for userscript updates**.

---

## Interface

A small **HUD** sits in the top-right corner of the game: a status dot, the speed, and a line saying what the bot is doing. It fades after 4 seconds so it stops covering the game; hovering brings it back.

Click it (or press `1`) to open the **control panel**, which has six tabs:

| Tab | Contents |
|---|---|
| **Run** | A switch per mode (Run All included), the speed slider, canvas size, auto-stop countdown |
| **Steps** | The step table: rename, enable, tag to an activity, gate to a screen, reorder, delete |
| **Screens** | Screen anchors, with a live ✓/✗ and the measured match ratio |
| **Settings** | Profiles (one per character), the activity queue, reload-on-hang, language, export/import |
| **Log** | What the bot has actually done, newest first |
| **?** | The keyboard reference |

A **step** is "when this colour is here (on this screen), click there", and the bot walks the table **in order**: it tries the step it is waiting for, clicks it, and moves to the next one.

Games do not follow a script — a daily reward pops up, a connection drops, a battle ends on a screen nobody planned for. So when the expected step has not matched for three ticks, the bot gives up its place and takes whatever fits the screen in front of it, then carries on from there. The log records every time it does.

With the **Steps** tab open, every step is drawn as a **marker on the canvas** at the position it watches. Hovering a row lights its marker and the other way round, so you can see which button a rule points at.

### Capturing a rule

Hover a button in the game and press **Capture a step at the cursor** (or the `0` key). That is the whole flow.

The bot handles the hover problem for you: it parks the **synthetic** pointer in a corner of the canvas, waits for the game to repaint, reads the resting colour, and puts the synthetic pointer back. Your real cursor never moves. Both shades — lit and resting — are stored, so the rule matches either way.

### Keyboard shortcuts

| Key | Action |
|:---:|---|
| `1` | Open/close the control panel |
| `3` | Auto Rerun — polls every 3s, rests 20s after a click |
| `4` | Auto World Boss Solo — polls every 2s |
| `5` | My Steps — runs the steps not tagged to an activity, every 3s |
| `6` | Run All — every activity in the queue, in order |
| `0` | Capture a rule at the cursor |
| `= / +` | Increase game speed (next stop, up to 20×) |
| `-` | Decrease game speed (down to 0.1×) |

---

## Features

- **Game speed from 0.1× to 20×** — patches the game's clocks and frame loop, not a fake fast-forward
- **Non-intrusive input** — events go straight to the canvas; your real cursor stays put
- **Runs in the background** — the game keeps going when you switch tabs
- **Your own rules** — point at a button and the bot learns its position and colour
- **Region matching** — a rule can read a whole rectangle and score 16 samples in it, so one stray frame does not flip the match
- **Screen awareness** — a rule fires only on the screens you allow, and an out-of-resources screen moves the queue on
- **Run All** — an ordered activity queue that skips what has run dry and starts the round again
- **Resolution-independent rules** — see below
- **Reload on hang** — optional; without it the bot simply stops after 3 idle minutes
- **Keeps running when the window is covered** — see below

### A covered window freezes the game

Chrome and Edge treat a window **covered edge to edge** as hidden and stop painting it. `requestAnimationFrame` is driven by the compositor, so it stops firing and the game's loop dies with it. A partly visible window is fine — which is why switching apps is harmless and only maximising one over the browser freezes it.

No amount of lying about `document.hidden` brings the frames back; that decision is made below JavaScript. So BHB drives the loop itself: it already intercepts `requestAnimationFrame` for the speed hack, so it holds the game's callback, and runs it by hand when 250ms pass with no real frame.

The heartbeat comes from the **audio thread** (a silent `ScriptProcessorNode`), because `setInterval` is clamped to once a second in exactly this situation and the audio thread is not. Browsers only start audio after a user gesture, so press any key in the page once after loading the game.

It can be turned off in Settings.

### Several characters, several accounts

Each **profile** in Settings holds its own rules, screens and queue — one per character, switched from a dropdown. Clicking through the game's own character menu is a captured rule set like anything else.

A second account needs nothing: a second browser profile is a second `localStorage`, so the script keeps a separate configuration there.

### Resolution-independent rules

This is the main difference from the original.

Upstream stored bare pixel coordinates. On macOS the canvas is pinned to a fixed minimum size so that worked, **but on Windows the framebuffer tracks the window and the display scaling** — change zoom, resize, or move to a different-DPI monitor and every rule drifts.

BHB stores **the framebuffer size each rule was captured at**, so rules are rescaled onto whatever the framebuffer currently is. Resizing and zooming keep working.

Rules imported from the original carry no such size, so the overlay marks them with an **orange ⚠**. Press `6` and re-capture them.

---

> 📋 What is planned next: [docs/ROADMAP.md](docs/ROADMAP.md)

## Development

```bash
npm install
npm run build     # produces dist/bhb.user.js
npm run watch     # rebuild on change
npm test          # run the unit tests
```

Edit `src/`, run `npm run build`, reload the game page. To ship an update that other browsers pick up automatically: bump `version` in `package.json`, build, commit, push.

### Layout

```
src/
├── main.js          entry point — the start-up ordering lives here
├── core/
│   ├── canvas.js    canvas lookup, preserveDrawingBuffer patch
│   ├── coords.js    coordinate mapping — where the resolution problem is solved
│   ├── pixel.js     WebGL pixel reads
│   ├── input.js     synthetic click dispatch
│   ├── speed.js     game speed hack
│   ├── engine.js    the automation loop
│   └── storage.js   profiles and settings
├── rules/           rule model, built-in rules, capture and editing
├── ui/              HUD, control panel, canvas markers, hotkeys
└── i18n/            Vietnamese and English
```

---

## Origin

This project started from [`laviehihi/bh-scripts`](https://github.com/laviehihi/bh-scripts) — thanks to its author for working out the framebuffer read, the verified button coordinates and colours, and the speed-hack technique. That knowledge is still the foundation of this bot.

The code has been rewritten from scratch. See [NOTICE.md](NOTICE.md) for details.

## Disclaimer

This tool is for educational and personal use. Automating a game may breach the host platform's or the publisher's terms of service — use it at your own risk.
