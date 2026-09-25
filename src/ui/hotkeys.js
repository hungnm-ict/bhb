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

/** Our own surfaces. A key typed in one of these belongs to us, not the game. */
const OWN_SURFACES = '.bhb-panel, .bhb-probes, .bhb-drag, .bhb-hud';

/**
 * Keep the game's ears off our own fields.
 *
 * Unity listens for keys on the document and cancels the ones it recognises,
 * which ate every character typed into a step's name box — the text went
 * nowhere and the game moved instead. Capture on the window runs before any
 * listener further down the tree whoever registered first, so this is the one
 * place the key can be taken out of the game's path.
 *
 * Propagation is stopped and the key is never cancelled: a default action does
 * not need a listener, so the character still lands in the field.
 *
 * @returns {() => void} removes the listeners
 */
export function shieldOwnFields() {
  function guard(event) {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(OWN_SURFACES)) {
      return;
    }
    event.stopImmediatePropagation();
  }

  const types = ['keydown', 'keyup', 'keypress'];
  for (const type of types) {
    window.addEventListener(type, guard, true);
  }
  return () => {
    for (const type of types) {
      window.removeEventListener(type, guard, true);
    }
  };
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
