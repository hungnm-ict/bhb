/**
 * What being inside a lag window does.
 *
 * The speed comes off and goes back on, and the speed the user had is
 * remembered rather than guessed at — coming out of an hour at 1x when they
 * left it at 15x would cost them the rest of the night quietly.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createLagGuard } from '../src/core/lag.js';

let speed = 1;
const setSpeed = (next) => {
  speed = next;
};
const getSpeed = () => speed;

function guardAt(clock, windows = [{ from: '06:00', to: '07:00' }]) {
  return createLagGuard({
    getWindows: () => windows,
    getSpeed,
    setSpeed,
    now: () => clock.value,
  });
}

beforeEach(() => {
  speed = 15;
});

function time(hours, minutes) {
  return new Date(2026, 8, 26, hours, minutes, 0);
}

describe('the lag window guard', () => {
  it('takes the speed off on the way in', () => {
    const clock = { value: time(5, 59) };
    const guard = guardAt(clock);

    guard.check();
    expect(speed).toBe(15);

    clock.value = time(6, 0);
    guard.check();
    expect(speed).toBe(1);
  });

  it('gives back the speed the user had, not a guess', () => {
    const clock = { value: time(6, 30) };
    const guard = guardAt(clock);
    guard.check();
    expect(speed).toBe(1);

    clock.value = time(7, 0);
    guard.check();
    expect(speed).toBe(15);
  });

  it('leaves a speed the user changed during the hour alone', () => {
    const clock = { value: time(6, 30) };
    const guard = guardAt(clock);
    guard.check();

    // The user reached for the slider themselves.
    speed = 5;
    clock.value = time(7, 0);
    guard.check();

    expect(speed, 'their choice outranks what was remembered').toBe(5);
  });

  it('says whether it is holding, for the panel to show', () => {
    const clock = { value: time(6, 30) };
    const guard = guardAt(clock);
    guard.check();
    expect(guard.isHolding()).toBe(true);

    clock.value = time(9, 0);
    guard.check();
    expect(guard.isHolding()).toBe(false);
  });

  it('does nothing at all with no windows set', () => {
    const clock = { value: time(6, 30) };
    const guard = guardAt(clock, []);
    guard.check();
    expect(speed).toBe(15);
    expect(guard.isHolding()).toBe(false);
  });

  it('does not fight the user who was already at 1x', () => {
    speed = 1;
    const clock = { value: time(6, 30) };
    const guard = guardAt(clock);
    guard.check();
    clock.value = time(7, 0);
    guard.check();
    expect(speed).toBe(1);
  });
});

describe('the lag window settings', () => {
  it('ship the three this game is known for, and survive being emptied', async () => {
    window.localStorage.clear();
    const { loadSettings, saveSettings } = await import('../src/core/storage.js');

    expect(loadSettings().lagWindows).toHaveLength(3);

    const settings = loadSettings();
    settings.lagWindows = [];
    saveSettings(settings);

    expect(loadSettings().lagWindows, 'empty is a choice, not a missing value').toEqual([]);
  });

  it('keeps an hour the user edited', async () => {
    window.localStorage.clear();
    const { loadSettings, saveSettings } = await import('../src/core/storage.js');

    const settings = loadSettings();
    settings.lagWindows = [{ from: '20:15', to: '21:00' }];
    saveSettings(settings);

    expect(loadSettings().lagWindows).toEqual([{ from: '20:15', to: '21:00' }]);
  });
});
