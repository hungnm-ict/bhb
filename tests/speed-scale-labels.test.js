/**
 * The number scale under the speed slider is a fixed set of labels — 0.1×,
 * 1×, 5×, 10×, 20× — but the stops it is drawn against are not: locked, the
 * slider never reaches past 10×. A label for a stop that is not there reads
 * its own stale text rather than the one that is actually at that position,
 * which is how "20×" ended up sitting where 10× — the real top of the
 * locked scale — belongs.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setSpeed, setSpeedUnlocked } from '../src/core/speed.js';
import { renderTasksTab } from '../src/ui/panel/tasks.js';

const activities = [];

function render() {
  return renderTasksTab({
    getEngineState: () => ({ activeTask: null, round: 0, remainingMs: 0, activity: null }),
    getSteps: () => [],
    getActivities: () => activities,
    getRunTarget: () => 'script',
    setRunTarget: () => {},
    runSelected: () => {},
    refresh: () => {},
  });
}

beforeEach(() => {
  setSpeedUnlocked(false);
  setSpeed(1);
});

describe('the speed scale labels', () => {
  it('only labels stops the locked slider actually offers', () => {
    const tab = render();
    const labels = [...tab.querySelectorAll('.bhb-speedscale__mark')].map((mark) => mark.textContent);
    expect(labels).toEqual(['0.1×', '1×', '5×', '10×']);
  });

  it('adds 20× only once the fast stops are unlocked', () => {
    setSpeedUnlocked(true);
    const tab = render();
    const labels = [...tab.querySelectorAll('.bhb-speedscale__mark')].map((mark) => mark.textContent);
    expect(labels).toEqual(['0.1×', '1×', '5×', '10×', '20×']);
  });
});
