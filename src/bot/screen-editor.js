import { getRenderTarget } from '../core/canvas.js';
import { captureFingerprint } from '../core/region.js';
import { clientToBuffer, getBufferSize } from '../core/coords.js';
import { createScreen, scoreScreen } from './screen.js';
import { slotsForBoss } from './worldboss.js';
import { t } from '../i18n/index.js';

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
  function find(screenId) {
    return deps.getScreens().find((screen) => screen.id === screenId) || null;
  }

  /**
   * Turn a client-space rectangle into an anchor.
   *
   * @param {{ left: number, top: number, width: number, height: number }} rect
   * @param {string | null} screenId the screen to add it to; null makes a new one
   * @returns {import('./screen.js').Screen | null}
   */
  function captureAnchor(rect, screenId = null) {
    const target = getRenderTarget();
    if (!target) {
      deps.report(t('msg.noCanvas'));
      return null;
    }

    const { canvas, gl } = target;
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

    screen.anchors.push(fingerprint);
    deps.persist();
    deps.report(t('msg.anchorCaptured', { name: screen.name, n: screen.anchors.length }));
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

  function setBossId(screenId, bossId) {
    const screen = find(screenId);
    if (!screen) {
      return;
    }
    screen.bossId = bossId || null;
    deps.persist();
  }

  /** Which activity this Screen means for auto-switching, or none. */
  function setTriggerActivity(screenId, activityId) {
    const screen = find(screenId);
    if (!screen) {
      return;
    }
    screen.triggerActivity = activityId || null;
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
    setIsParty,
    setBossId,
    setTriggerActivity,
    captureListFrame,
    setPitch,
    removeAnchor,
    remove,
    replaceAll,
    move,
    probe,
  };
}
