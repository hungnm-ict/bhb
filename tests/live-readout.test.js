/**
 * The live read under a previewed step.
 *
 * A step that will not fire is silent in the same way whether it is pointed
 * at the wrong place or at the right one in the wrong shade, and those want
 * opposite fixes. This is the row saying which.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';

/** Every pixel of the fake canvas is this colour. */
let onScreen = { r: 255, g: 0, b: 0 };

vi.mock('../src/core/canvas.js', () => ({
  getRenderTarget: () => ({
    canvas: { width: 800, height: 500 },
    gl: {
      RGBA: 0,
      UNSIGNED_BYTE: 0,
      readPixels(_x, _y, w, h, _format, _type, out) {
        for (let index = 0; index < w * h; index += 1) {
          out[index * 4] = onScreen.r;
          out[index * 4 + 1] = onScreen.g;
          out[index * 4 + 2] = onScreen.b;
          out[index * 4 + 3] = 255;
        }
      },
    },
  }),
  getCanvas: () => ({ width: 800, height: 500 }),
  installCanvasPatch: () => {},
}));

const { renderStepsTab } = await import('../src/ui/panel/steps.js');
const { createUiStore } = await import('../src/ui/store.js');
const { createStep } = await import('../src/bot/step.js');

function render(step, store) {
  document.body.replaceChildren();
  const node = renderStepsTab({
    store,
    getSteps: () => [step],
    getEngineState: () => ({ expectedStepId: null, screen: null }),
    getActivities: () => [],
    getScreens: () => [],
    getCanvasLock: () => ({ width: 800, height: 500 }),
    settings: { scaleMode: 'scale', showScreens: false },
    stepEditor: {
      setActivity: () => {},
      rename: () => {},
      setScreens: () => {},
      replaceAll: () => {},
      setBehaviour: () => {},
      setRest: () => {},
      setMaxMatches: () => {},
      setCount: () => {},
      captureRegion: () => {},
    },
    dryRunner: { start: () => {}, stop: () => {} },
    refresh: () => {},
  });
  document.body.append(node);
  return node;
}

function redStep() {
  return createStep({
    label: 'auto',
    hex: '#ff0000',
    tolerance: 10,
    points: [{ x: 400, y: 250, bw: 800, bh: 500 }],
  });
}

describe('the live read', () => {
  it('stays out of the way until the step is previewed', () => {
    const store = createUiStore();
    const node = render(redStep(), store);
    expect(node.querySelector('.bhb-live')).toBeNull();
  });

  it('says it matches when the colour is there', () => {
    onScreen = { r: 255, g: 0, b: 0 };
    const store = createUiStore();
    const step = redStep();
    store.previewStep(step.id);
    const node = render(step, store);

    const verdict = node.querySelector('.bhb-live__verdict');
    expect(verdict.className).toContain('is-match');
  });

  it('shows what is there instead, and how far off it is', () => {
    // The shade the bot is actually looking at, well outside the tolerance.
    onScreen = { r: 120, g: 0, b: 0 };
    const store = createUiStore();
    const step = redStep();
    store.previewStep(step.id);
    const node = render(step, store);

    expect(node.querySelector('.bhb-live__verdict').className).toContain('is-miss');
    const drift = node.querySelector('.bhb-live__drift').textContent;
    expect(drift).toContain('#780000');
    expect(drift).toContain('135');
  });
});
