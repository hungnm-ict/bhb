/**
 * The count step's row: a fifth behaviour, its two numbers, and the only
 * place in the steps tab that draws a box on the game.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { renderStepsTab } from '../src/ui/panel/steps.js';
import { createUiStore } from '../src/ui/store.js';
import { createStep, StepKind } from '../src/bot/step.js';

// The dep fixture is the one tests/step-pack-panel.test.js uses; keep them in
// step, since the tab reads more of it than any one test needs.
function render(step, overrides = {}) {
  document.body.replaceChildren();
  const store = createUiStore();
  const node = renderStepsTab({
    store,
    getSteps: () => [step],
    getEngineState: () => ({ expectedStepId: null }),
    getActivities: () => [],
    getScreens: () => [],
    getCanvasLock: () => ({ width: 640, height: 400 }),
    settings: { scaleMode: 'scale', showScreens: false },
    stepEditor: {
      setActivity: () => {},
      rename: () => {},
      setScreens: () => {},
      replaceAll: () => {},
      setBehaviour: () => {},
      setRest: () => {},
      setMaxMatches: () => {},
      setCount: () => {},
      captureRegion: () => {},
      ...overrides,
    },
    dryRunner: { start: () => {}, stop: () => {} },
    refresh: () => {},
  });
  document.body.append(node);
  return node;
}

describe('a count step in the panel', () => {
  it('offers counting as a behaviour', () => {
    const options = [...render(createStep()).querySelectorAll('.bhb-step .bhb-rule__gate option')];
    expect(options.map((option) => option.value)).toContain('count');
  });

  it('reads the behaviour back as count', () => {
    const node = render(createStep({ kind: StepKind.COUNT }));
    expect(node.querySelector('.bhb-step .bhb-rule__gate').value).toBe('count');
  });

  it('shows the target and the cap instead of the rest seconds', () => {
    const step = createStep({ kind: StepKind.COUNT, countTo: 7, countCap: 120 });
    const node = render(step);
    const numbers = [...node.querySelectorAll('.bhb-rest')].map((input) => input.value);
    expect(numbers).toContain('7');
    expect(numbers).toContain('120');
  });

  it('writes the target back through the editor', () => {
    const step = createStep({ kind: StepKind.COUNT, countTo: 7 });
    const setCount = vi.fn();
    const node = render(step, { setCount });
    const target = [...node.querySelectorAll('.bhb-rest')][0];
    target.value = '9';
    target.dispatchEvent(new Event('change', { bubbles: true }));
    expect(setCount).toHaveBeenCalledWith(step.id, { countTo: '9' });
  });

  it('gives a count step a button to draw its box', () => {
    const node = render(createStep({ kind: StepKind.COUNT }));
    expect(node.querySelector('.bhb-step__region')).not.toBeNull();
  });

  it('gives a click step no such button', () => {
    const node = render(createStep());
    expect(node.querySelector('.bhb-step__region')).toBeNull();
  });
});
