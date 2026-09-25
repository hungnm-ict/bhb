/**
 * A step that changes the game's speed as it fires.
 * @vitest-environment jsdom
 *
 * A battle is worth running at 15x and the buttons around it are not: at
 * speed the quit sequence is three clicks into a game that has already moved
 * on. The step that leaves the battle turns the speed down with it.
 */
import { describe, it, expect } from 'vitest';
import { createStep, speedForStep } from '../src/bot/step.js';

describe('speedForStep', () => {
  it('is nothing at all by default, so no step touches the speed', () => {
    expect(createStep().speedTo).toBe(0);
    expect(speedForStep(createStep())).toBe(null);
  });

  it('reads a speed a step was given', () => {
    expect(speedForStep(createStep({ speedTo: 1 }))).toBe(1);
    expect(speedForStep(createStep({ speedTo: 10 }))).toBe(10);
  });

  it('passes an odd number through for the caller to snap', () => {
    expect(speedForStep(createStep({ speedTo: 7 }))).toBe(7);
  });

  it('reads nonsense as no change', () => {
    expect(speedForStep(createStep({ speedTo: -3 }))).toBe(null);
    expect(speedForStep(createStep({ speedTo: 'fast' }))).toBe(null);
  });

  it('reads a missing field as no change, for a step stored before this', () => {
    const old = createStep();
    delete old.speedTo;
    expect(speedForStep(old)).toBe(null);
  });
});

describe('the speed field in the panel', () => {
  it('is blank when the step asks for nothing, and writes back what is typed', async () => {
    const { createStepEditor } = await import('../src/bot/step-editor.js');
    const step = createStep();
    const steps = [step];
    const editor = createStepEditor({
      getSteps: () => steps,
      persist: () => {},
      report: () => {},
      getScaleMode: () => 'scale',
    });

    editor.setSpeedTo(step.id, '1');
    expect(step.speedTo).toBe(1);

    editor.setSpeedTo(step.id, '');
    expect(step.speedTo, 'blank is no change, not zero speed').toBe(0);

    editor.setSpeedTo(step.id, 999);
    expect(step.speedTo).toBe(30);
  });
});

describe('the behaviour names', () => {
  it('tell each other apart before a narrow select clips them', async () => {
    const { t, setLanguage } = await import('../src/i18n/index.js');
    for (const language of ['en', 'vi']) {
      setLanguage(language);
      const shown = ['steps.kindClick', 'steps.kindOptional', 'steps.kindWait', 'steps.kindCount', 'steps.kindSpent']
        .map((key) => t(key).slice(0, 14));
      expect(new Set(shown).size, `${language}: two behaviours read the same`).toBe(shown.length);
    }
    setLanguage('vi');
  });
});
