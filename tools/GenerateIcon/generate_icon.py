"""Generate BHB/Assets/BHB.ico from the hand-placed pixel grids below.

The logo lives here as editable ASCII, not as a binary nobody dares touch.
See docs/superpowers/specs/2026-07-26-bhb-app-icon-design.md for the design.

Grid legend:
    .  tile background
    #  helm body
    o  visor slit

Usage:
    python3 tools/GenerateIcon/generate_icon.py             # writes the .ico
    python3 tools/GenerateIcon/generate_icon.py --sheet OUT # also writes a contact sheet
"""

import argparse
from pathlib import Path

from PIL import Image

# --- Palette (from BHB/App.xaml: PrimaryColor="Indigo", SecondaryColor="Blue") ----------

TILE = (0x3F, 0x51, 0xB5, 0xFF)  # Material Indigo 500
BODY = (0xEC, 0xEF, 0xF5, 0xFF)  # near-white helm
SHADOW = (0x9A, 0xA3, 0xC4, 0xFF)  # single shading tone
VISOR = (0x21, 0x96, 0xF3, 0xFF)  # Material Blue 500
EMPTY = (0x00, 0x00, 0x00, 0x00)  # outside the rounded tile

# --- Grids ------------------------------------------------------------------------------

GRID_32 = """\
................................
..............####..............
..............####..............
..............####..............
............########............
.........##############.........
.......##################.......
......####################......
.....######################.....
.....######################.....
.....######################.....
.....######################.....
.....##oooooooo##oooooooo##.....
.....##oooooooo##oooooooo##.....
.....##oooooooo##oooooooo##.....
.....######################.....
.....######################.....
.....######..##..##..######.....
.....######..##..##..######.....
.....######..##..##..######.....
.....######################.....
......####################......
.......##################.......
................................
................................
................................
................................
................................
................................
................................
................................
................................
"""

GRID_16 = """\
................
.......##.......
.....######.....
...##########...
..############..
..############..
..#oooo##oooo#..
..#oooo##oooo#..
..############..
..##..#..#..##..
..##..#..#..##..
..############..
...##########...
....########....
................
................
"""


def parse_grid(text, size):
    """ASCII block -> size x size list of rows, each a list of legend chars."""
    rows = text.splitlines()
    # Drop trailing blank line from the triple-quoted string.
    while rows and rows[-1] == "":
        rows.pop()
    if len(rows) != size:
        raise ValueError(f"grid has {len(rows)} rows, expected {size}")
    normalised = []
    for index, line in enumerate(rows):
        if len(line) > size:
            raise ValueError(f"row {index} is {len(line)} chars, expected <= {size}")
        # Short rows are padded with tile background so the ASCII stays forgiving.
        normalised.append(list(line.ljust(size, ".")))
    return normalised


def apply_shading(cells):
    """Any body pixel whose right or lower neighbour is not body becomes shadow.

    Gives a consistent lit-from-upper-left read without hand-placing a second tone.
    """
    size = len(cells)

    def is_body(x, y):
        if not (0 <= x < size and 0 <= y < size):
            return False
        return cells[y][x] == "#"

    shaded = [row[:] for row in cells]
    for y in range(size):
        for x in range(size):
            if cells[y][x] != "#":
                continue
            if not is_body(x + 1, y) or not is_body(x, y + 1):
                shaded[y][x] = "-"
    return shaded


def is_inside_tile(x, y, size):
    """Pixel-grid rounded square: radius = size/6, corners cut on whole pixels."""
    radius = max(1, round(size / 6))
    left, top = radius, radius
    right, bottom = size - 1 - radius, size - 1 - radius
    corner_x = x if x >= left else left
    corner_x = corner_x if corner_x <= right else right
    corner_y = y if y >= top else top
    corner_y = corner_y if corner_y <= bottom else bottom
    if corner_x == x and corner_y == y:
        return True
    dx = x - corner_x
    dy = y - corner_y
    # +0.5 keeps the arc from biting a pixel too deep at small sizes.
    return (dx * dx + dy * dy) <= (radius + 0.5) ** 2


COLOURS = {".": TILE, "#": BODY, "-": SHADOW, "o": VISOR}


def render(cells):
    size = len(cells)
    image = Image.new("RGBA", (size, size), EMPTY)
    pixels = image.load()
    for y in range(size):
        for x in range(size):
            if not is_inside_tile(x, y, size):
                continue
            pixels[x, y] = COLOURS[cells[y][x]]
    return image


def scale(image, factor):
    if factor == 1:
        return image.copy()
    target = image.width * factor
    return image.resize((target, target), Image.NEAREST)


# size -> (which grid, integer scale factor). Every entry is an exact integer
# multiple of a hand-placed grid, so nothing is ever blurred. 24 is deliberately
# absent: it is 16x1.5 / 32x0.75 and would be the only soft entry in the file.
EXPORTS = [
    (16, 16, 1),
    (32, 32, 1),
    (48, 16, 3),
    (64, 32, 2),
    (128, 32, 4),
    (256, 32, 8),
]


def build_images():
    base = {
        16: render(parse_grid(GRID_16, 16)),
        32: render(apply_shading(parse_grid(GRID_32, 32))),
    }
    return {size: scale(base[grid], factor) for size, grid, factor in EXPORTS}


def write_ico(images, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    sizes = sorted(images)
    largest = images[max(sizes)]
    largest.save(path, format="ICO", sizes=[(size, size) for size in sizes])


def write_contact_sheet(images, path):
    """All sizes at 1:1 on the top row, then each magnified to 256 below."""
    magnified = []
    for size in sorted(images):
        factor = max(1, 256 // size)
        magnified.append((size, scale(images[size], factor)))

    padding = 16
    row_one_width = sum(size for size in images) + padding * (len(images) + 1)
    row_two_width = sum(image.width for _, image in magnified) + padding * (len(magnified) + 1)
    width = max(row_one_width, row_two_width)
    row_one_height = max(images) + padding * 2
    row_two_height = max(image.height for _, image in magnified) + padding

    sheet = Image.new("RGBA", (width, row_one_height + row_two_height), (0x1A, 0x1A, 0x24, 0xFF))

    cursor = padding
    for size in sorted(images):
        sheet.paste(images[size], (cursor, padding + (max(images) - size)), images[size])
        cursor += size + padding

    cursor = padding
    for _, image in magnified:
        sheet.paste(image, (cursor, row_one_height), image)
        cursor += image.width + padding

    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path)


def main():
    parser = argparse.ArgumentParser()
    repo_root = Path(__file__).resolve().parents[2]
    parser.add_argument("--out", type=Path, default=repo_root / "BHB" / "Assets" / "BHB.ico")
    parser.add_argument("--sheet", type=Path, default=None)
    args = parser.parse_args()

    images = build_images()
    write_ico(images, args.out)
    print(f"wrote {args.out} ({', '.join(str(size) for size in sorted(images))})")

    if args.sheet is not None:
        write_contact_sheet(images, args.sheet)
        print(f"wrote {args.sheet}")


if __name__ == "__main__":
    main()
