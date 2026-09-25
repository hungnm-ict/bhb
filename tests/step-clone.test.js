/**
 * Copying one activity's steps into another.
 *
 * Raid is Dungeon with different buttons, and rebuilding a sequence that is
 * nine tenths the same is nine tenths wasted. Moving them was already
 * possible; moving them emptied the activity they came from.
 */
import { describe, it, expect } from 'vitest';
import { cloneStepsInto } from '../src/bot/step-pack.js';
import { createStep } from '../src/bot/step.js';

function dungeonSet() {
  return [
    createStep({ label: 'enter', activity: 'dungeon', hex: '#ff0000', points: [{ x: 1, y: 2 }] }),
    createStep({ label: 'start', activity: 'dungeon', hex: '#00ff00', points: [{ x: 3, y: 4 }] }),
    createStep({ label: 'pvp one', activity: 'pvp', hex: '#0000ff', points: [{ x: 5, y: 6 }] }),
  ];
}

describe('cloneStepsInto', () => {
  it('leaves the steps it copied exactly where they were', () => {
    const steps = dungeonSet();
    const source = steps.filter((step) => step.activity === 'dungeon');

    const next = cloneStepsInto(steps, source, 'raid');

    expect(next.filter((step) => step.activity === 'dungeon')).toHaveLength(2);
  });

  it('puts a copy under the new activity, colours and places intact', () => {
    const steps = dungeonSet();
    const source = steps.filter((step) => step.activity === 'dungeon');

    const next = cloneStepsInto(steps, source, 'raid');
    const raid = next.filter((step) => step.activity === 'raid');

    expect(raid.map((step) => step.label)).toEqual(['enter', 'start']);
    expect(raid[0].hex).toBe('#ff0000');
    expect(raid[0].points).toEqual([{ x: 1, y: 2 }]);
  });

  it('gives every copy an id of its own', () => {
    const steps = dungeonSet();
    const source = steps.filter((step) => step.activity === 'dungeon');

    const next = cloneStepsInto(steps, source, 'raid');
    const ids = next.map((step) => step.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('does not deepen a copy made twice', () => {
    const steps = dungeonSet();
    const source = steps.filter((step) => step.activity === 'dungeon');

    const once = cloneStepsInto(steps, source, 'raid');
    const twice = cloneStepsInto(once, source, 'raid');

    expect(twice.filter((step) => step.activity === 'raid')).toHaveLength(2);
  });

  it('touches nothing belonging to a third activity', () => {
    const steps = dungeonSet();
    const source = steps.filter((step) => step.activity === 'dungeon');

    const next = cloneStepsInto(steps, source, 'raid');

    expect(next.filter((step) => step.activity === 'pvp')).toHaveLength(1);
  });

  it('refuses to copy an activity onto itself', () => {
    const steps = dungeonSet();
    const source = steps.filter((step) => step.activity === 'dungeon');

    expect(cloneStepsInto(steps, source, 'dungeon')).toBe(steps);
  });

  it('copies the loose set too, when that is what is shown', () => {
    const steps = [createStep({ label: 'loose', activity: null, hex: '#fff' })];

    const next = cloneStepsInto(steps, steps, 'raid');

    expect(next).toHaveLength(2);
    expect(next[1].activity).toBe('raid');
  });
});
