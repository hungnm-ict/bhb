/**
 * The transfer box fills itself.
 *
 * Pressing a button to put text in a box you then have to select by hand is
 * two chores for one intention. The box holds whatever the filter is showing,
 * ready to copy, and pasting into it imports on the spot.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderStepsTab } from '../src/ui/panel/steps.js';
import { createUiStore } from '../src/ui/store.js';
import { createStep } from '../src/bot/step.js';

const ACTIVITIES = [
  { id: 'raid', name: 'Raid', enabled: true },
  { id: 'dungeon', name: 'Dungeon', enabled: true },
];

function build(filter = null, steps = null) {
  const store = createUiStore();
  store.setRuleFilter(filter);

  const list =
    steps ||
    [
      createStep({ label: 'raid one', activity: 'raid', hex: '#ff0000', points: [{ x: 1, y: 2, bw: 640, bh: 400 }] }),
      createStep({ label: 'dun one', activity: 'dungeon', hex: '#00ff00', points: [{ x: 3, y: 4, bw: 640, bh: 400 }] }),
    ];

  const node = renderStepsTab({
    store,
    getSteps: () => list,
    getEngineState: () => ({ expectedStepId: null }),
    getActivities: () => ACTIVITIES,
    getScreens: () => [],
    getCanvasLock: () => ({ width: 640, height: 400 }),
    stepEditor: { setActivity: () => {}, rename: () => {}, setScreens: () => {}, replaceAll: () => {} },
    dryRunner: { start: () => {}, stop: () => {} },
    settings: { scaleMode: 'scale' },
    refresh: () => {},
  });

  return { node, box: node.querySelector('textarea') };
}

beforeEach(() => {
  document.body.replaceChildren();
});

describe('the transfer box', () => {
  it('already holds the pack when the tab opens', () => {
    const { box } = build('raid');
    const pack = JSON.parse(box.value);

    expect(pack.kind).toBe('bhb.steps');
    expect(pack.steps.map((one) => one.label)).toEqual(['raid one']);
  });

  it('holds everything when no activity is filtered', () => {
    const { box } = build(null);
    expect(JSON.parse(box.value).steps).toHaveLength(2);
  });

  it('carries the pinned size, so the far side can warn', () => {
    const { box } = build('raid');
    expect(JSON.parse(box.value).lock).toEqual({ width: 640, height: 400 });
  });

  it('follows the filter when it changes', () => {
    const first = build('raid');
    expect(JSON.parse(first.box.value).steps[0].label).toBe('raid one');

    const second = build('dungeon');
    expect(JSON.parse(second.box.value).steps[0].label).toBe('dun one');
  });

  it('leaves the box empty when the filter shows nothing', () => {
    const { box } = build('raid', []);
    expect(box.value).toBe('');
  });
});

describe('surviving the tick that rebuilds the tab', () => {
  it('keeps the same box across renders', () => {
    const first = build('raid');
    const second = build('raid');
    expect(second.box, 'a new box every tick is a box you cannot paste into').toBe(first.box);
  });

  it('does not overwrite what the user pasted', () => {
    // The bug this guards: the tab rebuilt every tick with a fresh textarea,
    // so a pasted pack was gone before the button could read it.
    const first = build('raid');
    first.box.value = '{"kind":"bhb.steps","version":1,"lock":null,"steps":[]}';

    build('raid');

    expect(first.box.value).toBe('{"kind":"bhb.steps","version":1,"lock":null,"steps":[]}');
  });

  it('refills once the user clears it again', () => {
    const first = build('raid');
    first.box.value = '';

    const second = build('raid');

    expect(JSON.parse(second.box.value).steps).toHaveLength(1);
  });
});
