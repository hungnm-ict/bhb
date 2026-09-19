/**
 * "no match" on its own cannot tell a step aimed at the wrong place from one
 * whose colour drifted a shade, and the shade is the usual culprit.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';

let frame = { r: 0, g: 0, b: 0 };

vi.mock('../src/core/input.js', () => ({
  clickBufferPoint: () => true,
  setClickObserver: () => {},
}));

vi.mock('../src/core/canvas.js', () => ({
  getRenderTarget: () => ({
    canvas: { width: 800, height: 600 },
    gl: {
      RGBA: 0,
      UNSIGNED_BYTE: 0,
      readPixels: (x, y, w, h, _f, _t, out) => {
        for (let i = 0; i < w * h; i += 1) {
          out[i * 4] = frame.r;
          out[i * 4 + 1] = frame.g;
          out[i * 4 + 2] = frame.b;
          out[i * 4 + 3] = 255;
        }
      },
    },
  }),
  getCanvas: () => ({ width: 800, height: 600 }),
  installCanvasPatch: () => {},
}));

const { createEngine, TaskId } = await import('../src/core/engine.js');
const { createStep } = await import('../src/bot/step.js');

function engineWith(step) {
  return createEngine({ getScriptSteps: () => [step], getScaleMode: () => 'scale' });
}

const step = createStep({
  label: 'Town',
  hex: '#40a0c0',
  points: [{ x: 10, y: 10, bw: 800, bh: 600 }],
  tolerance: 5,
});

describe('a near miss', () => {
  it('names the step and how far its colour drifted', () => {
    const engine = engineWith(step);
    frame = { r: 0x40, g: 0x8a, b: 0xc0 }; // green channel is 22 off

    engine.start(TaskId.SCRIPT);
    engine.tick();

    expect(engine.getState().lastMessage).toBe('script: no match — Town off by 22 (#408ac0)');
    engine.stop();
  });

  it('says plain "no match" when no step could even be read', () => {
    const engine = createEngine({ getScriptSteps: () => [], getScaleMode: () => 'scale' });

    engine.start(TaskId.SCRIPT);
    engine.tick();

    expect(engine.getState().lastMessage).toBe('script: no match');
    engine.stop();
  });
});
