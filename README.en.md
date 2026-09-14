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

## Keyboard shortcuts

| Key | Action |
|:---:|---|
| `1` | Show/hide the help panel |
| `2` | Overlay: expanded → compact → hidden |
| `3` | Auto Rerun — polls every 3s, rests 20s after a click |
| `4` | Auto World Boss Solo — polls every 2s |
| `5` | Auto Script — runs your own rules, every 3s |
| `6` | Enter/leave add-rule mode |
| `= / +` | Increase game speed (up to 10×) |
| `-` | Decrease game speed |

Inside add-rule mode (`6`):

| Key | Action |
|:---:|---|
| `0` | Save **position** — put the cursor on the button, then press |
| `9` | Save **colour** — **move the cursor away first**, then press |
| `8` | Delete the rule you just created |

> ⚠️ The order matters: save the position, **move the cursor away**, then save the colour. A cursor resting on a button lights it up, so the rule would store the hover shade and never match at rest.

---

## Features

- **Up to 10× game speed** — patches the game's clocks and frame loop, not a fake fast-forward
- **Non-intrusive input** — events go straight to the canvas; your real cursor stays put
- **Runs in the background** — the game keeps going when you switch tabs
- **Your own rules** — point at a button and the bot learns its position and colour
- **Resolution-independent rules** — see below
- **Auto-stop** — halts after 3 minutes with no successful click, so it never runs away

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
├── rules/           rule model, built-in rules, capture flow
├── ui/              overlay, help, markers, hotkeys
└── i18n/            Vietnamese and English
```

---

## Origin

This project started from [`laviehihi/bh-scripts`](https://github.com/laviehihi/bh-scripts) — thanks to its author for working out the framebuffer read, the verified button coordinates and colours, and the speed-hack technique. That knowledge is still the foundation of this bot.

The code has been rewritten from scratch. See [NOTICE.md](NOTICE.md) for details.

## Disclaimer

This tool is for educational and personal use. Automating a game may breach the host platform's or the publisher's terms of service — use it at your own risk.
