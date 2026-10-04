/**
 * The one new field a Screen carries for auto-switching the Run target:
 * which activity it means, or none.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { createScreen } from '../src/bot/screen.js';

describe('createScreen: triggerActivity', () => {
  it('defaults to null, so an existing Screen is unaffected', () => {
    expect(createScreen().triggerActivity).toBeNull();
  });

  it('can be set at creation, the same as every other field', () => {
    expect(createScreen({ triggerActivity: 'raid' }).triggerActivity).toBe('raid');
  });
});

describe('screenEditor.setTriggerActivity', () => {
  it('sets it', async () => {
    const { createScreenEditor } = await import('../src/bot/screen-editor.js');
    const screens = [createScreen({ id: 'a' })];
    const editor = createScreenEditor({ getScreens: () => screens, persist: () => {} });

    editor.setTriggerActivity('a', 'raid');

    expect(screens[0].triggerActivity).toBe('raid');
  });

  it('clears it with null', async () => {
    const { createScreenEditor } = await import('../src/bot/screen-editor.js');
    const screens = [createScreen({ id: 'a', triggerActivity: 'raid' })];
    const editor = createScreenEditor({ getScreens: () => screens, persist: () => {} });

    editor.setTriggerActivity('a', null);

    expect(screens[0].triggerActivity).toBeNull();
  });

  it('does nothing for a screen that is not there', async () => {
    const { createScreenEditor } = await import('../src/bot/screen-editor.js');
    const screens = [createScreen({ id: 'a' })];
    const editor = createScreenEditor({ getScreens: () => screens, persist: () => {} });

    expect(() => editor.setTriggerActivity('gone', 'raid')).not.toThrow();
  });
});
