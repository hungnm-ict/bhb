/**
 * A dry run answers "what would you do, and why not the rest" — so what is
 * pinned here is the verdict per step, and that nothing is ever clicked.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';

const clicks = [];
vi.mock('../src/core/input.js', () => ({
  clickBufferPoint: (...args) => {
    clicks.push(args);
    return true;
  },
  setClickObserver: () => {},
}));

const { scoreStep, scoreSteps } = await import('../src/bot/dry-run.js');
const { createStep } = await import('../src/bot/step.js');

const RED = { r: 255, g: 0, b: 0 };

/** A context whose every pixel is one flat colour. */
function glOf(color) {
  return {
    RGBA: 0,
    UNSIGNED_BYTE: 0,
    readPixels: (x, y, w, h, _format, _type, out) => {
      for (let i = 0; i < w * h; i += 1) {
        out[i * 4] = color.r;
        out[i * 4 + 1] = color.g;
        out[i * 4 + 2] = color.b;
        out[i * 4 + 3] = 255;
      }
    },
  };
}

const BUFFER = { width: 800, height: 600 };

function stepOf(overrides = {}) {
  return createStep({
    label: 'yes',
    hex: '#ff0000',
    tolerance: 0,
    points: [{ x: 400, y: 300, bw: 800, bh: 600 }],
    ...overrides,
  });
}

describe('scoring a step', () => {
  it('matches when the colour is there', () => {
    expect(scoreStep(stepOf(), glOf(RED), BUFFER, 'scale', null)).toBe('match');
  });

  it('misses when it is not', () => {
    expect(scoreStep(stepOf(), glOf({ r: 0, g: 0, b: 255 }), BUFFER, 'scale', null)).toBe('miss');
  });

  it('calls a step gated to another screen gated, not missed', () => {
    const gated = stepOf({ screens: ['loot'] });
    expect(scoreStep(gated, glOf(RED), BUFFER, 'scale', 'shop')).toBe('gated');
    expect(scoreStep(gated, glOf(RED), BUFFER, 'scale', 'loot')).toBe('match');
  });

  it('separates a disabled step from one that never got a colour', () => {
    expect(scoreStep(stepOf({ enabled: false }), glOf(RED), BUFFER, 'scale', null)).toBe('off');
    expect(scoreStep(stepOf({ hex: null }), glOf(RED), BUFFER, 'scale', null)).toBe('empty');
  });
});

describe('a wait step reads the other way round', () => {
  it('calls a present colour waiting, not matching', () => {
    const wait = { ...stepOf(), kind: 'wait' };
    expect(scoreStep(wait, glOf(RED), BUFFER, 'scale', null)).toBe('waiting');
  });

  it('calls an absent colour a match, because that is the gate opening', () => {
    const wait = { ...stepOf(), kind: 'wait' };
    expect(scoreStep(wait, glOf({ r: 0, g: 0, b: 255 }), BUFFER, 'scale', null)).toBe('match');
  });
});

describe('scoring a list', () => {
  it('returns a verdict per step, in order', () => {
    const steps = [stepOf({ label: 'a' }), stepOf({ label: 'b', hex: '#00ff00' })];
    const scores = scoreSteps(steps, { canvas: { width: 800, height: 600 }, gl: glOf(RED) }, 'scale', null);

    expect(scores.map((entry) => entry.verdict)).toEqual(['match', 'miss']);
    expect(scores[0].stepId).toBe(steps[0].id);
  });

  it('clicks nothing — that is the whole point of it', () => {
    scoreSteps([stepOf()], { canvas: { width: 800, height: 600 }, gl: glOf(RED) }, 'scale', null);
    expect(clicks).toHaveLength(0);
  });

  it('says nothing rather than guessing when there is no canvas', () => {
    expect(scoreSteps([stepOf()], null, 'scale', null)).toEqual([]);
  });
});
