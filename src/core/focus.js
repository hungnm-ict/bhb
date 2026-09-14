/**
 * Keep the game running while its tab is in the background.
 *
 * Unity throttles or pauses itself when the page reports hidden or unfocused,
 * which would stall the bot the moment the user switches tabs. Reporting the
 * page as permanently visible and focused is what makes unattended running
 * possible — it is the whole point of automating in a browser tab.
 */

const SUPPRESSED_EVENTS = [
  'visibilitychange',
  'webkitvisibilitychange',
  'blur',
  'focusout',
  'pagehide',
];

function defineAlways(target, property, value) {
  try {
    Object.defineProperty(target, property, {
      get: () => value,
      configurable: true,
    });
  } catch {
    // Some browsers refuse to redefine these; the game then throttles when
    // backgrounded, which is a degraded experience rather than a failure.
  }
}

export function installFocusPatch() {
  try {
    Object.defineProperty(document, 'hasFocus', {
      value: () => true,
      configurable: true,
      writable: true,
    });
  } catch {
    // As above.
  }

  defineAlways(document, 'hidden', false);
  defineAlways(document, 'visibilityState', 'visible');

  for (const type of SUPPRESSED_EVENTS) {
    const swallow = (event) => {
      event.stopImmediatePropagation();
      event.preventDefault();
    };
    // Capture phase, so the game's own listeners never see the event.
    window.addEventListener(type, swallow, true);
    document.addEventListener(type, swallow, true);
  }
}
