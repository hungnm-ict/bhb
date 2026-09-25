/**
 * The corner badge answers "what build am I on" without opening the panel.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/core/canvas.js', () => ({
  getCanvas: () => ({ width: 800, height: 500, clientWidth: 800, clientHeight: 500 }),
}));

const { createSizeBadge } = await import('../src/ui/size-badge.js');
const { VERSION } = await import('../src/core/constants.js');

/** The badge mounts on documentElement, not body — clear it where it lands. */
function clearBadges() {
  for (const stale of document.querySelectorAll('.bhb-size')) {
    stale.remove();
  }
}

describe('the size badge', () => {
  it('shows the build above the size', () => {
    clearBadges();
    const badge = createSizeBadge({ isVisible: () => true });
    badge.render();

    const node = document.querySelector('.bhb-size');
    expect(node.querySelector('.bhb-size__ver').textContent).toBe(`v${VERSION}`);
    expect(node.querySelector('.bhb-size__px').textContent).toBe('800×500');
  });

  it('redraws the size without losing the version', () => {
    clearBadges();
    const badge = createSizeBadge({ isVisible: () => true });
    badge.render();
    badge.render();

    expect(document.querySelectorAll('.bhb-size__ver')).toHaveLength(1);
    expect(document.querySelector('.bhb-size__ver').textContent).toBe(`v${VERSION}`);
  });
});
