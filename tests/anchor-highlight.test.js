/**
 * The box drawn over the game for the anchor row under the cursor.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

let canvas;

vi.mock('../src/core/canvas.js', () => ({
  getCanvas: () => canvas,
}));

function makeCanvas(bufferW, bufferH, cssW, cssH) {
  return {
    width: bufferW,
    height: bufferH,
    getBoundingClientRect: () => ({
      left: 0, top: 0, right: cssW, bottom: cssH, width: cssW, height: cssH,
    }),
  };
}

describe('anchor highlight', () => {
  let store;
  let screens;
  let layer;

  beforeEach(async () => {
    vi.resetModules();
    document.querySelectorAll('.bhb-anchorhi').forEach((node) => node.remove());
    canvas = makeCanvas(800, 520, 800, 520);

    const { createUiStore } = await import('../src/ui/store.js');
    const { createAnchorHighlight } = await import('../src/ui/anchor-highlight.js');

    screens = [
      { id: 's1', anchors: [{ x: 100, y: 50, w: 40, h: 30, bw: 800, bh: 520, samples: [] }] },
    ];
    store = createUiStore();
    layer = createAnchorHighlight({ getScreens: () => screens, getScaleMode: () => 'scale', store });
  });

  function box() {
    return document.querySelector('.bhb-anchorhi');
  }

  it('is hidden with nothing hovered', () => {
    layer.render();

    expect(box().style.display).toBe('none');
  });

  it('outlines the anchor rectangle, flipped to client space', () => {
    store.hoverAnchor({ screenId: 's1', anchorIndex: 0 });
    layer.render();

    expect(box().style.display).toBe('block');
    expect(box().style.left).toBe('100px');
    expect(box().style.top).toBe('440px'); // 520 - (50 + 30)
    expect(box().style.width).toBe('40px');
    expect(box().style.height).toBe('30px');
  });

  it('hides itself once the hover moves off the anchor', () => {
    store.hoverAnchor({ screenId: 's1', anchorIndex: 0 });
    layer.render();
    store.hoverAnchor(null);
    layer.render();

    expect(box().style.display).toBe('none');
  });

  it('hides itself when the hovered screen or anchor no longer exists', () => {
    store.hoverAnchor({ screenId: 'missing', anchorIndex: 0 });
    layer.render();

    expect(box().style.display).toBe('none');
  });
});
