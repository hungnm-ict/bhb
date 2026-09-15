/**
 * Markers are positioned from the live canvas, so they have to follow it when
 * the window or DPI changes underneath them.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

let canvas;

vi.mock('../src/core/canvas.js', () => ({
  getCanvas: () => canvas,
}));

/** A canvas whose framebuffer and CSS box can be resized in a test. */
function makeCanvas(bufferW, bufferH, cssW, cssH) {
  return {
    width: bufferW,
    height: bufferH,
    getBoundingClientRect: () => ({
      left: 0, top: 0, right: cssW, bottom: cssH, width: cssW, height: cssH,
    }),
  };
}

describe('marker layer', () => {
  let store;
  let steps;
  let layer;

  beforeEach(async () => {
    vi.resetModules();
    document.querySelectorAll('.bhb-markers').forEach((node) => node.remove());
    canvas = makeCanvas(800, 520, 800, 520);

    const { createUiStore, Tab } = await import('../src/ui/store.js');
    const { createMarkerLayer } = await import('../src/ui/markers.js');

    store = createUiStore();
    steps = [{ id: 'a', label: 'Rerun', enabled: true, hex: '#a6d339', points: [{ x: 400, y: 260, bw: 800, bh: 520 }] }];
    layer = createMarkerLayer({ getSteps: () => steps, getScaleMode: () => 'scale', store });

    store.openPanel();
    store.setTab(Tab.STEPS);
    // Markers are on demand now; these tests are about where they land.
    store.pinMarkers(true);
  });

  function marks() {
    return [...document.querySelectorAll('.bhb-mark')];
  }

  it('places a marker at the step position, with y flipped to client space', () => {
    layer.render();

    expect(marks()).toHaveLength(1);
    expect(marks()[0].style.left).toBe('400px');
    expect(marks()[0].style.top).toBe('260px'); // 520 - 260
  });

  it('follows the canvas when the framebuffer and box both change', () => {
    canvas = makeCanvas(1600, 1040, 400, 260);
    layer.render();

    expect(marks()[0].style.left).toBe('200px');
    expect(marks()[0].style.top).toBe('130px');
  });

  it('hides itself when the steps tab is not open', () => {
    layer.render();
    store.closePanel();
    layer.render();

    expect(marks()).toHaveLength(0);
    expect(document.querySelector('.bhb-markers').style.display).toBe('none');
  });

  it('selects a step when its marker is clicked', () => {
    layer.render();
    marks()[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(store.get().selectedStepId).toBe('a');
  });
});
