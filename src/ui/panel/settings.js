import { el } from '../dom.js';
import { t, getLanguage } from '../../i18n/index.js';
import { ScaleMode } from '../../core/coords.js';
import { renderQueueSection } from './queue.js';
import { NOTIFY_EVENTS, hasNotifyTarget } from '../../core/notify.js';

/**
 * Settings, and the first home for the profile list.
 *
 * Export and import go through a textarea: a file picker would need `@grant`,
 * and the clipboard is not reliable inside a userscript sandbox.
 *
 * @param {object} deps
 * @param {object} deps.profiles profile actions, see main.js
 * @param {object} deps.settings current settings
 * @param {(changes: object) => void} deps.updateSettings
 * @param {() => number} deps.getReloadCount
 * @param {() => void} deps.refresh
 */
/**
 * The import box outlives its render.
 *
 * The panel is rebuilt on every engine tick, and a textarea rebuilt under the
 * user is a pasted profile silently thrown away. Keeping the node itself keeps
 * both the text and the caret.
 *
 * @type {HTMLTextAreaElement | null}
 */
let transferBox = null;

/**
 * The alert fields outlive their render too, for the same reason the transfer
 * box does: a webhook URL is long, and half of one is worth nothing.
 *
 * @type {Record<string, HTMLInputElement>}
 */
const alertBoxes = {};

/**
 * Alerts: one channel, a few event kinds, and a way to prove it works.
 *
 * The test button is not a convenience — a webhook typo fails silently out on
 * the network, and without it the first thing a user learns is that the alert
 * they were waiting for all night never came.
 */
function renderAlerts(deps, toggleRow) {
  const config = deps.settings.notify;

  function update(changes) {
    deps.updateSettings({ notify: { ...config, ...changes } });
    // The settings tab is not on the live-redraw list, so without this a pasted
    // webhook leaves the "no channel yet" warning sitting there.
    deps.refresh();
  }

  function field(key, labelKey) {
    if (!alertBoxes[key]) {
      const input = el('input', { class: 'bhb-input' });
      input.type = 'text';
      input.spellcheck = false;
      input.addEventListener('change', () => {
        update({ [key]: input.value.trim() });
      });
      alertBoxes[key] = input;
    }
    const input = alertBoxes[key];
    input.placeholder = t(labelKey);
    // Only while the user is elsewhere: writing into a focused field would
    // move the caret to the end on every engine tick.
    if (document.activeElement !== input) {
      input.value = config[key] || '';
    }
    return input;
  }

  const eventRows = NOTIFY_EVENTS.map((kind) =>
    toggleRow(`notify.event.${kind}`, config.events.includes(kind), (value) => {
      const events = value
        ? [...config.events, kind]
        : config.events.filter((entry) => entry !== kind);
      update({ events });
    })
  );

  const test = el('button', { class: 'bhb-btn bhb-btn--small', text: t('notify.test') });
  const testResult = el('span', { class: 'bhb-note' });
  test.addEventListener('click', () => {
    testResult.textContent = '…';
    deps.sendTestAlert().then((sent) => {
      testResult.textContent = t(sent ? 'notify.testSent' : 'notify.testFailed');
    });
  });

  return el('div', { class: 'bhb-field' }, [
    el('div', { class: 'bhb-field__head' }, [
      el('span', { class: 'bhb-label', text: t('notify.title') }),
    ]),
    toggleRow('notify.enabled', config.enabled, (value) => update({ enabled: value })),
    field('discordWebhook', 'notify.discord'),
    field('telegramToken', 'notify.telegramToken'),
    field('telegramChat', 'notify.telegramChat'),
    hasNotifyTarget(config)
      ? null
      : el('p', { class: 'bhb-note bhb-note--warn', text: t('notify.noTarget') }),
    el('div', { class: 'bhb-field__head' }, [
      el('span', { class: 'bhb-label', text: t('notify.events') }),
    ]),
    ...eventRows,
    toggleRow('notify.withShot', config.withShot, (value) => update({ withShot: value })),
    el('div', { class: 'bhb-btnrow' }, [test, testResult]),
    el('p', { class: 'bhb-note', text: t('notify.hint') }),
  ]);
}

export function renderSettingsTab(deps) {
  const { profiles, settings } = deps;
  const list = profiles.list();
  const activeId = profiles.activeId();

  const picker = el('select', { class: 'bhb-select' });
  for (const profile of list) {
    const option = el('option', { text: profile.name });
    option.value = profile.id;
    picker.append(option);
  }
  picker.value = activeId;
  picker.addEventListener('change', () => {
    profiles.setActive(picker.value);
    deps.refresh();
  });

  function action(labelKey, run) {
    const button = el('button', { class: 'bhb-btn bhb-btn--small', text: t(labelKey) });
    button.addEventListener('click', () => {
      run();
      deps.refresh();
    });
    return button;
  }

  if (!transferBox) {
    transferBox = el('textarea', { class: 'bhb-textarea' });
    transferBox.spellcheck = false;
  }
  const transfer = transferBox;
  transfer.placeholder = t('settings.transferHint');

  const exportButton = action('settings.export', () => {
    transfer.value = profiles.exportAll();
  });

  const importButton = el('button', { class: 'bhb-btn bhb-btn--small', text: t('settings.import') });
  importButton.addEventListener('click', () => {
    try {
      profiles.importAll(transfer.value);
      transfer.value = '';
      deps.refresh();
    } catch (error) {
      transfer.value = `${t('settings.importFailed')}: ${error.message}`;
    }
  });

  // The same switch as the task tab's: a settings page of dim little circles
  // reads as a wall of grey text.
  function toggleRow(labelKey, value, onChange, note) {
    const row = el('button', { class: `bhb-task bhb-task--wrap ${value ? 'is-on' : ''}` }, [
      el('span', { class: 'bhb-task__switch' }),
      el('span', { class: 'bhb-task__label', text: t(labelKey) }),
      note ? el('span', { class: 'bhb-mono bhb-task__phase', text: note }) : null,
    ]);
    row.addEventListener('click', () => {
      onChange(!value);
      deps.refresh();
    });
    return row;
  }

  const languagePicker = el('select', { class: 'bhb-select' });
  for (const [code, label] of [['vi', 'Tiếng Việt'], ['en', 'English']]) {
    const option = el('option', { text: label });
    option.value = code;
    languagePicker.append(option);
  }
  languagePicker.value = getLanguage();
  languagePicker.addEventListener('change', () => {
    deps.updateSettings({ language: languagePicker.value });
    deps.refresh();
  });

  const reloads = deps.getReloadCount();

  return el('div', { class: 'bhb-tab' }, [
    el('div', { class: 'bhb-field' }, [
      el('div', { class: 'bhb-field__head' }, [
        el('span', { class: 'bhb-label', text: t('settings.profiles') }),
      ]),
      picker,
      el('div', { class: 'bhb-btnrow' }, [
        action('settings.newProfile', () => profiles.create(t('settings.newProfileName'))),
        action('settings.duplicate', () => profiles.duplicate()),
        action('settings.rename', () => {
          const name = window.prompt(t('settings.renamePrompt'), profiles.activeName());
          if (name) {
            profiles.rename(activeId, name.trim());
          }
        }),
        action('settings.delete', () => profiles.remove(activeId)),
      ]),
      el('p', { class: 'bhb-note', text: t('settings.profilesHint') }),
    ]),

    el('div', { class: 'bhb-field' }, [
      el('div', { class: 'bhb-field__head' }, [
        el('span', { class: 'bhb-label', text: t('settings.behaviour') }),
      ]),
      toggleRow(
        'settings.watchdog',
        settings.watchdog,
        (value) => deps.updateSettings({ watchdog: value }),
        reloads > 0 ? t('settings.reloads', { n: reloads }) : null
      ),
      toggleRow('queue.closeAfterRound', settings.closeAfterRound, (value) =>
        deps.updateSettings({ closeAfterRound: value })
      ),
      toggleRow('settings.keepAlive', settings.keepAlive, (value) =>
        deps.updateSettings({ keepAlive: value })
      ),
      toggleRow('settings.sizeBadge', settings.sizeBadge, (value) =>
        deps.updateSettings({ sizeBadge: value })
      ),
      toggleRow('settings.absoluteCoords', settings.scaleMode === ScaleMode.ABSOLUTE, (value) =>
        deps.updateSettings({ scaleMode: value ? ScaleMode.ABSOLUTE : ScaleMode.SCALE })
      ),
      el('p', { class: 'bhb-note', text: t('settings.watchdogHint') }),
      el('p', { class: 'bhb-note', text: t('settings.keepAliveHint') }),
    ]),

    renderQueueSection(deps),

    renderAlerts(deps, toggleRow),

    el('div', { class: 'bhb-field' }, [
      el('div', { class: 'bhb-field__head' }, [
        el('span', { class: 'bhb-label', text: t('settings.language') }),
      ]),
      languagePicker,
    ]),

    el('div', { class: 'bhb-field' }, [
      el('div', { class: 'bhb-field__head' }, [
        el('span', { class: 'bhb-label', text: t('settings.transfer') }),
      ]),
      transfer,
      el('div', { class: 'bhb-btnrow' }, [exportButton, importButton]),
    ]),
  ]);
}
