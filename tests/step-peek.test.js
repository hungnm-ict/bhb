/**
 * The ◉ on a step: a click fades the panel so the marker under it shows, and
 * moving off the button brings the panel back.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderStepsTab } from '../src/ui/panel/steps.js';
import { createUiStore } from '../src/ui/store.js';
import { createStep } from '../src/bot/step.js';

function renderInto(store, step) {
  document.body.replaceChildren();
  const node = renderStepsTab({
    store,
    getSteps: () => [step],
    getEngineState: () => ({ expectedStepId: null }),
    getActivities: () => [],
    getScreens: () => [],
    getCanvasLock: () => ({ width: 640, height: 400 }),
    settings: { scaleMode: 'scale', showScreens: false },
    stepEditor: {},
    dryRunner: { start: () => {}, stop: () => {} },
    refresh: () => {},
  });
  document.body.append(node);
  return node.querySelector('.bhb-step__peek');
}

function moveOver(target) {
  target.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }));
}

describe('previewing a step', () => {
  it('fades on a click, not on a hover, and a second click undoes it', () => {
    const store = createUiStore();
    const step = createStep({ label: 'one' });
    const button = renderInto(store, step);

    button.dispatchEvent(new MouseEvent('mouseenter'));
    expect(store.get().previewStepId).toBeNull();

    button.click();
    expect(store.get().previewStepId).toBe(step.id);

    button.click();
    expect(store.get().previewStepId).toBeNull();
  });

  it('comes back once the pointer leaves, even after the row was rebuilt under it', () => {
    const store = createUiStore();
    const step = createStep({ label: 'one' });
    renderInto(store, step).click();

    // A log line rebuilds the panel while the pointer rests on the button: the
    // old node is gone, and a gone node never reports that the pointer left.
    const rebuilt = renderInto(store, step);
    moveOver(rebuilt);
    expect(store.get().previewStepId).toBe(step.id);

    moveOver(document.body);
    expect(store.get().previewStepId).toBeNull();
  });

  it('is dropped when the panel is toggled shut, so it never reopens faded', () => {
    const store = createUiStore();
    store.openPanel();
    store.previewStep('some-step');

    store.togglePanel();
    store.togglePanel();

    expect(store.get().panelOpen).toBe(true);
    expect(store.get().previewStepId).toBeNull();
  });
});
