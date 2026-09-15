import { el } from '../dom.js';
import { t } from '../../i18n/index.js';
import { Keys, keyLabel } from '../../core/keys.js';
import { VERSION } from '../../core/constants.js';

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
      [keyLabel(Keys.RERUN), 'help.rerun'],
      [keyLabel(Keys.WORLD_BOSS), 'help.wb'],
      [keyLabel(Keys.SCRIPT), 'help.script'],
      [keyLabel(Keys.RUN_ALL), 'help.runAll'],
    ],
  },
  {
    title: 'help.sectionSteps',
    entries: [
      [keyLabel(Keys.CAPTURE), 'help.capture'],
    ],
  },
  {
    title: 'help.sectionUi',
    entries: [
      [keyLabel(Keys.PANEL), 'help.togglePanel'],
      [keyLabel(Keys.CLOSE_PANEL), 'help.closePanel'],
    ],
  },
  {
    title: 'help.sectionSpeed',
    entries: [
      [`${Keys.SPEED_UP} / ${Keys.SPEED_UP_ALT}`, 'help.speedUp'],
      [Keys.SPEED_DOWN, 'help.speedDown'],
    ],
  },
];

export function renderHelpTab() {
  // The version lives here now: this is where someone looks before reporting
  // that something is broken.
  const stamp = el('div', { class: 'bhb-field__head' }, [
    el('span', { class: 'bhb-panel__name', text: t('app.name') }),
    el('span', { class: 'bhb-panel__ver bhb-mono', text: `v${VERSION}` }),
  ]);

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
    stamp,
    ...sections,
    el('p', { class: 'bhb-note bhb-help__footer', text: t('help.footer') }),
  ]);
}
