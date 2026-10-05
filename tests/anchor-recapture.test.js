/**
 * Recapturing one anchor in place, instead of deleting it and capturing a
 * fresh one at the end of the list.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const canvas = {
  width: 800,
  height: 520,
  getBoundingClientRect: () => ({ left: 0, top: 0, right: 800, bottom: 520, width: 800, height: 520 }),
  dispatchEvent: () => true,
};

function gl(hex) {
  const [r, g, b] = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  return {
    RGBA: 0,
    UNSIGNED_BYTE: 0,
    readPixels(_x, _y, w, h, _format, _type, out) {
      for (let i = 0; i < w * h; i += 1) {
        out[i * 4] = r;
        out[i * 4 + 1] = g;
        out[i * 4 + 2] = b;
        out[i * 4 + 3] = 255;
      }
    },
  };
}

let target;
vi.mock('../src/core/canvas.js', () => ({
  getRenderTarget: () => target,
  getCanvas: () => canvas,
}));

vi.mock('../src/core/input.js', () => ({
  dispatchMoveTo: vi.fn(),
  resetHover: vi.fn(),
}));

describe('screen editor: anchor recapture', () => {
  let screens;
  let editor;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    screens = [];
    target = { canvas, gl: gl('#101418') };
    const { createScreenEditor } = await import('../src/bot/screen-editor.js');
    editor = createScreenEditor({ getScreens: () => screens, persist: () => {}, report: () => {} });
  });

  it('overwrites the anchor at the given index instead of appending', async () => {
    const screen = await editor.captureAnchor({ left: 0, top: 0, width: 10, height: 10 });
    await editor.captureAnchor({ left: 0, top: 0, width: 10, height: 10 }, screen.id);
    expect(screen.anchors).toHaveLength(2);

    target = { canvas, gl: gl('#ff0000') };
    await editor.captureAnchor({ left: 0, top: 0, width: 10, height: 10 }, screen.id, 0);

    expect(screen.anchors).toHaveLength(2);
    expect(screen.anchors[0].samples[0].hex).toBe('#ff0000');
    expect(screen.anchors[1].samples[0].hex).toBe('#101418');
  });

  it('reports the recapture against the anchor it replaced', async () => {
    const report = vi.fn();
    editor = (await import('../src/bot/screen-editor.js')).createScreenEditor({
      getScreens: () => screens,
      persist: () => {},
      report,
    });
    const screen = await editor.captureAnchor({ left: 0, top: 0, width: 10, height: 10 });
    report.mockClear();

    await editor.captureAnchor({ left: 0, top: 0, width: 10, height: 10 }, screen.id, 0);

    expect(report).toHaveBeenCalledWith(expect.stringContaining('1'));
  });
});
