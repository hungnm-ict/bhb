/**
 * Typing into our own fields.
 *
 * The game listens for keys on the document and calls `preventDefault` on the
 * ones it recognises, so every character typed into a panel field was being
 * eaten before it arrived. A capture listener on the window runs before any
 * listener further down the tree, whoever registered first.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { shieldOwnFields } from '../src/ui/hotkeys.js';

let release = null;

function type(target, key) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  document.body.replaceChildren();
  if (release) {
    release();
  }
  release = shieldOwnFields();
});

describe('shieldOwnFields', () => {
  it('keeps the game from seeing a key typed into a panel field', () => {
    const panel = document.createElement('div');
    panel.className = 'bhb-panel';
    const field = document.createElement('input');
    panel.append(field);
    document.body.append(panel);

    let gameSaw = 0;
    document.addEventListener('keydown', () => {
      gameSaw += 1;
    });

    type(field, 'a');
    expect(gameSaw).toBe(0);
  });

  it('never cancels the key, so the character still lands in the field', () => {
    const panel = document.createElement('div');
    panel.className = 'bhb-panel';
    const field = document.createElement('input');
    panel.append(field);
    document.body.append(panel);

    const event = type(field, 'a');
    expect(event.defaultPrevented).toBe(false);
  });

  it('leaves the game its own keys', () => {
    const elsewhere = document.createElement('div');
    document.body.append(elsewhere);

    let gameSaw = 0;
    document.addEventListener('keydown', () => {
      gameSaw += 1;
    });

    type(elsewhere, 'a');
    expect(gameSaw).toBe(1);
  });

  it('shields the probe and drag layers too, not only the panel', () => {
    const probes = document.createElement('div');
    probes.className = 'bhb-probes';
    const field = document.createElement('input');
    probes.append(field);
    document.body.append(probes);

    let gameSaw = 0;
    document.addEventListener('keydown', () => {
      gameSaw += 1;
    });

    type(field, 'x');
    expect(gameSaw).toBe(0);
  });
});
