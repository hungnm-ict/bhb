/**
 * The size readout follows the box it measures.
 *
 * Parked in the middle of the screen it sat on top of the very thing being
 * framed — which for a count step is a box of digits a few pixels tall.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../src/core/canvas.js', () => ({
  getCanvas: () => ({
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 }),
  }),
}));

const { startDragSelect } = await import('../src/ui/dragselect.js');

let cancel = null;

function drag(fromX, fromY, toX, toY) {
  window.dispatchEvent(new MouseEvent('mousedown', { clientX: fromX, clientY: fromY }));
  window.dispatchEvent(new MouseEvent('mousemove', { clientX: toX, clientY: toY }));
}

afterEach(() => {
  if (cancel) {
    cancel();
    cancel = null;
  }
  document.body.replaceChildren();
});

describe('the drag readout', () => {
  it('hides until there is something to measure', () => {
    cancel = startDragSelect(() => {});
    const hint = document.querySelector('.bhb-drag__hint');
    expect(hint.style.display).not.toBe('block');
  });

  it('sits clear of the box, never over it', () => {
    cancel = startDragSelect(() => {});
    drag(300, 200, 360, 240);

    const hint = document.querySelector('.bhb-drag__hint');
    const box = document.querySelector('.bhb-drag__box');

    expect(hint.textContent).toBe('60 × 40');
    // The box runs 200..240; the readout starts below it.
    expect(parseFloat(hint.style.top)).toBeGreaterThanOrEqual(240);
    expect(box.style.top).toBe('200px');
  });

  it('never runs off the left edge', () => {
    cancel = startDragSelect(() => {});
    drag(2, 200, 12, 240);

    const hint = document.querySelector('.bhb-drag__hint');
    expect(parseFloat(hint.style.left)).toBeGreaterThanOrEqual(0);
  });
});
