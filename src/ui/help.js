import { el, mount } from './dom.js';
import { t } from '../i18n/index.js';

/** Keyboard reference panel, toggled with `1`. */

const SECTIONS = [
  {
    title: 'help.sectionAuto',
    color: '#70e0a8',
    entries: [
      ['3', 'help.rerun'],
      ['4', 'help.wb'],
      ['5', 'help.script'],
    ],
  },
  {
    title: 'help.sectionRules',
    color: '#ffaa33',
    entries: [
      ['0', 'help.savePosition'],
      ['9', 'help.saveColor'],
      ['8', 'help.deleteRule'],
    ],
  },
  {
    title: 'help.sectionUi',
    color: '#8ec8ff',
    entries: [
      ['1', 'help.toggleHelp'],
      ['2', 'help.cycleOverlay'],
      ['6', 'help.addMode'],
    ],
  },
  {
    title: 'help.sectionSpeed',
    color: '#66ff66',
    entries: [
      ['= / +', 'help.speedUp'],
      ['-', 'help.speedDown'],
    ],
  },
];

export function createHelpPanel() {
  /** @type {HTMLElement | null} */
  let panel = null;
  let visible = false;

  function build() {
    const sections = SECTIONS.flatMap((section) => [
      el('div', { class: 'bhb-help__section', text: `▸ ${t(section.title)}` }),
      ...section.entries.map(([key, labelKey]) =>
        el('div', { class: 'bhb-help__entry' }, [
          el('b', { text: key, style: { color: section.color } }),
          el('span', { class: 'bhb-help__label', text: t(labelKey) }),
        ])
      ),
    ]);

    return el('div', { class: 'bhb-panel bhb-help' }, [
      el('div', { class: 'bhb-help__header' }, [
        el('span', { class: 'bhb-help__title', text: `📖 ${t('help.title')}` }),
        el('span', { class: 'bhb-muted', text: t('help.close') }),
      ]),
      ...sections,
      el('div', { class: 'bhb-help__footer', text: t('help.footer') }),
    ]);
  }

  function toggle() {
    visible = !visible;

    // Rebuilt on each open so a language change is picked up without a reload.
    if (panel) {
      panel.remove();
      panel = null;
    }
    if (visible) {
      panel = mount(build());
    }
  }

  return { toggle, isVisible: () => visible };
}
