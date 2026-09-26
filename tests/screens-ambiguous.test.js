/**
 * Two screens matching at once.
 *
 * The runner takes the first one that matches, so a step gated to the second
 * never comes up for its turn — and nothing anywhere says why. It is the same
 * silence as a step that is simply not its turn yet, which is the one thing it
 * must not be mistaken for.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderScreensTab } from '../src/ui/panel/screens.js';
import { createUiStore } from '../src/ui/store.js';

function build(matching) {
  document.body.replaceChildren();
  const screens = [
    { id: 'a', name: 'Hết resources', anchors: [{}], minRatio: 0.75, stopsTask: false },
    { id: 'b', name: 'Mua resource', anchors: [{}], minRatio: 0.75, stopsTask: false },
    { id: 'c', name: 'Hết energy', anchors: [{}], minRatio: 0.75, stopsTask: false },
  ];
  const node = renderScreensTab({
    store: createUiStore(),
    getScreens: () => screens,
    getEngineState: () => ({ screen: matching[0] || null, screenName: null }),
    screenEditor: {
      probe: (id) => ({ matched: matching.includes(id), ratio: matching.includes(id) ? 1 : 0 }),
    },
    refresh: () => {},
  });
  document.body.append(node);
  return node;
}

describe('the screens tab', () => {
  it('says nothing when one screen matches', () => {
    const node = build(['c']);
    expect(node.querySelector('.bhb-screens__clash')).toBeNull();
  });

  it('says nothing when none match', () => {
    const node = build([]);
    expect(node.querySelector('.bhb-screens__clash')).toBeNull();
  });

  it('warns when two match, and names them', () => {
    const node = build(['a', 'c']);
    const warning = node.querySelector('.bhb-screens__clash');

    expect(warning).not.toBeNull();
    expect(warning.textContent).toContain('Hết resources');
    expect(warning.textContent).toContain('Hết energy');
  });

  it('names the one that wins first, since that is the one in force', () => {
    const node = build(['a', 'c']);
    const text = node.querySelector('.bhb-screens__clash').textContent;

    expect(text.indexOf('Hết resources')).toBeLessThan(text.indexOf('Hết energy'));
  });
});
