# UI redesign — design

## Why

The overlay is a read-only panel driven by nine number keys. Four things hurt:

1. Nothing is clickable, so every action is a memorised key.
2. A rule, once captured, cannot be renamed, disabled, reordered or deleted
   individually — only the last one can be dropped.
3. `lastMessage` is a single string, overwritten constantly. There is no way to
   see what the bot did, or why it is idle.
4. Capturing a rule is `6 → hover → 0 → move the mouse away → 9`. The cursor
   sitting on a button lights it up, so the colour must be sampled after moving
   away, and the order is easy to get wrong.

## Shape

Three layers, replacing the single overlay:

- **HUD** — small, always on, over the canvas. Status dot, speed, and the one
  line of what the bot is doing now. Fades to ~25% after 4s without
  interaction; full opacity on hover. Click opens the panel.
- **Panel** — opens over the game. Tabs: Tasks / Rules / Log. This is where
  configuration happens; the user is not farming while it is open.
- **Marker layer** — while the Rules tab is open, every rule is drawn as a
  marker on the canvas at its own position. Hovering a table row highlights
  its marker and the reverse. Markers are the reason for this redesign: a rule
  IS a screen position, and `435 63` in a list does not convey that.

## Modules

```
core/engine.js ──emit──► ui/store.js ──► ui/hud.js
                                    ──► ui/panel/{index,tasks,rules,log}.js
                                    ──► ui/markers.js
```

| Module | Owns | Must not know |
|---|---|---|
| `ui/store.js` | UI state: open tab, selected rule, HUD dim, log buffer | DOM |
| `ui/hud.js` | HUD render + dim timer | rules, tabs |
| `ui/panel/index.js` | Panel frame, tab switching | tab contents |
| `ui/panel/*.js` | One tab each | each other |
| `ui/markers.js` | Marker layer, repositioning on resize | the panel |

`ui/dom.js`, `ui/hotkeys.js`, `ui/help.js` stay. `ui/overlay.js` and
`ui/addmode.js` are removed.

## Engine change

The engine gains `emit('action', { at, kind, ruleId, label, point })` where it
currently only sets a message. This is the only change below `ui/`; the log tab
is built from these events, not from parsing `lastMessage`.

Log is a bounded ring buffer (200 entries) in the store. It is not persisted:
it describes this session.

## Rule capture

One keypress, or one click on "Capture" in the Rules tab, does all of it:

1. Record the buffer point under the cursor.
2. Dispatch a synthetic `pointermove` to a far canvas corner. The real cursor
   does not move. `core/input.js` already relies on synthetic pointer events
   clearing hover (`resetHover`), so the game does follow them.
3. Wait two real animation frames for the game to redraw.
4. `readPixels` → the resting colour.
5. Dispatch a synthetic move back to the captured point.

Both colours are kept: the resting colour as `rule.hex`, and the hover colour
as a second point carrying its own `hex`. The built-in Rerun rule already has
this shape. Matching either one is correct, and it makes the rule survive the
case where the bot's own click leaves the button highlighted.

`core/input.js` gains `dispatchMoveTo()` — the move-only prefix of the existing
click sequence. `resetHover` currently dispatches a whole click at the corner,
which is more than it needs.

## Pointer-events

The marker layer is a full-canvas `<div>` with `pointer-events: none`. Only the
markers themselves get `pointer-events: auto`, and only while the Rules tab is
open. Otherwise the layer would swallow clicks meant for the game.

## Testing

- `store.js` — plain JS, no DOM: log capping, tab state, selection.
- `markers.js` — jsdom with a stub canvas: positions follow a resize.
- `capture` — jsdom: one capture produces a rule with both colours, and the
  real cursor position is never written to.
- Existing tests keep passing; the smoke test still builds the bundle.

## Out of scope

Profiles UI, multi-account, drag-to-reorder rules, and anything from milestones
2-5. This is the interaction layer only.
