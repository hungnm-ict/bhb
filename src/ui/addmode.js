import { el, mount } from './dom.js';
import { t } from '../i18n/index.js';

/** Red badge shown while add-rule mode is active. */
export function createAddModeBadge() {
  /** @type {HTMLElement | null} */
  let badge = null;

  function build() {
    return el('div', { class: 'bhb-panel bhb-addmode' }, [
      el('div', { class: 'bhb-addmode__title', text: `🔴 ${t('addMode.title')}` }),
      el('div', { class: 'bhb-addmode__keys' }, [
        el('div', { text: `0 · ${t('addMode.savePosition')}` }),
        el('div', { text: `9 · ${t('addMode.saveColor')}` }),
        el('div', { text: `8 · ${t('addMode.deleteRule')}` }),
        el('div', { text: `6 · ${t('addMode.exit')}` }),
      ]),
    ]);
  }

  function setVisible(visible) {
    if (badge) {
      badge.remove();
      badge = null;
    }
    if (visible) {
      badge = mount(build());
    }
  }

  return { setVisible };
}
