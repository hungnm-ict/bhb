/**
 * Which activity the Steps tab opens on.
 *
 * A profile with twenty steps across eight activities opens on a list nobody
 * is working in. Until a filter has been chosen, the tab shows whatever the
 * Run tab is set to run — which is what the user came here to edit.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderStepsTab } from '../src/ui/panel/steps.js';
import { createUiStore } from '../src/ui/store.js';
import { createStep } from '../src/bot/step.js';

const ACTIVITIES = [
  { id: 'invasion', name: 'Invasion', enabled: true },
  { id: 'dungeon', name: 'Dungeon', enabled: true },
];

function build(runTarget, store = createUiStore()) {
  document.body.replaceChildren();
  const steps = [
    createStep({ label: 'inv one', activity: 'invasion', hex: '#ff0000', points: [{ x: 1, y: 2 }] }),
    createStep({ label: 'dun one', activity: 'dungeon', hex: '#00ff00', points: [{ x: 3, y: 4 }] }),
    createStep({ label: 'loose one', activity: null, hex: '#0000ff', points: [{ x: 5, y: 6 }] }),
  ];
  const node = renderStepsTab({
    store,
    getSteps: () => steps,
    getEngineState: () => ({ expectedStepId: null, screen: null }),
    getActivities: () => ACTIVITIES,
    getScreens: () => [],
    getRunTarget: () => runTarget,
    getCanvasLock: () => ({ width: 640, height: 400 }),
    settings: { scaleMode: 'scale', showScreens: false },
    stepEditor: {
      setActivity: () => {}, rename: () => {}, setScreens: () => {}, replaceAll: () => {},
      setBehaviour: () => {}, setRest: () => {}, setMaxMatches: () => {}, setCount: () => {},
      captureRegion: () => {},
    },
    dryRunner: { start: () => {}, stop: () => {} },
    refresh: () => {},
  });
  document.body.append(node);
  return { node, store };
}

function shownLabels(node) {
  return [...node.querySelectorAll('.bhb-rule__name')].map((input) => input.value);
}

describe('the Steps tab filter', () => {
  it('opens on the activity the Run tab would run', () => {
    const { node } = build('invasion');
    expect(node.querySelector('.bhb-field__head select').value).toBe('invasion');
    expect(shownLabels(node)).toEqual(['inv one']);
  });

  it('opens on the loose set when Run is set to the script', () => {
    const { node } = build('script');
    expect(shownLabels(node)).toEqual(['loose one']);
  });

  it('opens on everything when Run is set to the whole queue', () => {
    const { node } = build('runAll');
    expect(shownLabels(node)).toHaveLength(3);
  });

  it('stops following once a filter has been chosen, even back to everything', () => {
    const store = createUiStore();
    store.setRuleFilter(null);
    const { node } = build('invasion', store);
    expect(shownLabels(node), 'the choice wins over the run target').toHaveLength(3);
  });
});
