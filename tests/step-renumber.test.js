/**
 * Auto-given names follow their position.
 *
 * A name is only a label, and one that says 11 beside a row that says 1 is
 * worse than no name. Names the user typed are theirs and are never touched.
 */
import { describe, it, expect } from 'vitest';
import { renumberAutoLabels } from '../src/bot/step.js';
import { createStep } from '../src/bot/step.js';

describe('renumberAutoLabels', () => {
  it('numbers each activity from one', () => {
    const steps = [
      createStep({ label: 'Step 11', activity: 'invasion' }),
      createStep({ label: 'Step 12', activity: 'invasion' }),
      createStep({ label: 'Step 4', activity: 'pvp' }),
      createStep({ label: 'Step 13', activity: 'invasion' }),
    ];

    renumberAutoLabels(steps);

    expect(steps.map((step) => step.label)).toEqual(['Step 1', 'Step 2', 'Step 1', 'Step 3']);
  });

  it('recognises the Vietnamese form too', () => {
    const steps = [
      createStep({ label: 'Bước 9', activity: 'raid' }),
      createStep({ label: 'Bước 3', activity: 'raid' }),
    ];

    renumberAutoLabels(steps);

    expect(steps.map((step) => step.label)).toEqual(['Bước 1', 'Bước 2']);
  });

  it('leaves a name the user wrote alone, and does not count it out of the numbering', () => {
    const steps = [
      createStep({ label: 'Step 5', activity: 'invasion' }),
      createStep({ label: 'click PLAY', activity: 'invasion' }),
      createStep({ label: 'Step 7', activity: 'invasion' }),
    ];

    renumberAutoLabels(steps);

    expect(steps.map((step) => step.label)).toEqual(['Step 1', 'click PLAY', 'Step 3']);
  });

  it('numbers the loose set on its own', () => {
    const steps = [
      createStep({ label: 'Step 8', activity: null }),
      createStep({ label: 'Step 2', activity: 'pvp' }),
      createStep({ label: 'Step 9', activity: null }),
    ];

    renumberAutoLabels(steps);

    expect(steps.map((step) => step.label)).toEqual(['Step 1', 'Step 1', 'Step 2']);
  });

  it('says whether it changed anything, so a load need not write for nothing', () => {
    const settled = [createStep({ label: 'Step 1', activity: 'pvp' })];
    expect(renumberAutoLabels(settled)).toBe(false);

    const stale = [createStep({ label: 'Step 9', activity: 'pvp' })];
    expect(renumberAutoLabels(stale)).toBe(true);
  });
});
