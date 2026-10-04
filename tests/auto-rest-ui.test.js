/**
 * The two toggles next to a step's rest-seconds input: on/off state
 * reflects the step, and clicking calls the editor the same way every
 * other icon toggle in this tab already does.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { renderStepsTab } from '../src/ui/panel/steps.js';
import { createUiStore } from '../src/ui/store.js';
import { createStep } from '../src/bot/step.js';

function renderInto(step, stepEditorOverrides = {}) {
  document.body.replaceChildren();
  const node = renderStepsTab({
    store: createUiStore(),
    getSteps: () => [step],
    getEngineState: () => ({ expectedStepId: null }),
    getActivities: () => [],
    getScreens: () => [],
    getCanvasLock: () => ({ width: 640, height: 400 }),
    settings: { scaleMode: 'scale', showScreens: false },
    stepEditor: {
      setRestAuto: vi.fn(),
      setEndsTimer: vi.fn(),
      setRestAutoBlind: vi.fn(),
      ...stepEditorOverrides,
    },
    dryRunner: { start: () => {}, stop: () => {} },
    refresh: () => {},
  });
  document.body.append(node);
  return node;
}

function findByGlyph(root, glyph) {
  return [...root.querySelectorAll('button')].find((button) => button.textContent === glyph);
}

describe('the restAuto / endsTimer toggles', () => {
  it('show off by default on a plain click step', () => {
    const step = createStep({ id: 'a', label: 'Start' });
    const tab = renderInto(step);

    expect(findByGlyph(tab, '⏱').classList.contains('is-on')).toBe(false);
    expect(findByGlyph(tab, '⏹').classList.contains('is-on')).toBe(false);
  });

  it('shows on when the step already has restAuto', () => {
    const step = createStep({ id: 'a', label: 'Start', restAuto: true });
    const tab = renderInto(step);

    expect(findByGlyph(tab, '⏱').classList.contains('is-on')).toBe(true);
  });

  it('shows on when the step already has endsTimer', () => {
    const step = createStep({ id: 'a', label: 'Claim', endsTimer: true });
    const tab = renderInto(step);

    expect(findByGlyph(tab, '⏹').classList.contains('is-on')).toBe(true);
  });

  it('calls setRestAuto with the flipped value on click', () => {
    const step = createStep({ id: 'a', label: 'Start', restAuto: false });
    const setRestAuto = vi.fn();
    const tab = renderInto(step, { setRestAuto });

    findByGlyph(tab, '⏱').click();

    expect(setRestAuto).toHaveBeenCalledWith('a', true);
  });

  it('calls setEndsTimer with the flipped value on click', () => {
    const step = createStep({ id: 'a', label: 'Claim', endsTimer: false });
    const setEndsTimer = vi.fn();
    const tab = renderInto(step, { setEndsTimer });

    findByGlyph(tab, '⏹').click();

    expect(setEndsTimer).toHaveBeenCalledWith('a', true);
  });

  it('shows no blind-rest toggle until restAuto is on', () => {
    const step = createStep({ id: 'a', label: 'Start', restAuto: false });
    const tab = renderInto(step);

    expect(findByGlyph(tab, '⏸')).toBeUndefined();
  });

  it('shows the blind-rest toggle once restAuto is on, off by default', () => {
    const step = createStep({ id: 'a', label: 'Start', restAuto: true });
    const tab = renderInto(step);

    expect(findByGlyph(tab, '⏸').classList.contains('is-on')).toBe(false);
  });

  it('shows the blind-rest toggle on when the step already has it', () => {
    const step = createStep({ id: 'a', label: 'Start', restAuto: true, restAutoBlind: true });
    const tab = renderInto(step);

    expect(findByGlyph(tab, '⏸').classList.contains('is-on')).toBe(true);
  });

  it('calls setRestAutoBlind with the flipped value on click', () => {
    const step = createStep({ id: 'a', label: 'Start', restAuto: true, restAutoBlind: false });
    const setRestAutoBlind = vi.fn();
    const tab = renderInto(step, { setRestAutoBlind });

    findByGlyph(tab, '⏸').click();

    expect(setRestAutoBlind).toHaveBeenCalledWith('a', true);
  });
});
