/**
 * Loads the built userscript into a DOM that has no WebGL, which is the
 * worst case the script meets in the wild: it must install its patches, build
 * its panels, and sit waiting rather than throw during start-up.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';

describe('built bundle', () => {
  let errors = [];
  /** Attributes the bundle's patch passed down to the real getContext. */
  let forwardedAttrs = null;

  beforeAll(() => {
    const originalError = console.error;
    console.error = (...args) => errors.push(args.join(' '));

    // Stand in for the browser's getContext before the bundle wraps it, so the
    // patch's own call is observable. jsdom returns null for webgl regardless.
    HTMLCanvasElement.prototype.getContext = function (type, attrs) {
      forwardedAttrs = attrs;
      return null;
    };

    // jsdom has no PointerEvent; the click path needs the constructor to exist.
    if (typeof window.PointerEvent === 'undefined') {
      window.PointerEvent = window.MouseEvent;
    }

    const bundle = readFileSync('dist/bhb.user.js', 'utf8');
    const run = new Function(bundle);
    run.call(window);

    console.error = originalError;
  });

  it('starts up without throwing', () => {
    expect(errors).toEqual([]);
  });

  it('installs its stylesheet', () => {
    expect(document.getElementById('bhb-styles')).not.toBeNull();
  });

  it('renders the status overlay', () => {
    expect(document.querySelector('.bhb-overlay')).not.toBeNull();
  });

  it('forces preserveDrawingBuffer on WebGL contexts', () => {
    document.createElement('canvas').getContext('webgl', { antialias: true });
    expect(forwardedAttrs).toMatchObject({
      preserveDrawingBuffer: true,
      antialias: true,
    });
  });

  it('leaves non-WebGL contexts alone', () => {
    document.createElement('canvas').getContext('2d', { alpha: false });
    expect(forwardedAttrs).toEqual({ alpha: false });
  });

  it('reports the page as visible so the game does not throttle', () => {
    expect(document.hidden).toBe(false);
    expect(document.visibilityState).toBe('visible');
    expect(document.hasFocus()).toBe(true);
  });
});
