import { describe, it, expect } from 'vitest';
import { nextVersion } from '../bump.js';

describe('nextVersion', () => {
  it('bumps the patch', () => {
    expect(nextVersion('0.14.0', 'patch')).toBe('0.14.1');
  });

  it('bumps the minor and resets the patch', () => {
    expect(nextVersion('0.14.3', 'minor')).toBe('0.15.0');
  });

  it('bumps the major and resets the rest', () => {
    expect(nextVersion('0.14.3', 'major')).toBe('1.0.0');
  });

  it('carries past nine rather than treating parts as digits', () => {
    expect(nextVersion('0.9.9', 'minor')).toBe('0.10.0');
  });

  it('takes an explicit version', () => {
    expect(nextVersion('0.14.0', '1.0.0')).toBe('1.0.0');
  });

  it('rejects an explicit version equal to the current one', () => {
    expect(() => nextVersion('0.14.0', '0.14.0')).toThrow(/not above/i);
  });

  it('rejects an explicit version below the current one', () => {
    expect(() => nextVersion('0.14.0', '0.13.9')).toThrow(/not above/i);
  });

  it('compares parts numerically, not as strings', () => {
    expect(() => nextVersion('0.10.0', '0.9.0')).toThrow(/not above/i);
    expect(nextVersion('0.9.0', '0.10.0')).toBe('0.10.0');
  });

  it('rejects a malformed version', () => {
    expect(() => nextVersion('0.14.0', '1.0')).toThrow(/major.minor.patch/i);
    expect(() => nextVersion('0.14.0', 'v1.0.0')).toThrow(/major.minor.patch/i);
    expect(() => nextVersion('0.14.0', '1.0.0-beta')).toThrow(/major.minor.patch/i);
  });

  it('rejects a missing bump', () => {
    expect(() => nextVersion('0.14.0', '')).toThrow(/major.minor.patch/i);
    expect(() => nextVersion('0.14.0', undefined)).toThrow(/major.minor.patch/i);
  });

  it('rejects a current version it cannot read', () => {
    expect(() => nextVersion('nonsense', 'patch')).toThrow(/current version/i);
  });
});
