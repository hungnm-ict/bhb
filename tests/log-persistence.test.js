/**
 * The log outliving the page.
 *
 * The watchdog reloads exactly when somebody was about to read what happened.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';

describe('the log outliving a reload', () => {
  it('starts a store from entries a previous page left behind', async () => {
    const { createUiStore, LOG_LIMIT } = await import('../src/ui/store.js');
    const restored = [{ at: 1, kind: 'click', label: 'one' }];
    expect(createUiStore(restored).get().log).toEqual(restored);

    // However long the stored list was, the cap still holds.
    const huge = Array.from({ length: LOG_LIMIT + 50 }, (_, index) => ({
      at: index,
      kind: 'click',
      label: `n${index}`,
    }));
    expect(createUiStore(huge).get().log).toHaveLength(LOG_LIMIT);
  });

  it('starts empty when given nothing, or something that is not a list', async () => {
    const { createUiStore } = await import('../src/ui/store.js');
    expect(createUiStore().get().log).toEqual([]);
    expect(createUiStore('corrupt').get().log).toEqual([]);
  });

  it('is on by default', async () => {
    const { loadSettings } = await import('../src/core/storage.js');
    expect(loadSettings().keepLog).toBe(true);
  });
});
