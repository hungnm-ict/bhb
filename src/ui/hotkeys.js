/**
 * Keyboard bindings.
 *
 * Every handled key is consumed in the capture phase: the game listens for
 * keys too, and an unconsumed one would both drive the bot and trigger
 * whatever the game binds it to.
 */

/**
 * @param {Record<string, () => boolean | void>} bindings key → handler. A
 *   handler returning false declines the key: nothing is consumed and the game
 *   sees it, which is how Esc closes the panel without being taken from the
 *   game the rest of the time.
 * @returns {() => void} removes the listener
 */
/**
 * A field the user is actually typing in.
 *
 * Unity parks an invisible input on the page and focuses it as soon as the
 * canvas is clicked — so once the bot had clicked anything, every hotkey was
 * being handed to the game and the toggle keys stopped answering. Our own
 * fields still win, and so does any game field big enough to be seen.
 */
function isTypingField(target) {
  if (
    !(target instanceof HTMLInputElement) &&
    !(target instanceof HTMLTextAreaElement) &&
    !(target instanceof HTMLSelectElement)
  ) {
    return false;
  }
  if (target.closest('.bhb-panel, .bhb-probes, .bhb-drag, .bhb-hud')) {
    return true;
  }
  return target.offsetWidth > 1 && target.offsetHeight > 1;
}

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
    if (isTypingField(target)) {
      return;
    }

    // Caps Lock and Shift arrive as 'R', not 'r', and the user meant the same key.
    const handler = bindings[event.key] || bindings[event.key.toLowerCase()];
    if (!handler) {
      return;
    }

    if (handler() === false) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  document.addEventListener('keydown', onKeyDown, true);
  return () => document.removeEventListener('keydown', onKeyDown, true);
}
