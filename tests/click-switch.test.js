/**
 * Switching the Run target off a real click landing on a mapped icon.
 *
 * No pixel read involved at all: a trusted click's coordinates, checked
 * against a rectangle drawn by hand. Never fires for the bot's own
 * synthetic clicks, and backs off only while the game is resting.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let canvas;
let detectedScreen;

vi.mock('../src/core/canvas.js', () => ({
  getCanvas: () => canvas,
  getGl: () => ({}),
}));

vi.mock('../src/bot/screen.js', () => ({
  detectScreen: () => detectedScreen,
}));

const { handleClick } = await import('../src/core/click-switch.js');

/** A zone captured at 800x600, covering buffer (100,100) to (140,140). */
const ZONE = { x: 100, y: 100, w: 40, h: 40, bw: 800, bh: 600 };

function build({ activities = [], restingMs = 0, activeTask = null, screens = [] }) {
  const setRunTarget = vi.fn();
  const deps = {
    getActivities: () => activities,
    getEngineState: () => ({ restingMs, activeTask }),
    setRunTarget,
    getScreens: () => screens,
  };
  return { deps, setRunTarget };
}

/**
 * `isTrusted` is unforgeable on a real DOM event — jsdom refuses to let a
 * test override it — so this builds the plain object `handleClick` actually
 * reads instead of dispatching a real one.
 */
function click(deps, { x, y, trusted = true, target = canvas }) {
  handleClick(
    { isTrusted: trusted, target, clientX: x, clientY: canvas.height - y },
    deps
  );
}

beforeEach(() => {
  detectedScreen = null;
  canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  // 1:1 with the buffer, whatever it resizes to — only the ratio to `bw`/`bh`
  // the zone was captured at is what the scaling test cares about.
  canvas.getBoundingClientRect = () => ({
    left: 0, top: 0, right: canvas.width, bottom: canvas.height,
    width: canvas.width, height: canvas.height,
  });
  document.body.appendChild(canvas);
});

afterEach(() => {
  canvas.remove();
});

describe('click-switch', () => {
  it('switches the Run target on a trusted click inside the zone', () => {
    const { deps, setRunTarget } = build({
      activities: [{ id: 'raid', name: 'Raid', clickZone: ZONE }],
    });

    click(deps, { x: 120, y: 120 });

    expect(setRunTarget).toHaveBeenCalledWith('raid');
  });

  it('ignores a click outside the zone', () => {
    const { deps, setRunTarget } = build({
      activities: [{ id: 'raid', name: 'Raid', clickZone: ZONE }],
    });

    click(deps, { x: 500, y: 500 });

    expect(setRunTarget).not.toHaveBeenCalled();
  });

  it('ignores the bot’s own synthetic click, even inside the zone', () => {
    const { deps, setRunTarget } = build({
      activities: [{ id: 'raid', name: 'Raid', clickZone: ZONE }],
    });

    click(deps, { x: 120, y: 120, trusted: false });

    expect(setRunTarget).not.toHaveBeenCalled();
  });

  it('ignores a click on something other than the game canvas, even at the same spot', () => {
    const { deps, setRunTarget } = build({
      activities: [{ id: 'raid', name: 'Raid', clickZone: ZONE }],
    });
    const panelButton = document.createElement('button');
    document.body.appendChild(panelButton);

    click(deps, { x: 120, y: 120, target: panelButton });

    expect(setRunTarget).not.toHaveBeenCalled();
    panelButton.remove();
  });

  it('still switches the Run target on a zone click while a task is running', () => {
    const { deps, setRunTarget } = build({
      activities: [{ id: 'raid', name: 'Raid', clickZone: ZONE }],
      activeTask: 'runAll',
    });

    click(deps, { x: 120, y: 120 });

    expect(setRunTarget).toHaveBeenCalledWith('raid');
  });

  it('ignores every zone while the game is resting', () => {
    const { deps, setRunTarget } = build({
      activities: [{ id: 'raid', name: 'Raid', clickZone: ZONE }],
      restingMs: 500,
    });

    click(deps, { x: 120, y: 120 });

    expect(setRunTarget).not.toHaveBeenCalled();
  });

  it('does nothing for an activity with no zone drawn', () => {
    const { deps, setRunTarget } = build({
      activities: [{ id: 'raid', name: 'Raid', clickZone: null }],
    });

    click(deps, { x: 120, y: 120 });

    expect(setRunTarget).not.toHaveBeenCalled();
  });

  it('ignores a zone click off the home screen once one screen is marked home', () => {
    const home = { id: 'home', name: 'Home', isHome: true };
    detectedScreen = { id: 'dungeon-tier', name: 'Dungeon tier select', isHome: false };
    const { deps, setRunTarget } = build({
      activities: [{ id: 'expedition', name: 'Expedition', clickZone: ZONE }],
      screens: [home],
    });

    click(deps, { x: 120, y: 120 });

    expect(setRunTarget).not.toHaveBeenCalled();
  });

  it('still switches the Run target on the home screen once one is marked', () => {
    const home = { id: 'home', name: 'Home', isHome: true };
    detectedScreen = home;
    const { deps, setRunTarget } = build({
      activities: [{ id: 'expedition', name: 'Expedition', clickZone: ZONE }],
      screens: [home],
    });

    click(deps, { x: 120, y: 120 });

    expect(setRunTarget).toHaveBeenCalledWith('expedition');
  });

  it('switches the Run target with no home screen gate configured, even off any detected screen', () => {
    detectedScreen = null;
    const { deps, setRunTarget } = build({
      activities: [{ id: 'expedition', name: 'Expedition', clickZone: ZONE }],
      screens: [{ id: 'other', name: 'Other', isHome: false }],
    });

    click(deps, { x: 120, y: 120 });

    expect(setRunTarget).toHaveBeenCalledWith('expedition');
  });

  it('scales the zone when the framebuffer has resized since it was drawn', () => {
    canvas.width = 1600;
    canvas.height = 1200; // 2x the 800x600 the zone was captured at
    const { deps, setRunTarget } = build({
      activities: [{ id: 'raid', name: 'Raid', clickZone: ZONE }],
    });

    click(deps, { x: 240, y: 240 }); // inside the zone's scaled bounds, 200..280

    expect(setRunTarget).toHaveBeenCalledWith('raid');
  });
});
