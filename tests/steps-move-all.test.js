/**
 * Moving a whole set of steps to another activity in one go.
 *
 * Setting the activity row by row is the same choice repeated: twenty Dungeon
 * steps were twenty dropdowns.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderStepsTab } from '../src/ui/panel/steps.js';
import { createUiStore } from '../src/ui/store.js';
import { createStep } from '../src/bot/step.js';

function renderTab(steps, setActivity, filter = null) {
  const store = createUiStore();
  store.setRuleFilter(filter);
  return renderStepsTab({
    store,
    getSteps: () => steps,
    getEngineState: () => ({ expectedStepId: null }),
    getActivities: () => [{ id: 'dungeon', name: 'Dungeon' }],
    getScreens: () => [],
    stepEditor: { setActivity, rename: () => {}, setScreens: () => {} },
    dryRunner: { start: () => {}, stop: () => {} },
    settings: { scaleMode: 'scale' },
    refresh: () => {},
  });
}

function moveSelect(node) {
  return [...node.querySelectorAll('select')].find(
    (select) => [...select.options].some((option) => option.value === '__none__')
  );
}

describe('moving steps in bulk', () => {
  it('sends every step the tab is showing to the chosen activity', () => {
    const steps = [createStep({ label: 'one' }), createStep({ label: 'two' })];
    const moved = [];
    const select = moveSelect(renderTab(steps, (id, activity) => moved.push([id, activity])));

    select.value = 'dungeon';
    select.dispatchEvent(new Event('change'));

    expect(moved).toEqual([[steps[0].id, 'dungeon'], [steps[1].id, 'dungeon']]);
  });

  it('leaves the steps a filter is hiding where they are', () => {
    const mine = createStep({ label: 'mine', activity: 'dungeon' });
    const other = createStep({ label: 'other' });
    const moved = [];
    const select = moveSelect(
      renderTab([mine, other], (id, activity) => moved.push([id, activity]), 'dungeon')
    );

    select.value = '';
    select.dispatchEvent(new Event('change'));

    expect(moved).toEqual([[mine.id, null]]);
  });

  it('does nothing while the prompt is still selected', () => {
    const moved = [];
    const select = moveSelect(renderTab([createStep({ label: 'one' })], (id) => moved.push(id)));

    select.dispatchEvent(new Event('change'));

    expect(moved).toEqual([]);
  });
});
