# BHB App Icon — Design

**Date:** 2026-07-26
**Scope:** Windows application icon (`.ico`) for the BHB WPF app. Nothing else.

## Goal

Give BHB a distinctive taskbar/exe icon that reads clearly at 16×16, matches the app's
Material Design theme, and stays editable as text rather than an untouchable binary.

## Mark

A pixel-art hero helm: full-face helm with a narrow crest fin, a letterbox visor split by
a nasal bar, and a three-slot breathing grille, drawn on a strict pixel grid so every edge
lands on a whole pixel at every export size. Chosen over a `BHB` lettermark because three
letters at 16×16 gives each glyph ~4px and turns to mush.

Two earlier iterations were discarded during visual review and are recorded here so the
same mistakes are not re-made:

1. **Rounded dome + separated square eyes + tooth grille read as a skull**, not a helm.
   Fixed by widening the eyes into a letterbox visor and squaring the chin.
2. **A wide triangular top read as a house roof.** Fixed by narrowing it to a constant-width
   crest fin. The fin also gives the mark a faint robot-head read, which is on-message for
   a bot.

## Tile

Solid rounded square, corner radius 1/6 of the tile edge. Corners are cut on the pixel
grid (no anti-aliased curve) so the retro read survives.

## Colours

Pulled from the app theme (`BHB/App.xaml`: MaterialDesign BundledTheme, `PrimaryColor="Indigo"`,
`SecondaryColor="Blue"`).

| Element | Colour | Source |
|---|---|---|
| Tile | `#3F51B5` | Material Indigo 500 — app PrimaryColor |
| Helm body | `#ECEFF5` | near-white, max contrast on indigo |
| Helm shadow | `#9AA3C4` | single shading tone for volume |
| Visor slits | `#2196F3` | Material Blue 500 — app SecondaryColor |

Three tones plus the tile. More tones kill pixel art.

## Two grids, not one scaled sprite

A 16px sprite blown up to 256 looks lazy; a 32px sprite crushed to 16 turns to mush. Two
sprites are hand-placed:

- **16×16** — a deliberate mini of the 32 design (same crest, letterbox visor, three-slot
  grille) at coarser resolution, unshaded. Keeping the two grids visually matched matters:
  when they diverged, the 48px export looked like a different logo from the 64px one.
- **32×32** — full detail: crest fin, nasal bar, grille, derived edge shading.

## Export sizes

Every exported size is an **integer** nearest-neighbour scale of one of the two grids, so
no size is ever blurred or half-pixel:

| Size | Source grid | Factor |
|---|---|---|
| 16 | 16 | ×1 |
| 32 | 32 | ×1 |
| 48 | 16 | ×3 |
| 64 | 32 | ×2 |
| 128 | 32 | ×4 |
| 256 | 32 | ×8 |

**24×24 is deliberately omitted.** It is not an integer multiple of either grid (16×1.5,
32×0.75) and would be the only blurred entry in the file. Windows falls back to the 32px
entry at that size.

## Shading rule

Edge shading on the 32 grid is derived, not hand-placed: any helm-body pixel whose right
or lower neighbour is not helm body becomes the shadow tone. This yields a consistent
lit-from-upper-left read and keeps the ASCII grid readable. The 16 grid is unshaded.

## Implementation

- Generator: `tools/GenerateIcon/generate_icon.py` (Python + Pillow). Both grids live in
  the script as ASCII string blocks, so the logo is editable text.
- Grid legend: `.` = tile, `#` = helm body, `o` = visor.
- Output: `BHB/Assets/BHB.ico`.
- Wiring: `<ApplicationIcon>Assets\BHB.ico</ApplicationIcon>` in `BHB/BHB.csproj`.
- The generator also emits a contact sheet PNG (all sizes at 1:1 and magnified) for
  visual review. The contact sheet is a review artifact, not a build output.

## Verification

Render the contact sheet and inspect every size before committing the `.ico`. Any size
that reads badly is fixed in the ASCII grid and re-rendered — never patched in the binary.

## Out of scope

XAML vector logo, PNG asset set, README wordmark lockup. The generator makes each of
these a small addition later.
