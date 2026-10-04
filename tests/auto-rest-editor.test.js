/**
 * The editor's half of auto-rest: the two toggles stay mutually exclusive
 * within one activity by construction, a manual edit pins the number, and
 * the engine's own write-back only lands while a step is still auto.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStepEditor } from '../src/bot/step-editor.js';
import { createStep } from '../src/bot/step.js';

describe('setRestAuto', () => {
  let steps;
  let editor;

  beforeEach(() => {
    steps = [
      createStep({ id: 'a', activity: 'dungeon', label: 'Start' }),
      createStep({ id: 'b', activity: 'dungeon', label: 'Also start?' }),
      createStep({ id: 'c', activity: 'raid', label: 'Raid start' }),
    ];
    editor = createStepEditor({ getSteps: () => steps, persist: () => {}, report: () => {} });
  });

  it('turns itself on', () => {
    editor.setRestAuto('a', true);
    expect(steps[0].restAuto).toBe(true);
  });

  it('turns off every other step in the same activity', () => {
    steps[1].restAuto = true;
    editor.setRestAuto('a', true);
    expect(steps[0].restAuto).toBe(true);
    expect(steps[1].restAuto).toBe(false);
  });

  it('leaves a different activity alone', () => {
    steps[2].restAuto = true;
    editor.setRestAuto('a', true);
    expect(steps[2].restAuto).toBe(true);
  });

  it('resets the learned average when turned back on', () => {
    steps[0].restObserved = 42;
    editor.setRestAuto('a', true);
    expect(steps[0].restObserved).toBe(0);
  });

  it('does not touch restObserved when turned off', () => {
    steps[0].restAuto = true;
    steps[0].restObserved = 42;
    editor.setRestAuto('a', false);
    expect(steps[0].restAuto).toBe(false);
    expect(steps[0].restObserved).toBe(42);
  });
});

describe('setEndsTimer', () => {
  it('is exclusive within an activity, the same way setRestAuto is', () => {
    const steps = [
      createStep({ id: 'a', activity: 'dungeon' }),
      createStep({ id: 'b', activity: 'dungeon', endsTimer: true }),
    ];
    const editor = createStepEditor({ getSteps: () => steps, persist: () => {}, report: () => {} });

    editor.setEndsTimer('a', true);
    expect(steps[0].endsTimer).toBe(true);
    expect(steps[1].endsTimer).toBe(false);
  });

  it('groups the loose Script set under null, same as every other activity', () => {
    const steps = [
      createStep({ id: 'a', activity: null, endsTimer: true }),
      createStep({ id: 'b', activity: null }),
      createStep({ id: 'c', activity: 'dungeon', endsTimer: true }),
    ];
    const editor = createStepEditor({ getSteps: () => steps, persist: () => {}, report: () => {} });

    editor.setEndsTimer('b', true);
    expect(steps[0].endsTimer).toBe(false);
    expect(steps[1].endsTimer).toBe(true);
    expect(steps[2].endsTimer, 'a different activity is untouched').toBe(true);
  });
});

describe('setRest pins the number', () => {
  it('turns restAuto off when the user types a value by hand', () => {
    const steps = [createStep({ id: 'a', restAuto: true, restObserved: 42 })];
    const editor = createStepEditor({ getSteps: () => steps, persist: () => {}, report: () => {} });

    editor.setRest('a', 20);

    expect(steps[0].restSec).toBe(20);
    expect(steps[0].restAuto).toBe(false);
  });
});

describe('recordAutoRest', () => {
  it('writes the measurement through while the step is still auto', () => {
    const steps = [createStep({ id: 'a', restAuto: true })];
    const persist = vi.fn();
    const editor = createStepEditor({ getSteps: () => steps, persist, report: () => {} });

    editor.recordAutoRest('a', { restSec: 46, restObserved: 40, restSpeedTo: 0 });

    expect(steps[0]).toMatchObject({ restSec: 46, restObserved: 40, restSpeedTo: 0 });
    expect(persist).toHaveBeenCalled();
  });

  it('is a no-op if the step turned auto off before the measurement landed', () => {
    const steps = [createStep({ id: 'a', restAuto: false, restSec: 99 })];
    const editor = createStepEditor({ getSteps: () => steps, persist: () => {}, report: () => {} });

    editor.recordAutoRest('a', { restSec: 46, restObserved: 40, restSpeedTo: 0 });

    expect(steps[0].restSec).toBe(99);
  });

  it('is a no-op for an id that no longer exists', () => {
    const steps = [createStep({ id: 'a', restAuto: true })];
    const editor = createStepEditor({ getSteps: () => steps, persist: () => {}, report: () => {} });

    expect(() =>
      editor.recordAutoRest('gone', { restSec: 1, restObserved: 1, restSpeedTo: 0 })
    ).not.toThrow();
  });
});

describe('setRestAutoBlind', () => {
  it('turns on without touching any other step', () => {
    const steps = [
      createStep({ id: 'a', activity: 'dungeon', restAuto: true }),
      createStep({ id: 'b', activity: 'dungeon', restAuto: false }),
    ];
    const editor = createStepEditor({ getSteps: () => steps, persist: () => {}, report: () => {} });

    editor.setRestAutoBlind('a', true);

    expect(steps[0].restAutoBlind).toBe(true);
    expect(steps[1].restAutoBlind).toBe(false);
  });

  it('turns back off', () => {
    const steps = [createStep({ id: 'a', restAutoBlind: true })];
    const editor = createStepEditor({ getSteps: () => steps, persist: () => {}, report: () => {} });

    editor.setRestAutoBlind('a', false);

    expect(steps[0].restAutoBlind).toBe(false);
  });

  it('does nothing for a step that is not there', () => {
    const steps = [createStep({ id: 'a' })];
    const editor = createStepEditor({ getSteps: () => steps, persist: () => {}, report: () => {} });

    expect(() => editor.setRestAutoBlind('gone', true)).not.toThrow();
  });
});

describe('setActivity keeps one pair per activity', () => {
  it('clears restAuto on a step moved into a group that already has one', () => {
    const steps = [
      createStep({ id: 'a', activity: 'dungeon', restAuto: true, restObserved: 42 }),
      createStep({ id: 'b', activity: 'raid', restAuto: true, restObserved: 10 }),
    ];
    const editor = createStepEditor({ getSteps: () => steps, persist: () => {}, report: () => {} });

    editor.setActivity('b', 'dungeon');

    expect(steps[0].restAuto, 'the step already there keeps its flag').toBe(true);
    expect(steps[1].restAuto, 'the moved step loses its own').toBe(false);
    expect(steps[1].restObserved).toBe(0);
  });

  it('clears endsTimer the same way', () => {
    const steps = [
      createStep({ id: 'a', activity: 'dungeon', endsTimer: true }),
      createStep({ id: 'b', activity: 'raid', endsTimer: true }),
    ];
    const editor = createStepEditor({ getSteps: () => steps, persist: () => {}, report: () => {} });

    editor.setActivity('b', 'dungeon');

    expect(steps[0].endsTimer).toBe(true);
    expect(steps[1].endsTimer).toBe(false);
  });

  it('leaves the flag alone when the destination group has none yet', () => {
    const steps = [createStep({ id: 'a', activity: 'raid', restAuto: true, restObserved: 42 })];
    const editor = createStepEditor({ getSteps: () => steps, persist: () => {}, report: () => {} });

    editor.setActivity('a', 'dungeon');

    expect(steps[0].restAuto).toBe(true);
    expect(steps[0].restObserved).toBe(42);
  });
});
