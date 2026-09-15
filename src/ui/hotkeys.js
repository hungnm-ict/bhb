/**
 * Keyboard bindings.
 *
 * Every handled key is consumed in the capture phase: the game listens for
 * keys too, and an unconsumed one would both drive the bot and trigger
 * whatever the game binds it to.
 */

/**
 * @param {Record<string, () => void>} bindings key → handler
 * @returns {() => void} removes the listener
 */
export function installHotkeys(bindings) {
  function onKeyDown(event) {
    // Never steal keys while the user is typing somewhere.
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }
    const target = event.target;
    if (target instanceof HTMLElement && target.isContentEditable) {
      return;
    }
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      return;
    }

    // Caps Lock and Shift arrive as 'R', not 'r', and the user meant the same key.
    const handler = bindings[event.key] || bindings[event.key.toLowerCase()];
    if (!handler) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    handler();
  }

  document.addEventListener('keydown', onKeyDown, true);
  return () => document.removeEventListener('keydown', onKeyDown, true);
}
