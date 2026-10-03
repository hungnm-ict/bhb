/**
 * A party screen's geometry: which boss it is (so how many seats), and where
 * the seats sit (one drag over the whole list, tuned afterward by pitch).
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const canvas = {
  width: 800,
  height: 520,
  getBoundingClientRect: () => ({ left: 0, top: 0, right: 800, bottom: 520, width: 800, height: 520 }),
};

const gl = {
  RGBA: 0,
  UNSIGNED_BYTE: 0,
  readPixels: (_x, _y, w, h, _f, _t, out) => {
    for (let i = 0; i < w * h; i += 1) {
      out[i * 4] = 10;
      out[i * 4 + 1] = 20;
      out[i * 4 + 2] = 30;
      out[i * 4 + 3] = 255;
    }
  },
};

vi.mock('../src/core/canvas.js', () => ({
  getRenderTarget: () => ({ canvas, gl }),
  getCanvas: () => canvas,
}));

const { createScreenEditor } = await import('../src/bot/screen-editor.js');
const { createScreen } = await import('../src/bot/screen.js');

describe('screen editor: party geometry', () => {
  let screens;
  let editor;

  beforeEach(() => {
    screens = [createScreen({ id: 's1', name: 'Abyss' })];
    editor = createScreenEditor({ getScreens: () => screens, persist: () => {}, report: () => {} });
  });

  it('is off by default, so an ordinary screen grows nothing new', () => {
    expect(screens[0].isParty).toBe(false);
    expect(screens[0].bossId).toBeNull();
  });

  it('toggles the party flag independently of everything else', () => {
    editor.setIsParty('s1', true);
    expect(screens[0].isParty).toBe(true);
    editor.setIsParty('s1', false);
    expect(screens[0].isParty).toBe(false);
  });

  it('derives the seat pitch from the chosen boss, not a typed number', () => {
    editor.setBossId('s1', 'abyss'); // 3 seats
    editor.captureListFrame({ left: 100, top: 200, width: 200, height: 120 }, 's1');
    expect(screens[0].pitch).toBe(40); // 120px / 3 seats
    expect(screens[0].listTop).toBe(320);
    expect(screens[0].listBh).toBe(520);
  });

  it('gives Orlag a tighter pitch for the same drag, five seats instead of three', () => {
    editor.setBossId('s1', 'orlag'); // 5 seats
    editor.captureListFrame({ left: 100, top: 200, width: 200, height: 120 }, 's1');
    expect(screens[0].pitch).toBe(24); // 120px / 5 seats
  });

  it('lets the pitch be nudged afterward, independently of the capture', () => {
    editor.setBossId('s1', 'abyss');
    editor.captureListFrame({ left: 100, top: 200, width: 200, height: 120 }, 's1');
    editor.setPitch('s1', 37);
    expect(screens[0].pitch).toBe(37);
  });

  it('floors the nudged pitch at one pixel', () => {
    editor.setPitch('s1', -5);
    expect(screens[0].pitch).toBe(1);
  });
});
