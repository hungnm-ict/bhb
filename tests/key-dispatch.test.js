/**
 * Synthetic keys.
 *
 * The bot has only ever used the mouse. Escape is the one key the game gives
 * no button for, and it is the way out of a dialog nobody wrote a step for.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { dispatchKey } from '../src/core/input.js';

function record(target, seen) {
  for (const type of ['keydown', 'keyup']) {
    target.addEventListener(type, (event) => {
      seen.push({ type, key: event.key, code: event.code, keyCode: event.keyCode });
    });
  }
}

describe('dispatchKey', () => {
  it('sends a press and a release to the canvas, document and window', () => {
    const canvas = document.createElement('canvas');
    document.body.append(canvas);

    const onCanvas = [];
    const onDocument = [];
    record(canvas, onCanvas);
    record(document, onDocument);

    dispatchKey(canvas, 'Escape');

    expect(onCanvas.map((event) => event.type)).toEqual(['keydown', 'keyup']);
    expect(onDocument.length).toBeGreaterThan(0);
  });

  it('carries the legacy keyCode, which is what older engines read', () => {
    const canvas = document.createElement('canvas');
    const seen = [];
    record(canvas, seen);

    dispatchKey(canvas, 'Escape');

    expect(seen[0].key).toBe('Escape');
    expect(seen[0].code).toBe('Escape');
    expect(seen[0].keyCode).toBe(27);
  });

  it('survives a target that refuses the event', () => {
    const hostile = {
      dispatchEvent() {
        throw new Error('no');
      },
    };
    expect(() => dispatchKey(hostile, 'Escape')).not.toThrow();
  });
});
