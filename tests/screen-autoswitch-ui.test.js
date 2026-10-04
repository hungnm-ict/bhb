/**
 * The Screens tab's own dropdown for `triggerActivity`: lists the current
 * activities, defaults to blank, and survives a stored id that no longer
 * names one of them.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { renderScreensTab } from '../src/ui/panel/screens.js';
import { createScreen } from '../src/bot/screen.js';

function renderInto(screen, activities, screenEditorOverrides = {}) {
  document.body.replaceChildren();
  const node = renderScreensTab({
    getScreens: () => [screen],
    getActivities: () => activities,
    getEngineState: () => ({ screen: null, screenName: null }),
    screenEditor: {
      probe: () => null,
      setTriggerActivity: vi.fn(),
      ...screenEditorOverrides,
    },
    store: { get: () => ({ isScreenCaptureArmed: false }), armScreenCapture: () => {} },
    refresh: () => {},
  });
  document.body.append(node);
  return node;
}

function triggerSelect(node) {
  return [...node.querySelectorAll('select')].find((select) =>
    [...select.options].some((option) => option.value === '')
  );
}

describe('the trigger-activity dropdown', () => {
  it('defaults to blank on an untagged screen', () => {
    const screen = createScreen({ id: 'a' });
    const node = renderInto(screen, [{ id: 'raid', name: 'Raid' }]);

    expect(triggerSelect(node).value).toBe('');
  });

  it('shows the screen\'s own activity selected', () => {
    const screen = createScreen({ id: 'a', triggerActivity: 'raid' });
    const node = renderInto(screen, [{ id: 'raid', name: 'Raid' }]);

    expect(triggerSelect(node).value).toBe('raid');
  });

  it('calls setTriggerActivity with the chosen id', () => {
    const screen = createScreen({ id: 'a' });
    const setTriggerActivity = vi.fn();
    const node = renderInto(screen, [{ id: 'raid', name: 'Raid' }], { setTriggerActivity });

    const select = triggerSelect(node);
    select.value = 'raid';
    select.dispatchEvent(new Event('change'));

    expect(setTriggerActivity).toHaveBeenCalledWith('a', 'raid');
  });

  it('calls setTriggerActivity with null for the blank option', () => {
    const screen = createScreen({ id: 'a', triggerActivity: 'raid' });
    const setTriggerActivity = vi.fn();
    const node = renderInto(screen, [{ id: 'raid', name: 'Raid' }], { setTriggerActivity });

    const select = triggerSelect(node);
    select.value = '';
    select.dispatchEvent(new Event('change'));

    expect(setTriggerActivity).toHaveBeenCalledWith('a', null);
  });

  it('does not throw when the stored activity no longer exists', () => {
    const screen = createScreen({ id: 'a', triggerActivity: 'deleted-activity' });

    expect(() => renderInto(screen, [{ id: 'raid', name: 'Raid' }])).not.toThrow();
  });
});
