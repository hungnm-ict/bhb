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

    // The UI only builds in a frame that holds the game canvas.
    const canvas = document.createElement('canvas');
    canvas.id = 'unity-canvas';
    canvas.width = 800;
    canvas.height = 520;
    document.body.append(canvas);

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

  it('renders the HUD', () => {
    expect(document.querySelector('.bhb-hud')).not.toBeNull();
  });

  it('leaves the panel closed and the marker layer click-through', () => {
    expect(document.querySelector('.bhb-panel').style.display).toBe('none');
    expect(document.querySelector('.bhb-markers').style.display).toBe('none');
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

  it('scales the built-in steps off an 800x520 capture', async () => {
    const { RERUN_STEPS } = await import('../src/bot/builtin.js');
    const { resolvePoint } = await import('../src/core/coords.js');
    const point = RERUN_STEPS[0].points[0];

    expect(point).toMatchObject({ bw: 800, bh: 520 });
    // Identity at the size they were captured at...
    expect(resolvePoint(point, { width: 800, height: 520 })).toEqual({
      x: point.x,
      y: point.y,
    });
    // ...and rescaled if the embed ever stops pinning the framebuffer.
    expect(resolvePoint(point, { width: 1600, height: 1040 })).toEqual({
      x: point.x * 2,
      y: point.y * 2,
    });
  });

  it('reports the page as visible so the game does not throttle', () => {
    expect(document.hidden).toBe(false);
    expect(document.visibilityState).toBe('visible');
    expect(document.hasFocus()).toBe(true);
  });
});

describe('published version', () => {
  it('is the same in package.json, the userscript banner and both READMEs', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

    const built = readFileSync('dist/bhb.user.js', 'utf8');
    expect(built, 'the built bundle is older than package.json — run npm run build').toContain(
      `// @version      ${pkg.version}`
    );

    for (const file of ['README.md', 'README.en.md']) {
      const text = readFileSync(file, 'utf8');
      expect(text, `${file} names a stale version`).toContain(
        `<!--version-->v${pkg.version}<!--/version-->`
      );
    }
  });
});
