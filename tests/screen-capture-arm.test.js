/**
 * Arming the Screens tab's own capture key, same pattern as the Steps tab's
 * X key — off by default, so a stray S press cannot start a drag nobody
 * asked for.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { renderScreensTab } from '../src/ui/panel/screens.js';
import { createUiStore } from '../src/ui/store.js';

function build(store) {
  document.body.replaceChildren();
  const node = renderScreensTab({
    store,
    getScreens: () => [],
    getEngineState: () => ({ screen: null, screenName: null }),
    screenEditor: { probe: () => null },
    refresh: () => {},
  });
  document.body.append(node);
  return node;
}

describe('the screen capture arm toggle', () => {
  it('shows off by default', () => {
    const node = build(createUiStore());
    expect(node.querySelector('.bhb-kbd')?.textContent).toBe('S');
    expect(node.querySelector('.bhb-task--wrap').classList.contains('is-on')).toBe(false);
  });

  it('shows on once armed', () => {
    const store = createUiStore();
    store.armScreenCapture(true);
    const node = build(store);

    expect(node.querySelector('.bhb-task--wrap').classList.contains('is-on')).toBe(true);
  });

  it('calls armScreenCapture with the flipped value on click', () => {
    const store = createUiStore();
    const spy = vi.spyOn(store, 'armScreenCapture');
    const node = build(store);

    node.querySelector('.bhb-task--wrap').click();

    expect(spy).toHaveBeenCalledWith(true);
  });
});
