/**
 * Carrying a set of steps to another window.
 *
 * Each instance is its own browser profile, so there is no shared storage:
 * moving a Dungeon combo across means text out of one and into the other. The
 * whole-profile export already existed and was no use for this — importing it
 * replaced every profile on the far side.
 */
import { describe, it, expect } from 'vitest';
import { exportSteps, importSteps, mergeSteps } from '../src/bot/step-pack.js';
import { createStep } from '../src/bot/step.js';

const LOCK = { width: 640, height: 400 };

function step(label, activity, overrides = {}) {
  return createStep({
    label,
    activity,
    hex: '#ff0000',
    points: [{ x: 10, y: 20, bw: 640, bh: 400 }],
    ...overrides,
  });
}

describe('exportSteps', () => {
  it('writes the steps it was given, and says what it is', () => {
    const pack = JSON.parse(exportSteps([step('one', 'dungeon')], LOCK));
    expect(pack.kind).toBe('bhb.steps');
    expect(pack.steps).toHaveLength(1);
    expect(pack.steps[0].label).toBe('one');
  });

  it('records the canvas it was captured on', () => {
    const pack = JSON.parse(exportSteps([step('one', 'dungeon')], LOCK));
    expect(pack.lock).toEqual(LOCK);
  });

  it('is happy with no lock, which is what an unpinned canvas gives', () => {
    const pack = JSON.parse(exportSteps([step('one', 'dungeon')], null));
    expect(pack.lock).toBeNull();
  });
});

describe('importSteps', () => {
  it('reads back what export wrote', () => {
    const read = importSteps(exportSteps([step('one', 'dungeon')], LOCK));
    expect(read.steps[0].label).toBe('one');
    expect(read.lock).toEqual(LOCK);
  });

  it('refuses text that is not a step pack', () => {
    expect(() => importSteps('{"hello":1}')).toThrow(/not a BHB step/i);
    expect(() => importSteps('nonsense')).toThrow();
  });

  it('refuses a whole-profile export, which would look close enough to try', () => {
    const profileish = JSON.stringify({ version: 6, profiles: [{ id: 'p', steps: [] }] });
    expect(() => importSteps(profileish)).toThrow(/not a BHB step/i);
  });

  it('gives every step a new id, so two windows never share one', () => {
    const original = step('one', 'dungeon');
    const read = importSteps(exportSteps([original], LOCK));
    expect(read.steps[0].id).not.toBe(original.id);
  });
});

describe('mergeSteps', () => {
  it('replaces the activities the pack carries and leaves the rest alone', () => {
    const existing = [step('old dungeon', 'dungeon'), step('my pvp', 'pvp')];
    const incoming = [step('new dungeon a', 'dungeon'), step('new dungeon b', 'dungeon')];

    const merged = mergeSteps(existing, incoming);

    expect(merged.filter((one) => one.activity === 'pvp').map((one) => one.label)).toEqual([
      'my pvp',
    ]);
    expect(merged.filter((one) => one.activity === 'dungeon').map((one) => one.label)).toEqual([
      'new dungeon a',
      'new dungeon b',
    ]);
  });

  it('is repeatable: importing the same pack twice leaves one copy', () => {
    const incoming = [step('a', 'dungeon'), step('b', 'dungeon')];
    const once = mergeSteps([], incoming);
    const twice = mergeSteps(once, incoming);

    expect(twice).toHaveLength(2);
  });

  it('treats the custom set as an activity of its own', () => {
    const existing = [step('loose one', null), step('keep me', 'raid')];
    const incoming = [step('loose two', null)];

    const merged = mergeSteps(existing, incoming);

    expect(merged.map((one) => one.label)).toEqual(['keep me', 'loose two']);
  });

  it('adds an activity the target had nothing for', () => {
    const merged = mergeSteps([step('mine', 'pvp')], [step('theirs', 'dungeon')]);
    expect(merged.map((one) => one.label)).toEqual(['mine', 'theirs']);
  });

  it('keeps every step distinct once merged', () => {
    const merged = mergeSteps([step('mine', 'pvp')], [step('theirs', 'dungeon')]);
    expect(new Set(merged.map((one) => one.id)).size).toBe(merged.length);
  });
});
