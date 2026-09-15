import { describe, it, expect, vi } from 'vitest';
import { createUiStore, Tab, LOG_LIMIT } from '../src/ui/store.js';

describe('ui store', () => {
  it('starts closed on the tasks tab', () => {
    const store = createUiStore();
    expect(store.get().panelOpen).toBe(false);
    expect(store.get().tab).toBe(Tab.TASKS);
  });

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const store = createUiStore();
    const seen = vi.fn();
    const off = store.subscribe(seen);

    store.openPanel();
    expect(seen).toHaveBeenCalledTimes(1);

    off();
    store.closePanel();
    expect(seen).toHaveBeenCalledTimes(1);
  });

  it('does not notify when a setter changes nothing', () => {
    const store = createUiStore();
    store.openPanel();
    const seen = vi.fn();
    store.subscribe(seen);

    store.openPanel();
    expect(seen).not.toHaveBeenCalled();
  });

  it('caps the log and keeps the newest first', () => {
    const store = createUiStore();
    for (let i = 0; i < LOG_LIMIT + 50; i += 1) {
      store.log({ at: i, kind: 'click', label: `r${i}` });
    }

    const entries = store.get().log;
    expect(entries).toHaveLength(LOG_LIMIT);
    expect(entries[0].label).toBe(`r${LOG_LIMIT + 49}`);
  });

  it('clears the selection when the selected rule goes away', () => {
    const store = createUiStore();
    store.selectRule('abc');
    expect(store.get().selectedRuleId).toBe('abc');

    store.forgetRule('abc');
    expect(store.get().selectedRuleId).toBe(null);
  });

  it('only shows markers while the rules tab is open', () => {
    const store = createUiStore();
    expect(store.markersVisible()).toBe(false);

    store.openPanel();
    store.setTab(Tab.RULES);
    expect(store.markersVisible()).toBe(true);

    store.closePanel();
    expect(store.markersVisible()).toBe(false);
  });
});

describe('highlight is not a rebuild', () => {
  it('announces hover and selection separately from other changes', () => {
    const store = createUiStore();
    const changes = [];
    const highlights = [];
    store.subscribe(() => changes.push(1));
    store.onHighlight(() => highlights.push(1));

    store.hoverRule('r1');
    store.selectRule('r1');
    expect(highlights, 'hovering must not redraw the panel').toHaveLength(2);
    expect(changes).toHaveLength(0);

    store.setTab('rules');
    expect(changes, 'a tab change is a real change').toHaveLength(1);
  });

  it('says nothing at all when the value is unchanged', () => {
    const store = createUiStore();
    const highlights = [];
    store.onHighlight(() => highlights.push(1));

    store.hoverRule('r1');
    store.hoverRule('r1');
    expect(highlights).toHaveLength(1);
  });
});
