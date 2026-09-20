/**
 * A dropdown the user has finished with must not hold the panel stale.
 *
 * The tick skips rendering while a select inside the panel has focus, so a
 * rebuild never closes a list mid-choice. A browser keeps that focus after the
 * choice is made, though — so the very redraw the choice asked for was the one
 * being skipped, and the table went on showing the previous filter.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createPanel } from '../src/ui/panel/index.js';
import { createUiStore, Tab } from '../src/ui/store.js';
import { createStep } from '../src/bot/step.js';


const ACTIVITIES = [
  { id: 'gvg', name: 'GVG', enabled: true },
  { id: 'worldbossteam', name: 'World Boss (team)', enabled: true },
];

function build() {
  for (const stale of document.querySelectorAll('.bhb-panel')) {
    stale.remove();
  }

  const store = createUiStore();
  store.setTab(Tab.STEPS);
  store.openPanel();

  const steps = [
    createStep({ label: 'wb one', activity: 'worldbossteam' }),
    createStep({ label: 'wb two', activity: 'worldbossteam' }),
    createStep({ label: 'gvg one', activity: 'gvg' }),
  ];

  const panel = createPanel({
    store,
    getSteps: () => steps,
    getEngineState: () => ({ expectedStepId: null, activeTask: null }),
    getActivities: () => ACTIVITIES,
    getScreens: () => [],
    stepEditor: { setActivity: () => {}, rename: () => {}, setScreens: () => {} },
    dryRunner: { start: () => {}, stop: () => {} },
    settings: { scaleMode: 'scale' },
    getProfileName: () => 'Default',
    profileActions: { list: () => [], activeId: () => 'p1', select: () => {} },
    refresh: () => panel.render(),
  });

  panel.render();
  return { panel, store };
}

function filterSelect() {
  return [...document.querySelectorAll('.bhb-panel select')].find((select) =>
    [...select.options].some((option) => option.value === '__all__')
  );
}

function rowCount() {
  return document.querySelectorAll('.bhb-panel .bhb-rule__name').length;
}

beforeEach(() => {
  for (const stale of document.querySelectorAll('.bhb-panel')) {
    stale.remove();
  }
});

describe('panel redraw after a dropdown is used', () => {
  it('re-filters the table even though the select still has focus', () => {
    build();
    expect(rowCount(), 'all three steps to begin with').toBe(3);

    const select = filterSelect();
    select.focus();
    select.value = 'gvg';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(document.activeElement, 'the browser keeps focus after a choice').toBe(
      document.activeElement
    );
    expect(rowCount(), 'only the one GVG step is left').toBe(1);
  });

  it('still skips the periodic redraw while a select holds focus', () => {
    const { panel } = build();
    const select = filterSelect();
    select.focus();

    const before = document.querySelector('.bhb-panel__body');
    panel.render();

    expect(
      document.querySelector('.bhb-panel__body'),
      'an unprompted tick must not rebuild under an open list'
    ).toBe(before);
  });
});
