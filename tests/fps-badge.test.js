/**
 * The frame-rate badge sits on the game's own corner, so it has to follow the
 * canvas box rather than the viewport.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';

const canvas = {
  width: 640,
  height: 400,
  getBoundingClientRect: () => ({ left: 120, top: 40, right: 760, bottom: 440, width: 640, height: 400 }),
};

vi.mock('../src/core/canvas.js', () => ({ getCanvas: () => canvas }));
vi.mock('../src/core/speed.js', () => ({
  getSpeed: () => speed,
  getFrameRates: () => rates,
}));

let speed = 1;
let rates = { real: 60, game: 60 };
let isVisible = true;

const { createFpsBadge } = await import('../src/ui/fps-badge.js');

// One badge for the file: it mounts its node once and keeps it, exactly as it
// does in the app, so a fresh one per test would pile up nodes.
const badge = createFpsBadge({ isVisible: () => isVisible });

function draw() {
  badge.render();
  return document.querySelector('.bhb-fpsbadge');
}

describe('the fps badge', () => {
  it('parks itself inside the canvas corner', () => {
    const node = draw();

    expect(node.style.left).toBe('126px');
    expect(node.style.top).toBe('46px');
    expect(node.textContent).toBe('60 fps');
    expect(node.classList.contains('is-good'), 'a smooth frame rate reads green').toBe(true);
  });

  it('shows the browser rate alone, whatever the speed hack is doing', () => {
    speed = 10;
    rates = { real: 58, game: 410 };

    expect(draw().textContent).toBe('58 fps');
  });

  it('warns when the browser itself is stuttering', () => {
    speed = 1;
    rates = { real: 12, game: 12 };

    expect(draw().classList.contains('is-low')).toBe(true);
  });

  it('stays out of the way when switched off', () => {
    isVisible = false;

    expect(draw().style.display).toBe('none');
  });
});
