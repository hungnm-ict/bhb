/**
 * The focus patch hides the page's own blur from the game. An element's blur
 * is not the page's: swallowing those left the game's chat field focused in
 * the DOM but dead to the game.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { installFocusPatch } from '../src/core/focus.js';

describe('focus patch', () => {
  installFocusPatch();

  it('reports the page as visible and focused', () => {
    expect(document.hidden).toBe(false);
    expect(document.visibilityState).toBe('visible');
    expect(document.hasFocus()).toBe(true);
  });

  it('swallows the window losing focus', () => {
    let seen = false;
    window.addEventListener('blur', () => {
      seen = true;
    });
    window.dispatchEvent(new Event('blur'));
    expect(seen).toBe(false);
  });

  it('lets a field blur through', () => {
    const field = document.createElement('input');
    document.body.appendChild(field);
    let seen = 0;
    field.addEventListener('blur', () => {
      seen += 1;
    });
    field.addEventListener('focusout', () => {
      seen += 1;
    });
    field.dispatchEvent(new Event('blur'));
    field.dispatchEvent(new Event('focusout', { bubbles: true }));
    expect(seen).toBe(2);
  });
});
