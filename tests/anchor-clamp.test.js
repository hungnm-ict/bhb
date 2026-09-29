/**
 * Where the corner readouts sit when the window is smaller than the game.
 *
 * They hang off the canvas, not the window, so they stay lined up with the
 * picture. But the canvas is pinned to a fixed size: shrink the window and it
 * runs off the right edge, taking the readouts with it — and what is wanted
 * at a narrow width is precisely the frame rate and what the bot is doing.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

let box = { left: 0, top: 0, right: 800, bottom: 500, width: 800, height: 500 };

vi.mock('../src/core/canvas.js', () => ({
  getCanvas: () => ({ getBoundingClientRect: () => box }),
}));

const { anchorTopRight, anchorTopLeft, CANVAS_INSET } = await import('../src/ui/anchor.js');

function node() {
  const element = document.createElement('div');
  document.body.append(element);
  return element;
}

beforeEach(() => {
  document.body.replaceChildren();
  window.innerWidth = 1200;
  window.innerHeight = 800;
  box = { left: 0, top: 0, right: 800, bottom: 500, width: 800, height: 500 };
});

describe('anchorTopRight', () => {
  it('hangs off the canvas while the canvas fits', () => {
    const element = node();
    anchorTopRight(element);

    expect(element.style.right).toBe(`${1200 - 800 + CANVAS_INSET}px`);
  });

  it('stays on screen when the canvas runs off the right edge', () => {
    window.innerWidth = 420;
    const element = node();

    anchorTopRight(element);

    expect(parseFloat(element.style.right), 'off the window is off the screen').toBeGreaterThanOrEqual(
      CANVAS_INSET
    );
  });

  it('stays on screen when the canvas starts above the window', () => {
    box = { ...box, top: -300, bottom: 200 };
    const element = node();

    anchorTopRight(element);

    expect(parseFloat(element.style.top)).toBeGreaterThanOrEqual(CANVAS_INSET);
  });
});

describe('anchorTopLeft', () => {
  it('stays on screen when the canvas starts left of the window', () => {
    box = { ...box, left: -240, right: 560 };
    const element = node();

    anchorTopLeft(element);

    expect(parseFloat(element.style.left)).toBeGreaterThanOrEqual(CANVAS_INSET);
  });
});
