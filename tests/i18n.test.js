import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLanguage, getLanguage } from '../src/i18n/index.js';
import vi from '../src/i18n/vi.js';
import en from '../src/i18n/en.js';

describe('translations', () => {
  beforeEach(() => setLanguage('vi'));

  it('keeps both bundles in sync', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(vi).sort());
  });

  it('substitutes named placeholders', () => {
    setLanguage('en');
    expect(t('msg.colorSaved', { n: 3, hex: '#a6d339' })).toBe(
      'saved colour for rule #3: #a6d339'
    );
  });

  it('returns the key when a translation is missing', () => {
    expect(t('does.not.exist')).toBe('does.not.exist');
  });

  it('falls back to Vietnamese for an unknown language', () => {
    setLanguage('fr');
    expect(getLanguage()).toBe('vi');
  });
});
