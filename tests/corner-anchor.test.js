/**
 * The two corners of the game have to agree.
 *
 * The frame rate hangs off the canvas box; the strip used to hang off the
 * viewport. They only ever lined up by accident, and stopped as soon as the
 * page put anything above the canvas.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createFpsBadge } from '../src/ui/fps-badge.js';
import { createHud } from '../src/ui/hud.js';

const BOX = { left: 40, top: 38, right: 680, bottom: 438, width: 640, height: 400 };

function placeCanvas(box = BOX) {
  const canvas = document.createElement('canvas');
  canvas.id = 'unity-canvas';
  canvas.getBoundingClientRect = () => ({ ...box, x: box.left, y: box.top, toJSON: () => ({}) });
  document.body.append(canvas);
  return canvas;
}

function renderBoth() {
  const fps = createFpsBadge({ isVisible: () => true });
  const hud = createHud({
    getEngineState: () => ({ activeTask: null, activity: null, remainingMs: 0 }),
    store: { get: () => ({ panelOpen: false }), togglePanel: () => {} },
  });
  fps.render();
  hud.render();
  return {
    fps: document.querySelector('.bhb-fpsbadge'),
    hud: document.querySelector('.bhb-hud'),
  };
}

beforeEach(() => {
  for (const stale of document.querySelectorAll('.bhb-fpsbadge, .bhb-hud, canvas')) {
    stale.remove();
  }
  window.innerWidth = 1000;
});

describe('the badges in the game corners', () => {
  it('sit at the same height', () => {
    placeCanvas();
    const { fps, hud } = renderBoth();
    expect(hud.style.top).toBe(fps.style.top);
  });

  it('are inset from the canvas, not from the window', () => {
    placeCanvas();
    const { fps, hud } = renderBoth();
    expect(fps.style.top).toBe('44px');
    expect(hud.style.top).toBe('44px');
  });

  it('hold the same inset on the side they hug', () => {
    placeCanvas();
    const { fps, hud } = renderBoth();
    // Left edge at 40 + 6; right edge at 1000 - 680 + 6.
    expect(fps.style.left).toBe('46px');
    expect(hud.style.right).toBe('326px');
  });

  it('follow the canvas when it moves', () => {
    placeCanvas({ ...BOX, top: 120, left: 200, right: 840 });
    const { fps, hud } = renderBoth();
    expect(fps.style.top).toBe('126px');
    expect(hud.style.top).toBe('126px');
    expect(hud.style.right).toBe('166px');
  });

  it('leaves the strip where the stylesheet puts it when there is no canvas', () => {
    const { hud } = renderBoth();
    expect(hud.style.top, 'nothing to hang off, so nothing is forced').toBe('');
  });
});
