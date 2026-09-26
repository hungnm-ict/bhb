/**
 * Duplicating one step.
 *
 * Two buttons a few pixels apart on the same screen are one capture and a
 * nudge, not two captures.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { createStepEditor } from '../src/bot/step-editor.js';
import { createStep, StepKind } from '../src/bot/step.js';

function editorFor(steps) {
  return createStepEditor({
    getSteps: () => steps,
    persist: () => {},
    report: () => {},
    getScaleMode: () => 'scale',
  });
}

describe('duplicate', () => {
  it('puts the copy directly under the one it came from', () => {
    const steps = [
      createStep({ label: 'open', activity: 'dungeon' }),
      createStep({ label: 'close', activity: 'dungeon' }),
    ];
    const editor = editorFor(steps);

    editor.duplicate(steps[0].id);

    expect(steps).toHaveLength(3);
    expect(steps[2].label).toBe('close');
  });

  it('copies the colour, the places and the behaviour', () => {
    const steps = [
      createStep({
        label: 'count me',
        kind: StepKind.COUNT,
        countTo: 7,
        tolerance: 22,
        hex: '#ff0000',
        activity: 'invasion',
        screens: ['sc-locked'],
        points: [{ x: 5, y: 6, bw: 800, bh: 500 }],
      }),
    ];
    const editor = editorFor(steps);

    editor.duplicate(steps[0].id);
    const copy = steps[1];

    expect(copy.hex).toBe('#ff0000');
    expect(copy.tolerance).toBe(22);
    expect(copy.kind).toBe(StepKind.COUNT);
    expect(copy.countTo).toBe(7);
    expect(copy.activity).toBe('invasion');
    expect(copy.screens).toEqual(['sc-locked']);
    expect(copy.points).toEqual([{ x: 5, y: 6, bw: 800, bh: 500 }]);
  });

  it('gives the copy an id and places of its own', () => {
    const steps = [createStep({ label: 'one', points: [{ x: 1, y: 2 }] })];
    const editor = editorFor(steps);

    editor.duplicate(steps[0].id);

    expect(steps[1].id).not.toBe(steps[0].id);
    steps[1].points[0].x = 99;
    expect(steps[0].points[0].x, 'the original keeps its own places').toBe(1);
  });

  it('marks a name the user wrote as a copy, and renumbers one it did not', () => {
    const steps = [
      createStep({ label: 'Bước 1', activity: 'dungeon' }),
      createStep({ label: 'Tắt DM', activity: 'dungeon' }),
    ];
    const editor = editorFor(steps);

    editor.duplicate(steps[1].id);
    expect(steps[2].label).toBe('Tắt DM (2)');

    editor.duplicate(steps[0].id);
    expect(steps[1].label, 'an auto name follows its new position').toBe('Bước 2');
  });

  it('does nothing for a step that is not there', () => {
    const steps = [createStep({ label: 'one' })];
    const editor = editorFor(steps);

    editor.duplicate('missing');

    expect(steps).toHaveLength(1);
  });
});

describe('the duplicate button', () => {
  it('is on every row', async () => {
    const { renderStepsTab } = await import('../src/ui/panel/steps.js');
    const { createUiStore } = await import('../src/ui/store.js');

    document.body.replaceChildren();
    const steps = [createStep({ label: 'one', hex: '#f00', points: [{ x: 1, y: 2 }] })];
    const node = renderStepsTab({
      store: createUiStore(),
      getSteps: () => steps,
      getScreens: () => [],
      getEngineState: () => ({ expectedStepId: null, screen: null }),
      getActivities: () => [],
      getRunTarget: () => 'runAll',
      getCanvasLock: () => null,
      settings: { scaleMode: 'scale', showScreens: false },
      stepEditor: { duplicate: () => null },
      dryRunner: { start: () => {}, stop: () => {} },
      refresh: () => {},
    });
    document.body.append(node);

    expect(node.querySelector('.bhb-step__copy')).not.toBeNull();
  });
});
