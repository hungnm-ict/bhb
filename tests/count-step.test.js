/**
 * A count step watches one rectangle and lets the sequence through when it
 * has settled at a new picture often enough.
 */
import { describe, it, expect } from 'vitest';
import { createStep, isStepReady, StepKind } from '../src/bot/step.js';

const REGION_POINT = {
  x: 10,
  y: 10,
  w: 20,
  h: 8,
  bw: 800,
  bh: 500,
  samples: [{ dx: 0.5, dy: 0.5, hex: '#101010' }],
};

describe('a count step', () => {
  it('is its own kind', () => {
    expect(StepKind.COUNT).toBe('count');
  });

  it('starts with nothing to count and a cap', () => {
    const step = createStep();
    expect(step.countTo).toBe(0);
    expect(step.countCap).toBe(120);
  });

  it('is not ready until it has a region to watch', () => {
    const bare = createStep({
      kind: StepKind.COUNT,
      countTo: 7,
      hex: '#ffffff',
      points: [{ x: 1, y: 2 }],
    });
    expect(isStepReady(bare)).toBe(false);

    const watching = createStep({ kind: StepKind.COUNT, countTo: 7, points: [REGION_POINT] });
    expect(isStepReady(watching)).toBe(true);
  });
});
