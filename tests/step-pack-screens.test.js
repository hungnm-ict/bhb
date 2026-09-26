/**
 * A pack carries the screens its steps are gated to.
 * @vitest-environment jsdom
 *
 * A step points at a screen by id. Sending the steps alone leaves every gate
 * pointing at nothing on the far side, and the step either fires everywhere
 * or never — silently, because a gate that matches no screen looks like a
 * step that is simply not its turn.
 */
import { describe, it, expect } from 'vitest';
import { exportSteps, importSteps, mergeScreens } from '../src/bot/step-pack.js';
import { createStep } from '../src/bot/step.js';

const LOCKED = { id: 'sc-locked', name: 'LOCKED', anchors: [], minRatio: 0.75 };
const ENERGY = { id: 'sc-energy', name: 'No energy', anchors: [], minRatio: 0.75 };

function dungeonSteps() {
  return [
    createStep({ label: 'open', activity: 'dungeon', screens: ['sc-locked'] }),
    createStep({ label: 'plain', activity: 'dungeon' }),
  ];
}

describe('a pack with screens in it', () => {
  it('carries the screens its steps point at', () => {
    const json = exportSteps(dungeonSteps(), null, [LOCKED, ENERGY]);
    const pack = importSteps(json);

    expect(pack.screens.map((screen) => screen.id)).toEqual(['sc-locked']);
  });

  it('leaves out a screen nothing points at', () => {
    const json = exportSteps(dungeonSteps(), null, [LOCKED, ENERGY]);
    expect(json).not.toContain('sc-energy');
  });

  it('keeps the screen ids, so the gates still point at them', () => {
    const json = exportSteps(dungeonSteps(), null, [LOCKED]);
    const pack = importSteps(json);

    expect(pack.steps[0].screens).toEqual(['sc-locked']);
    expect(pack.screens[0].id).toBe('sc-locked');
  });

  it('reads a pack written before screens travelled', () => {
    const old = JSON.stringify({ kind: 'bhb.steps', version: 1, lock: null, steps: [] });
    expect(importSteps(old).screens).toEqual([]);
  });
});

describe('mergeScreens', () => {
  it('replaces a screen of the same id and keeps the rest', () => {
    const mine = [{ ...ENERGY }, { ...LOCKED, name: 'old name' }];
    const theirs = [{ ...LOCKED, name: 'LOCKED' }];

    const merged = mergeScreens(mine, theirs);

    expect(merged).toHaveLength(2);
    expect(merged.find((screen) => screen.id === 'sc-locked').name).toBe('LOCKED');
    expect(merged.find((screen) => screen.id === 'sc-energy')).toBeTruthy();
  });

  it('appends one the far side has never seen', () => {
    expect(mergeScreens([], [LOCKED])).toHaveLength(1);
  });

  it('is unchanged by a pack with no screens', () => {
    const mine = [ENERGY];
    expect(mergeScreens(mine, [])).toEqual(mine);
  });
});

describe('pasting a pack in the panel', () => {
  it('puts the screens in before the steps that are gated to them', async () => {
    const { renderStepsTab } = await import('../src/ui/panel/steps.js');
    const { createUiStore } = await import('../src/ui/store.js');

    const myScreens = [];
    const mySteps = [];
    const order = [];

    document.body.replaceChildren();
    const store = createUiStore();
    const node = renderStepsTab({
      store,
      getSteps: () => mySteps,
      getScreens: () => myScreens,
      getEngineState: () => ({ expectedStepId: null, screen: null }),
      getActivities: () => [],
      getRunTarget: () => 'runAll',
      getCanvasLock: () => null,
      settings: { scaleMode: 'scale', showScreens: true },
      stepEditor: {
        replaceAll: (next) => {
          order.push('steps');
          mySteps.splice(0, mySteps.length, ...next);
        },
      },
      screenEditor: {
        replaceAll: (next) => {
          order.push('screens');
          myScreens.splice(0, myScreens.length, ...next);
        },
      },
      dryRunner: { start: () => {}, stop: () => {} },
      refresh: () => {},
    });
    document.body.append(node);

    // Pasting into the box is what loads it; the button goes via the
    // clipboard, which jsdom does not have.
    const json = exportSteps(dungeonSteps(), null, [LOCKED]);
    const box = node.querySelector('textarea');
    const paste = new Event('paste', { bubbles: true, cancelable: true });
    paste.clipboardData = { getData: () => json };
    box.dispatchEvent(paste);

    expect(order, 'a gate must not point at nothing, even for one render').toEqual([
      'screens',
      'steps',
    ]);
    expect(myScreens.map((screen) => screen.id)).toEqual(['sc-locked']);
    expect(mySteps[0].screens).toEqual(['sc-locked']);
  });
});
