/**
 * A dry run's verdict says a step missed; the drift beside it says whether the
 * colour was a shade off or the point is somewhere else entirely.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { scoreStepDetail } from '../src/bot/dry-run.js';
import { createStep } from '../src/bot/step.js';

function glReading({ r, g, b }) {
  return {
    RGBA: 0,
    UNSIGNED_BYTE: 0,
    readPixels: (x, y, w, h, _f, _t, out) => {
      for (let i = 0; i < w * h; i += 1) {
        out[i * 4] = r;
        out[i * 4 + 1] = g;
        out[i * 4 + 2] = b;
        out[i * 4 + 3] = 255;
      }
    },
  };
}

const buffer = { width: 800, height: 600 };
const step = createStep({
  label: 'Town',
  hex: '#40a0c0',
  points: [{ x: 10, y: 10, bw: 800, bh: 600 }],
  tolerance: 5,
});

describe('a dry run miss', () => {
  it('carries how far the closest colour was, and what was read', () => {
    const score = scoreStepDetail(step, glReading({ r: 0x40, g: 0x8a, b: 0xc0 }), buffer, 'scale', null);

    expect(score).toEqual({ verdict: 'miss', drift: 22, seen: '#408ac0' });
  });

  it('carries nothing extra when the step matched', () => {
    const score = scoreStepDetail(step, glReading({ r: 0x40, g: 0xa0, b: 0xc0 }), buffer, 'scale', null);

    expect(score).toEqual({ verdict: 'match' });
  });
});
