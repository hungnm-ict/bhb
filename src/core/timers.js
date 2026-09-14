/**
 * Native timing functions, captured at import time.
 *
 * The speed hack replaces the globals, so everything the bot itself schedules
 * must go through these instead — otherwise a 3s poll silently becomes 300ms
 * at 10x and hammers the game. This module is imported before `speed.js`
 * patches anything, which is what guarantees these are the real ones.
 */

export const realNow = Date.now.bind(Date);
export const realPerformanceNow = performance.now.bind(performance);
export const realSetTimeout = window.setTimeout.bind(window);
export const realClearTimeout = window.clearTimeout.bind(window);
export const realSetInterval = window.setInterval.bind(window);
export const realClearInterval = window.clearInterval.bind(window);
export const realRequestAnimationFrame =
  window.requestAnimationFrame.bind(window);
