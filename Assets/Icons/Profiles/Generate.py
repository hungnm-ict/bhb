"""Rebuild the per-profile pixel icons (Shin / Moose / Ches).

    python3 Assets/Icons/Profiles/Generate.py [out_dir]

Writes one 64-grid SVG per profile, plus PNGs at 512/256/128/64 when an
out_dir is given. Needs Pillow and Arial Black.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

N = 64
FONT = "/mnt/c/Windows/Fonts/ariblk.ttf"
NAVY = (26, 45, 82, 255)
WHITE = (255, 255, 255, 255)
SHADE = (198, 222, 248, 255)
PROFILES = {
    "Shin":  ("S", (216, 58, 52)),
    "Moose": ("M", (47, 111, 208)),
    "Ches":  ("C", (52, 146, 75)),
}


def dim(rgb, factor):
    return tuple(min(255, int(channel * factor)) for channel in rgb) + (255,)


def letter_mask(char, cap_height):
    """A crisp pixel letter: set it large, threshold hard, then fit to cap height."""
    canvas = Image.new("L", (512, 512), 0)
    font = ImageFont.truetype(FONT, 380)
    ImageDraw.Draw(canvas).text((256, 256), char, font=font, fill=255, anchor="mm")
    canvas = canvas.crop(canvas.getbbox())
    width = max(1, round(canvas.width * cap_height / canvas.height))
    return canvas.resize((width, cap_height), Image.LANCZOS).point(lambda v: 255 if v > 118 else 0)


def grow(mask, radius):
    out = Image.new("L", (mask.width + 2 * radius, mask.height + 2 * radius), 0)
    for dx in range(-radius, radius + 1):
        for dy in range(-radius, radius + 1):
            if dx * dx + dy * dy <= radius * radius + 1:
                out.paste(mask, (radius + dx, radius + dy), mask)
    return out


def stamp(img, mask, ox, oy, colour):
    target, source = img.load(), mask.load()
    for x in range(mask.width):
        for y in range(mask.height):
            if source[x, y] and 0 <= ox + x < N and 0 <= oy + y < N and target[ox + x, oy + y][3]:
                target[ox + x, oy + y] = colour


def plate(char, background, corner=3):
    img = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    pixels = img.load()
    for x in range(N):
        for y in range(N):
            if min(x, N - 1 - x) + min(y, N - 1 - y) >= corner:
                pixels[x, y] = background + (255,)

    mask = letter_mask(char, 38)
    ox, oy = (N - mask.width) // 2, (N - mask.height) // 2 - 1
    ring = grow(mask, 2)
    stamp(img, ring, ox - 2, oy + 1, dim(background, .38))
    stamp(img, ring, ox - 2, oy - 2, NAVY)
    stamp(img, mask, ox, oy, WHITE)
    stamp(img, mask.crop((0, mask.height - 6, mask.width, mask.height)), ox, oy + mask.height - 6, SHADE)
    return img


def to_svg(img):
    """Row runs merged downward, then one path per colour — keeps the file small."""
    pixels = img.load()
    runs, heights = [], {}
    for y in range(N):
        x = 0
        while x < N:
            colour = pixels[x, y]
            if colour[3] == 0:
                x += 1
                continue
            end = x
            while end < N and pixels[end, y] == colour:
                end += 1
            key = (x, y, end - x, colour)
            runs.append(key)
            heights[key] = 1
            x = end

    used, merged = set(), []
    for x, y, width, colour in runs:
        if (x, y, width, colour) in used:
            continue
        height = 1
        while (x, y + height, width, colour) in heights and (x, y + height, width, colour) not in used:
            used.add((x, y + height, width, colour))
            height += 1
        used.add((x, y, width, colour))
        merged.append((x, y, width, height, colour))

    groups = {}
    for x, y, width, height, colour in merged:
        groups.setdefault(colour[:3], []).append((x, y, width, height))

    lines = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {N} {N}" '
             f'width="{N}" height="{N}" shape-rendering="crispEdges">']
    for (r, g, b), items in groups.items():
        data = " ".join(f"M{x} {y}h{w}v{h}h-{w}z" for x, y, w, h in sorted(items))
        lines.append(f'<path fill="#{r:02x}{g:02x}{b:02x}" d="{data}"/>')
    lines.append("</svg>")
    return "\n".join(lines) + "\n"


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    out_dir = sys.argv[1] if len(sys.argv) > 1 else None
    for name, (char, background) in PROFILES.items():
        icon = plate(char, background)
        with open(os.path.join(here, f"{name}.svg"), "w", encoding="utf8") as handle:
            handle.write(to_svg(icon))
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)
            for size in (512, 256, 128, 64):
                icon.resize((size, size), Image.NEAREST).save(os.path.join(out_dir, f"{name}-{size}.png"))
    print("wrote", ", ".join(PROFILES))


if __name__ == "__main__":
    main()
