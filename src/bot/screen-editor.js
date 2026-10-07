import { getRenderTarget } from '../core/canvas.js';
import { captureFingerprint } from '../core/region.js';
import { clientToBuffer, getBufferSize, isInsideCanvas } from '../core/coords.js';
import { dispatchMoveTo, resetHover } from '../core/input.js';
import { realRequestAnimationFrame } from '../core/timers.js';
import { trackCursor, getCursor } from '../core/cursor.js';
import { createScreen, createScreenId, scoreScreen } from './screen.js';
import { slotsForBoss } from './worldboss.js';
import { t } from '../i18n/index.js';

/** Frames to let the game repaint after the synthetic pointer moves away. */
const REPAINT_FRAMES = 2;

function nextFrame() {
  return new Promise((resolve) => realRequestAnimationFrame(() => resolve()));
}

/**
 * Every mutation a screen can undergo, kept DOM-free so the panel stays a view.
 *
 * Sibling of `step-editor.js`: same shape, same persistence contract.
 *
 * @param {object} deps
 * @param {() => import('./screen.js').Screen[]} deps.getScreens
 * @param {() => void} deps.persist
 * @param {(message: string) => void} deps.report
 * @param {() => string} deps.getScaleMode
 */
export function createScreenEditor(deps) {
  trackCursor();

  function find(screenId) {
    return deps.getScreens().find((screen) => screen.id === screenId) || null;
  }

  /**
   * Turn a client-space rectangle into an anchor.
   *
   * The drag that produces `rect` ends with the real cursor still sitting
   * wherever it was released — often right over whatever was being framed,
   * same risk a step's single-point capture already had: if that spot is a
   * button, the game never drops its hover highlight, and the anchor would
   * read the lit shade instead of the resting one. The synthetic pointer
   * does the same dodge step capture does: parked in a corner, the game
   * repaints, the region is read, the real pointer goes back.
   *
   * @param {{ left: number, top: number, width: number, height: number }} rect
   * @param {string | null} screenId the screen to add it to; null makes a new one
   * @param {number | null} [anchorIndex] replace this anchor instead of adding one
   * @returns {Promise<import('./screen.js').Screen | null>}
   */
  async function captureAnchor(rect, screenId = null, anchorIndex = null) {
    const target = getRenderTarget();
    if (!target) {
      deps.report(t('msg.noCanvas'));
      return null;
    }

    const { canvas, gl } = target;

    const cursor = getCursor();
    const isCursorOverGame = cursor && isInsideCanvas(canvas, cursor.clientX, cursor.clientY);
    if (isCursorOverGame) {
      resetHover(canvas);
      for (let frame = 0; frame < REPAINT_FRAMES; frame += 1) {
        await nextFrame();
      }
    }

    // Client space has its origin top-left, buffer space bottom-left, so the
    // rectangle's bottom edge is what becomes its origin.
    const origin = clientToBuffer(canvas, rect.left, rect.top + rect.height);
    const far = clientToBuffer(canvas, rect.left + rect.width, rect.top);
    const buffer = getBufferSize(canvas);

    const fingerprint = captureFingerprint(gl, {
      x: origin.x,
      y: origin.y,
      w: Math.max(1, far.x - origin.x),
      h: Math.max(1, far.y - origin.y),
      bw: buffer.width,
      bh: buffer.height,
    });

    if (isCursorOverGame) {
      dispatchMoveTo(canvas, cursor.clientX, cursor.clientY);
    }

    if (!fingerprint) {
      deps.report(t('msg.noWebgl'));
      return null;
    }

    const screens = deps.getScreens();
    let screen = screenId ? find(screenId) : null;
    if (!screen) {
      screen = createScreen({ name: t('screen.defaultName', { n: screens.length + 1 }) });
      screens.push(screen);
    }

    const isReplacing = anchorIndex != null && anchorIndex >= 0 && anchorIndex < screen.anchors.length;
    if (isReplacing) {
      screen.anchors[anchorIndex] = fingerprint;
    } else {
      screen.anchors.push(fingerprint);
    }
    deps.persist();
    deps.report(
      isReplacing
        ? t('msg.anchorRecaptured', { name: screen.name, n: anchorIndex + 1 })
        : t('msg.anchorCaptured', { name: screen.name, n: screen.anchors.length })
    );
    return screen;
  }

  function rename(screenId, name) {
    const screen = find(screenId);
    if (!screen) {
      return;
    }
    screen.name = name;
    deps.persist();
  }

  function setStopsTask(screenId, stopsTask) {
    const screen = find(screenId);
    if (!screen) {
      return;
    }
    screen.stopsTask = stopsTask;
    deps.persist();
  }

  function setNotify(screenId, notify) {
    const screen = find(screenId);
    if (!screen) {
      return;
    }
    screen.notify = notify;
    deps.persist();
  }

  function setMinRatio(screenId, minRatio) {
    const screen = find(screenId);
    if (!screen) {
      return;
    }
    screen.minRatio = Math.min(1, Math.max(0, minRatio));
    deps.persist();
  }

  function setIsParty(screenId, isParty) {
    const screen = find(screenId);
    if (!screen) {
      return;
    }
    screen.isParty = Boolean(isParty);
    deps.persist();
  }

  function setIsHome(screenId, isHome) {
    const screen = find(screenId);
    if (!screen) {
      return;
    }
    screen.isHome = Boolean(isHome);
    deps.persist();
  }

  function setBossId(screenId, bossId) {
    const screen = find(screenId);
    if (!screen) {
      return;
    }
    screen.bossId = bossId || null;
    deps.persist();
  }

  /**
   * Store the party list's geometry from one drag over it, top row to the
   * bottom of the last.
   *
   * The pitch is a starting guess, not a measurement: dividing the drag by
   * the seat count only works if the drag's edges sat exactly on the first
   * row's top and the last row's bottom, and a user's drag rarely does. It is
   * why the slider exists — the guess gets the lines close, the user's eye
   * does the rest.
   *
   * @param {{ left: number, top: number, width: number, height: number }} rect
   */
  function captureListFrame(rect, screenId) {
    const screen = find(screenId);
    if (!screen) {
      return null;
    }
    const target = getRenderTarget();
    if (!target) {
      deps.report(t('msg.noCanvas'));
      return null;
    }

    const { canvas } = target;
    const top = clientToBuffer(canvas, rect.left, rect.top);
    const bottom = clientToBuffer(canvas, rect.left, rect.top + rect.height);
    const buffer = getBufferSize(canvas);
    const slots = slotsForBoss(screen.bossId);

    screen.listTop = top.y;
    screen.pitch = Math.max(1, Math.round((top.y - bottom.y) / slots));
    screen.listBh = buffer.height;
    deps.persist();
    return screen;
  }

  function setPitch(screenId, pitch) {
    const screen = find(screenId);
    if (!screen) {
      return;
    }
    screen.pitch = Math.max(1, Math.round(Number(pitch) || 1));
    deps.persist();
  }

  function removeAnchor(screenId, index) {
    const screen = find(screenId);
    if (!screen || index < 0 || index >= screen.anchors.length) {
      return;
    }
    screen.anchors.splice(index, 1);
    deps.persist();
  }

  /**
   * A second screen just like this one, a fresh id of its own.
   *
   * Every anchor travels, since a screen with none matches nothing: one
   * capture, tuned afterward, is the point of copying at all, the same
   * reasoning `step-editor.js`'s own `duplicate` already settled on.
   */
  function duplicate(screenId) {
    const original = find(screenId);
    if (!original) {
      return null;
    }

    const screens = deps.getScreens();
    const { id, ...rest } = original;
    const copy = createScreen({
      ...rest,
      // Anchors of its own: tuning the copy must not touch the original's.
      anchors: original.anchors.map((anchor) => ({
        ...anchor,
        samples: anchor.samples.map((sample) => ({ ...sample })),
      })),
      name: `${original.name || t('screen.defaultName', { n: screens.length + 1 })} (2)`.trim(),
    });
    screens.push(copy);
    deps.persist();
    return copy;
  }

  function remove(screenId) {
    const screens = deps.getScreens();
    const index = screens.findIndex((screen) => screen.id === screenId);
    if (index === -1) {
      return;
    }
    screens.splice(index, 1);
    deps.persist();
  }

  /**
   * Swap the whole list, for a pack arriving with the steps that need it.
   *
   * In place: the profile holds this array, and handing it a different one
   * would leave the profile pointing at the list nobody else can see.
   */
  function replaceAll(next) {
    const screens = deps.getScreens();
    screens.splice(0, screens.length, ...next);
    deps.persist();
  }

  /** Every screen in this profile, as JSON — moving them to another account. */
  function exportAll() {
    return JSON.stringify(deps.getScreens(), null, 2);
  }

  /**
   * Add a batch of screens exported from another profile or account.
   *
   * Appended, never replacing what's already there, and each lands with a
   * fresh id — two profiles that both exported the same screen must not
   * collide the moment one imports the other's.
   *
   * @param {string} json as `exportAll` wrote it: an array of screens
   * @returns {number} how many were added
   * @throws {Error} on anything that is not a JSON array of screens
   */
  function importScreens(json) {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error(t('screens.importNotAnArray'));
    }

    const screens = deps.getScreens();
    for (const entry of parsed) {
      screens.push(createScreen({ ...entry, id: createScreenId() }));
    }
    deps.persist();
    return parsed.length;
  }

  /** Order is priority: the first screen whose anchors all match wins. */
  function move(screenId, delta) {
    const screens = deps.getScreens();
    const from = screens.findIndex((screen) => screen.id === screenId);
    const to = from + delta;
    if (from === -1 || to < 0 || to >= screens.length) {
      return;
    }
    const [screen] = screens.splice(from, 1);
    screens.splice(to, 0, screen);
    deps.persist();
  }

  /**
   * Score a screen against the frame on show right now, for the live ✓/✗.
   * @returns {{ matched: boolean, ratio: number } | null} null without a canvas
   */
  function probe(screenId) {
    const screen = find(screenId);
    const target = getRenderTarget();
    if (!screen || !target) {
      return null;
    }
    return scoreScreen(target.gl, screen, getBufferSize(target.canvas), deps.getScaleMode());
  }

  return {
    captureAnchor,
    rename,
    setStopsTask,
    setNotify,
    setMinRatio,
    setIsHome,
    setIsParty,
    setBossId,
    captureListFrame,
    setPitch,
    removeAnchor,
    remove,
    duplicate,
    replaceAll,
    exportAll,
    importScreens,
    move,
    probe,
  };
}
