/**
 * Which activity a fresh capture lands in.
 *
 * The Steps tab follows the Run tab until a filter is chosen, and a capture
 * has to land where the tab says it will — anything else files the step
 * somewhere the user was not looking.
 */
import { describe, it, expect } from 'vitest';
import { resolveStepFilter } from '../src/ui/store.js';

const ACTIVITIES = [
  { id: 'invasion', name: 'Invasion', enabled: true },
  { id: 'dungeon', name: 'Dungeon', enabled: true },
];

describe('resolveStepFilter', () => {
  it('follows the run target while nothing has been chosen', () => {
    expect(resolveStepFilter(undefined, 'dungeon', ACTIVITIES)).toBe('dungeon');
  });

  it('reads the script as the loose set', () => {
    expect(resolveStepFilter(undefined, 'script', ACTIVITIES)).toBe('');
  });

  it('reads the whole queue as everything', () => {
    expect(resolveStepFilter(undefined, 'runAll', ACTIVITIES)).toBe(null);
  });

  it('falls back to everything for a run target that no longer exists', () => {
    expect(resolveStepFilter(undefined, 'deleted', ACTIVITIES)).toBe(null);
  });

  it('honours a chosen filter over the run target, including everything', () => {
    expect(resolveStepFilter('invasion', 'dungeon', ACTIVITIES)).toBe('invasion');
    expect(resolveStepFilter(null, 'dungeon', ACTIVITIES)).toBe(null);
    expect(resolveStepFilter('', 'dungeon', ACTIVITIES)).toBe('');
  });
});
