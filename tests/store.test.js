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

  it('clears the selection when the selected step goes away', () => {
    const store = createUiStore();
    store.selectStep('abc');
    expect(store.get().selectedStepId).toBe('abc');

    store.forgetStep('abc');
    expect(store.get().selectedStepId).toBe(null);
  });

  it('shows no markers just for opening the steps tab', () => {
    const store = createUiStore();
    store.openPanel();
    store.setTab(Tab.STEPS);

    // Drawing all of them unasked buried the game under numbers.
    expect(store.markersVisible()).toBe(false);
  });

  it('shows one marker under the cursor, all of them when pinned', () => {
    const store = createUiStore();
    store.openPanel();
    store.setTab(Tab.STEPS);

    store.hoverStep('abc');
    expect(store.markersVisible()).toBe(true);
    expect(store.markerFilter(), 'only the hovered one').toBe('abc');

    store.hoverStep(null);
    expect(store.markersVisible()).toBe(false);

    store.pinMarkers(true);
    expect(store.markersVisible()).toBe(true);
    expect(store.markerFilter(), 'no filter means every marker').toBe(null);
  });

  it('shows every marker during a dry run, whatever the cursor is on', () => {
    const store = createUiStore();
    store.openPanel();
    store.setTab(Tab.STEPS);
    store.hoverStep('abc');

    store.setDryRun({ index: 0, scores: { abc: 'match' } });
    expect(store.markerFilter()).toBe(null);

    store.setDryRun(null);
    expect(store.markerFilter()).toBe('abc');
  });

  it('keeps markers off the game once the panel closes', () => {
    const store = createUiStore();
    store.openPanel();
    store.setTab(Tab.STEPS);
    store.pinMarkers(true);

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

    store.hoverStep('r1');
    store.selectStep('r1');
    expect(highlights, 'hovering must not redraw the panel').toHaveLength(2);
    expect(changes).toHaveLength(0);

    store.setTab('steps');
    expect(changes, 'a tab change is a real change').toHaveLength(1);
  });

  it('says nothing at all when the value is unchanged', () => {
    const store = createUiStore();
    const highlights = [];
    store.onHighlight(() => highlights.push(1));

    store.hoverStep('r1');
    store.hoverStep('r1');
    expect(highlights).toHaveLength(1);
  });
});

describe('capture arming', () => {
  it('starts disarmed, so a stray 0 cannot capture on a fresh load', () => {
    expect(createUiStore().get().isCaptureArmed).toBe(false);
  });

  it('arms and disarms, telling views to redraw', () => {
    const store = createUiStore();
    const seen = [];
    store.subscribe((state) => seen.push(state.isCaptureArmed));

    store.armCapture(true);
    expect(store.get().isCaptureArmed).toBe(true);

    store.armCapture(false);
    expect(store.get().isCaptureArmed).toBe(false);
    expect(seen).toEqual([true, false]);
  });
});

