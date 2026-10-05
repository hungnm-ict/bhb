/**
 * Duplicating a screen.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { createScreenEditor } from '../src/bot/screen-editor.js';
import { createScreen } from '../src/bot/screen.js';

function editorFor(screens) {
  return createScreenEditor({ getScreens: () => screens, persist: () => {}, report: () => {} });
}

describe('duplicate', () => {
  it('appends the copy at the end of the list', () => {
    const screens = [createScreen({ name: 'lobby' }), createScreen({ name: 'raid' })];
    const editor = editorFor(screens);

    editor.duplicate(screens[0].id);

    expect(screens).toHaveLength(3);
    expect(screens[2].name).toBe('lobby (2)');
  });

  it('copies every anchor, minRatio and the party configuration', () => {
    const screens = [
      createScreen({
        name: 'world boss',
        minRatio: 0.82,
        isParty: true,
        bossId: 'abyss',
        listTop: 120,
        pitch: 40,
        listBh: 520,
        notify: true,
        stopsTask: true,
        anchors: [{ x: 1, y: 2, w: 3, h: 4, bw: 800, bh: 520, samples: [{ dx: 0.5, dy: 0.5, hex: '#ff0000' }] }],
      }),
    ];
    const editor = editorFor(screens);

    editor.duplicate(screens[0].id);
    const copy = screens[1];

    expect(copy.minRatio).toBe(0.82);
    expect(copy.isParty).toBe(true);
    expect(copy.bossId).toBe('abyss');
    expect(copy.listTop).toBe(120);
    expect(copy.pitch).toBe(40);
    expect(copy.listBh).toBe(520);
    expect(copy.notify).toBe(true);
    expect(copy.stopsTask).toBe(true);
    expect(copy.anchors).toEqual(screens[0].anchors);
  });

  it('gives the copy an id and anchors of its own', () => {
    const screens = [
      createScreen({ name: 'lobby', anchors: [{ x: 0, y: 0, w: 1, h: 1, samples: [{ dx: 0, dy: 0, hex: '#000' }] }] }),
    ];
    const editor = editorFor(screens);

    editor.duplicate(screens[0].id);

    expect(screens[1].id).not.toBe(screens[0].id);
    screens[1].anchors[0].samples[0].hex = '#fff';
    expect(screens[0].anchors[0].samples[0].hex, 'the original keeps its own anchors').toBe('#000');
  });

  it('does nothing for a screen that is not there', () => {
    const screens = [createScreen({ name: 'lobby' })];
    const editor = editorFor(screens);

    expect(editor.duplicate('missing')).toBeNull();
    expect(screens).toHaveLength(1);
  });
});
