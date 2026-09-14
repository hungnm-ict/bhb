/**
 * A frame with no game canvas must stay completely silent — no overlay, no
 * hotkeys. Kongregate loads the game in an iframe, so the script runs twice:
 * once in the outer page and once in the frame.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';

describe('frame without a canvas', () => {
  beforeAll(() => {
    if (typeof window.PointerEvent === 'undefined') {
      window.PointerEvent = window.MouseEvent;
    }
    // Deliberately no canvas in this document.
    const run = new Function(readFileSync('dist/bhb.user.js', 'utf8'));
    run.call(window);
  });

  it('renders no overlay', () => {
    expect(document.querySelector('.bhb-overlay')).toBeNull();
  });

  it('still applies the visibility patch, which is frame-wide', () => {
    expect(document.hidden).toBe(false);
  });
});
