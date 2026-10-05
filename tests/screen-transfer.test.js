/**
 * Moving screens to another profile or account: export to JSON, import back.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { createScreenEditor } from '../src/bot/screen-editor.js';
import { createScreen } from '../src/bot/screen.js';

function editorFor(screens) {
  return createScreenEditor({ getScreens: () => screens, persist: () => {}, report: () => {} });
}

describe('exportAll / importScreens', () => {
  it('imports an export into a different list with fresh ids, appended', () => {
    const source = [createScreen({ name: 'lobby' })];
    const json = editorFor(source).exportAll();

    const target = [createScreen({ name: 'already here' })];
    const added = editorFor(target).importScreens(json);

    expect(added).toBe(1);
    expect(target).toHaveLength(2);
    expect(target[1].name).toBe('lobby');
    expect(target[1].id).not.toBe(source[0].id);
  });

  it('rejects anything that is not a JSON array of screens', () => {
    const target = [];
    expect(() => editorFor(target).importScreens('{"not":"an array"}')).toThrow();
    expect(target).toHaveLength(0);
  });
});
