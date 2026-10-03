import { describe, it, expect } from 'vitest';
import { captureFingerprint, matchPoint, resolveSlotRects } from '../src/core/region.js';
import { slotsForBoss, WORLD_BOSSES } from '../src/bot/worldboss.js';

/**
 * A framebuffer painted as a party list: `rowColors[i]` fills row i, counted
 * from the top. Everything outside the list is black, so a band that drifts
 * off its row stops matching rather than matching the neighbour by luck.
 */
function createPartyGl({ width, height, listTop, pitch, rowHeight, left, right, rowColors }) {
  function colorAt(x, y) {
    if (x < left || x >= right) {
      return { r: 0, g: 0, b: 0 };
    }
    const fromTop = listTop - y;
    const index = Math.floor(fromTop / pitch);
    if (fromTop < 0 || index < 0 || index >= rowColors.length) {
      return { r: 0, g: 0, b: 0 };
    }
    if (fromTop - index * pitch >= rowHeight) {
      return { r: 0, g: 0, b: 0 };
    }
    return rowColors[index];
  }

  return {
    RGBA: 0,
    UNSIGNED_BYTE: 0,
    readPixels(x, y, w, h, _format, _type, out) {
      for (let row = 0; row < h; row += 1) {
        for (let col = 0; col < w; col += 1) {
          const { r, g, b } = colorAt(x + col, y + row);
          const offset = (row * w + col) * 4;
          out[offset] = r;
          out[offset + 1] = g;
          out[offset + 2] = b;
          out[offset + 3] = 255;
        }
      }
    },
  };
}

const BLUE = { r: 20, g: 60, b: 200 };
const GREY = { r: 90, g: 90, b: 90 };

/** A five-seat list with the friend sitting in the fourth row. */
function orlagWithFriendAt(index) {
  const rowColors = [GREY, GREY, GREY, GREY, GREY];
  rowColors[index] = BLUE;
  return createPartyGl({
    width: 400,
    height: 400,
    listTop: 300,
    pitch: 40,
    rowHeight: 36,
    left: 50,
    right: 150,
    rowColors,
  });
}

const BUFFER = { width: 400, height: 400 };
const SLOTTING = { listTop: 300, pitch: 40, bh: 400, slots: 5 };

/** The rectangle a user's drag over row `index` produces. */
function rowRect(index) {
  const top = 300 - index * 40;
  return { x: 60, y: top - 30, w: 80, h: 30, bw: 400, bh: 400 };
}

describe('world boss table', () => {
  it('gives Orlag five seats and the Abyss three', () => {
    expect(slotsForBoss('orlag')).toBe(5);
    expect(slotsForBoss('abyss')).toBe(3);
  });

  it('treats an unknown boss as a single row, as before slots existed', () => {
    expect(slotsForBoss(null)).toBe(1);
    expect(slotsForBoss('nope')).toBe(1);
  });

  it('names every boss distinctly', () => {
    const names = WORLD_BOSSES.map((boss) => boss.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('resolveSlotRects', () => {
  it('turns one captured row into one rectangle per seat', () => {
    const rects = resolveSlotRects(rowRect(3), BUFFER, 'scale', SLOTTING);
    expect(rects).toHaveLength(5);
    expect(rects.map((rect) => rect.y)).toEqual([270, 230, 190, 150, 110]);
  });

  it('keeps the captured rectangle exactly, wherever the drag landed', () => {
    const sloppy = { x: 60, y: 183, w: 80, h: 30, bw: 400, bh: 400 };
    const rects = resolveSlotRects(sloppy, BUFFER, 'scale', SLOTTING);
    expect(rects).toContainEqual({ x: 60, y: 183, w: 80, h: 30 });
  });

  it('is one rectangle when the screen is not a party screen', () => {
    expect(resolveSlotRects(rowRect(0), BUFFER, 'scale', null)).toHaveLength(1);
    expect(resolveSlotRects(rowRect(0), BUFFER, 'scale', { ...SLOTTING, slots: 1 })).toHaveLength(1);
  });
});

describe('matchPoint across slots', () => {
  it('finds the friend in a row they were not captured in', () => {
    const point = { ...rowRect(3), perSlot: true, samples: null };
    const captured = captureFingerprint(orlagWithFriendAt(3), point);
    const slotted = { ...point, samples: captured.samples };

    const hit = matchPoint(orlagWithFriendAt(0), slotted, null, BUFFER, 'scale', 20, 0.75, SLOTTING);
    expect(hit.matched).toBe(true);
  });

  it('clicks the row the friend is in, not the row they were captured in', () => {
    const point = { ...rowRect(3), perSlot: true, samples: null };
    const captured = captureFingerprint(orlagWithFriendAt(3), point);
    const slotted = { ...point, samples: captured.samples };

    const hit = matchPoint(orlagWithFriendAt(1), slotted, null, BUFFER, 'scale', 20, 0.75, SLOTTING);
    expect(hit.matched).toBe(true);
    const expected = rowRect(1);
    expect(hit.point.y).toBe(expected.y + Math.round(expected.h / 2));
  });

  it('does not match when the friend is in no row at all', () => {
    const point = { ...rowRect(3), perSlot: true, samples: null };
    const captured = captureFingerprint(orlagWithFriendAt(3), point);
    const slotted = { ...point, samples: captured.samples };

    const empty = createPartyGl({
      width: 400,
      height: 400,
      listTop: 300,
      pitch: 40,
      rowHeight: 36,
      left: 50,
      right: 150,
      rowColors: [GREY, GREY, GREY, GREY, GREY],
    });
    expect(matchPoint(empty, slotted, null, BUFFER, 'scale', 20, 0.75, SLOTTING).matched).toBe(false);
  });

  it('leaves a point that is not marked per-slot reading its own row only', () => {
    const point = { ...rowRect(3), samples: null };
    const captured = captureFingerprint(orlagWithFriendAt(3), point);
    const plain = { ...point, samples: captured.samples };

    expect(matchPoint(orlagWithFriendAt(1), plain, null, BUFFER, 'scale', 20, 0.75, SLOTTING).matched).toBe(false);
    expect(matchPoint(orlagWithFriendAt(3), plain, null, BUFFER, 'scale', 20, 0.75, SLOTTING).matched).toBe(true);
  });
});
