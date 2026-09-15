import { el } from '../dom.js';
import { t } from '../../i18n/index.js';

/**
 * Keyboard reference.
 *
 * It is the last tab rather than a panel of its own: a floating window that
 * explains the panel, opened from inside the panel, was one window too many.
 */

const SECTIONS = [
  {
    title: 'help.sectionAuto',
    entries: [
      ['3', 'help.rerun'],
      ['4', 'help.wb'],
      ['5', 'help.script'],
      ['6', 'help.runAll'],
    ],
  },
  {
    title: 'help.sectionRules',
    entries: [
      ['0', 'help.capture'],
    ],
  },
  {
    title: 'help.sectionUi',
    entries: [
      ['1', 'help.togglePanel'],
    ],
  },
  {
    title: 'help.sectionSpeed',
    entries: [
      ['= / +', 'help.speedUp'],
      ['-', 'help.speedDown'],
    ],
  },
];

export function renderHelpTab() {
  const sections = SECTIONS.flatMap((section) => [
    el('div', { class: 'bhb-help__section', text: `▸ ${t(section.title)}` }),
    ...section.entries.map(([key, labelKey]) =>
      el('div', { class: 'bhb-help__entry' }, [
        el('b', { text: key }),
        el('span', { class: 'bhb-help__label', text: t(labelKey) }),
      ])
    ),
  ]);

  return el('div', { class: 'bhb-tab bhb-help' }, [
    ...sections,
    el('p', { class: 'bhb-note bhb-help__footer', text: t('help.footer') }),
  ]);
}
