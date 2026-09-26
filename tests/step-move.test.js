/**
 * Moving a step within the list that is on screen.
 * @vitest-environment jsdom
 *
 * The table is filtered and the store is not: swapping by one in the whole
 * list swaps with a step from another activity that is not being shown, and
 * the visible order does not change at all.
 */
import { describe, it, expect } from 'vitest';
import { createStepEditor } from '../src/bot/step-editor.js';
import { createStep } from '../src/bot/step.js';

function profile() {
  return [
    createStep({ label: 'dun A', activity: 'dungeon' }),
    createStep({ label: 'inv X', activity: 'invasion' }),
    createStep({ label: 'dun B', activity: 'dungeon' }),
    createStep({ label: 'inv Y', activity: 'invasion' }),
    createStep({ label: 'dun C', activity: 'dungeon' }),
  ];
}

function editorFor(steps) {
  return createStepEditor({
    getSteps: () => steps,
    persist: () => {},
    report: () => {},
    getScaleMode: () => 'scale',
  });
}

const shownDungeon = (steps) => steps.filter((s) => s.activity === 'dungeon').map((s) => s.id);

describe('move', () => {
  it('swaps two steps that are next to each other on screen', () => {
    const steps = profile();
    const editor = editorFor(steps);
    const dungeon = steps.filter((s) => s.activity === 'dungeon');

    editor.move(dungeon[0].id, 1, shownDungeon(steps));

    expect(steps.filter((s) => s.activity === 'dungeon').map((s) => s.label)).toEqual([
      'dun B',
      'dun A',
      'dun C',
    ]);
  });

  it('leaves every other activity exactly where it was', () => {
    const steps = profile();
    const editor = editorFor(steps);
    const dungeon = steps.filter((s) => s.activity === 'dungeon');

    editor.move(dungeon[2].id, -1, shownDungeon(steps));

    expect(steps.filter((s) => s.activity === 'invasion').map((s) => s.label)).toEqual([
      'inv X',
      'inv Y',
    ]);
  });

  it('does nothing at the ends of the shown list', () => {
    const steps = profile();
    const before = steps.map((s) => s.label);
    const editor = editorFor(steps);
    const dungeon = steps.filter((s) => s.activity === 'dungeon');

    editor.move(dungeon[0].id, -1, shownDungeon(steps));
    editor.move(dungeon[2].id, 1, shownDungeon(steps));

    expect(steps.map((s) => s.label)).toEqual(before);
  });

  it('still moves through the whole list when nothing is filtered out', () => {
    const steps = profile();
    const editor = editorFor(steps);

    editor.move(steps[1].id, -1, steps.map((s) => s.id));

    expect(steps.map((s) => s.label)).toEqual(['inv X', 'dun A', 'dun B', 'inv Y', 'dun C']);
  });
});
