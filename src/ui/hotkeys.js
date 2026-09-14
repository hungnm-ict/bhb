/**
 * Keyboard bindings.
 *
 * Every handled key is consumed in the capture phase: the game listens for
 * number keys too, and an unconsumed `4` would both toggle World Boss and
 * trigger whatever the game binds it to.
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
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return;
    }

    const handler = bindings[event.key];
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
