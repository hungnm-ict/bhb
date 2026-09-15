/**
 * The handler consumes the keys it binds, which is what keeps the game from
 * acting on them too — so declining a key matters as much as handling one.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { installHotkeys } from '../src/ui/hotkeys.js';

let uninstall = null;

function press(key, target = document.body) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

afterEach(() => {
  if (uninstall) {
    uninstall();
    uninstall = null;
  }
  document.body.replaceChildren();
});

describe('hotkeys', () => {
  it('runs the handler and takes the key from the game', () => {
    const run = vi.fn();
    uninstall = installHotkeys({ r: run });

    const event = press('r');

    expect(run).toHaveBeenCalled();
    expect(event.defaultPrevented, 'the game must not see it too').toBe(true);
  });

  it('leaves the key alone when the handler declines it', () => {
    // Esc with no panel open: the game still wants its Escape.
    uninstall = installHotkeys({ Escape: () => false });

    expect(press('Escape').defaultPrevented).toBe(false);
  });

  it('matches whatever the case, so Caps Lock does not break a binding', () => {
    const run = vi.fn();
    uninstall = installHotkeys({ r: run });

    press('R');

    expect(run).toHaveBeenCalled();
  });

  it('keeps out of the way while the user is typing', () => {
    const run = vi.fn();
    uninstall = installHotkeys({ r: run });
    const input = document.createElement('input');
    document.body.append(input);

    press('r', input);

    expect(run).not.toHaveBeenCalled();
  });
});
