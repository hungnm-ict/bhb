/**
 * The one new field a Screen carries for auto-switching the Run target:
 * which activity it means, or none.
 */
import { describe, it, expect } from 'vitest';
import { createScreen } from '../src/bot/screen.js';

describe('createScreen: triggerActivity', () => {
  it('defaults to null, so an existing Screen is unaffected', () => {
    expect(createScreen().triggerActivity).toBeNull();
  });

  it('can be set at creation, the same as every other field', () => {
    expect(createScreen({ triggerActivity: 'raid' }).triggerActivity).toBe('raid');
  });
});
