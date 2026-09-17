/**
 * The probe table is the whole point of the feature: it is what someone stares
 * at right after changing the game's resolution. What is pinned here is that it
 * shows both halves of the verdict — where the point moved to, and how far its
 * colour drifted — and that a probe whose pixel could not be read is reported
 * as unknown rather than as wrong.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderProbeSection } from '../src/ui/panel/probes.js';
import { createUiStore } from '../src/ui/store.js';
import { createProbe, scoreProbe } from '../src/core/probe.js';

const PROBE = createProbe({ x: 320, y: 200, bw: 640, bh: 400, hex: '#3a7fd5', label: 'Probe 1' });

function build(live, buffer = { width: 480, height: 320 }) {
  const store = createUiStore();
  const deps = {
    store,
    getProbes: () => [PROBE],
    probeEditor: {
      scoreAll: () => ({ buffer, scores: [scoreProbe(PROBE, buffer, live, 10)] }),
      clear: () => {},
      remove: () => {},
    },
    refresh: () => {},
  };

  const toggleRow = (labelKey) => {
    const row = document.createElement('div');
    row.className = 'bhb-task';
    row.textContent = labelKey;
    return row;
  };

  return { store, node: renderProbeSection(deps, toggleRow) };
}

const text = (node) => node.textContent;

describe('probe section', () => {
  it('shows the scaled position under the new framebuffer', () => {
    const { node } = build({ r: 0x3b, g: 0x7e, b: 0xd2 });
    expect(node.querySelector('.bhb-probe-row__pos').textContent).toBe('240, 160');
  });

  it('shows the size the probe was captured at, beside where it went', () => {
    const { node } = build({ r: 0x3b, g: 0x7e, b: 0xd2 });
    expect(node.querySelector('.bhb-probe-row__size').textContent).toBe('640×400');
  });

  it('calls a small colour drift a match', () => {
    const { node } = build({ r: 0x3b, g: 0x7e, b: 0xd2 });
    const delta = node.querySelector('.bhb-probe-row__delta');
    expect(delta.textContent).toContain('3');
    expect(delta.classList.contains('is-match')).toBe(true);
  });

  it('calls a large colour drift a miss', () => {
    const { node } = build({ r: 0x10, g: 0x10, b: 0x10 });
    expect(node.querySelector('.bhb-probe-row__delta').classList.contains('is-miss')).toBe(true);
  });

  it('reports an unreadable pixel as unknown, not as wrong', () => {
    const { node } = build(null);
    expect(node.querySelector('.bhb-probe-row__delta')).toBe(null);
    expect(text(node)).toContain('không đọc được');
  });

  it('warns once when the aspect ratio no longer matches the capture', () => {
    const { node } = build(null);
    expect(node.querySelectorAll('.bhb-note--warn')).toHaveLength(1);
    expect(text(node)).toContain('1.60');
    expect(text(node)).toContain('1.50');
  });

  it('stays quiet when only the size changed', () => {
    const { node } = build(null, { width: 1280, height: 800 });
    expect(node.querySelectorAll('.bhb-note--warn')).toHaveLength(0);
  });

  it('arms the capture key and steps out of the way when a probe is asked for', () => {
    const { store, node } = build(null);
    node.querySelector('.bhb-btn').click();

    const state = store.get();
    expect(state.isAwaitingProbe).toBe(true);
    expect(state.isCaptureArmed).toBe(true);
    expect(state.panelOpen).toBe(false);
    expect(store.probesVisible()).toBe(true);
  });
});
