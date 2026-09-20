import { el } from '../dom.js';
import { t, getLanguage } from '../../i18n/index.js';
import { ScaleMode } from '../../core/coords.js';
import { renderQueueSection } from './queue.js';
import { NOTIFY_EVENTS, hasNotifyTarget } from '../../core/notify.js';
import { LOCK_SIZES, normaliseLockSize } from '../../core/canvas-lock.js';
import { VERSION } from '../../core/constants.js';
import { checkForUpdate, SCRIPT_URL } from '../../core/update.js';
import { renderProbeSection } from './probes.js';

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

/**
 * Pinning the game's size.
 *
 * Experimental, and labelled as such: it depends on the game sizing its
 * framebuffer from its container, which is true of the builds seen so far but
 * is not a promise anyone made.
 */
function renderCanvasLock(deps, toggleRow) {
  const lock = deps.settings.canvasLock;

  function update(changes) {
    deps.updateSettings({ canvasLock: { ...lock, ...changes } });
    deps.refresh();
  }

  const chosen = normaliseLockSize(lock);
  const size = el('select', { class: 'bhb-select', title: t('lock.size') });
  for (const offered of LOCK_SIZES) {
    const option = el('option', { text: `${offered.width}×${offered.height}` });
    option.value = `${offered.width}x${offered.height}`;
    size.append(option);
  }
  size.value = `${chosen.width}x${chosen.height}`;
  size.disabled = !lock.enabled;
  size.addEventListener('change', () => {
    const [width, height] = size.value.split('x').map(Number);
    update({ width, height });
  });

  return el('div', { class: 'bhb-field' }, [
    toggleRow('lock.enabled', lock.enabled, (value) => update({ enabled: value })),
    size,
    el('p', { class: 'bhb-note', text: t('lock.hint') }),
    el('p', { class: 'bhb-note', text: t('lock.sizeHint') }),
  ]);
}

/**
 * The update check's answer, kept across renders.
 *
 * The panel rebuilds on every tick, and a result that vanished a second after
 * the user pressed the button would be no answer at all.
 *
 * @type {{ state: 'idle'|'checking'|'current'|'newer'|'failed'|'installing', latest: string | null }}
 */
let updateResult = { state: 'idle', latest: null };

function renderVersion(deps) {
  const check = el('button', { class: 'bhb-btn bhb-btn--small', text: t('update.check') });
  check.addEventListener('click', () => {
    updateResult = { state: 'checking', latest: null };
    deps.refresh();
    checkForUpdate().then((result) => {
      if (!result.ok) {
        updateResult = { state: 'failed', latest: null };
      } else {
        updateResult = { state: result.hasUpdate ? 'newer' : 'current', latest: result.latest };
      }
      deps.refresh();
    });
  });

  const messages = {
    idle: '',
    checking: t('update.checking'),
    current: t('update.current'),
    newer: t('update.newer', { version: updateResult.latest || '' }),
    installing: t('update.installing'),
    failed: t('update.failed'),
  };

  // Opening the raw URL is what hands the new build to Tampermonkey; its own
  // scheduled check often will not have run yet.
  const install = el('button', { class: 'bhb-btn bhb-btn--small', text: t('update.install') });
  install.addEventListener('click', () => {
    window.open(`${SCRIPT_URL}?at=${Date.now()}`, '_blank', 'noopener');
    // A userscript is only swapped in on the next page load, so the reload is
    // the second half of installing — offered rather than done, because it
    // would otherwise interrupt whatever the bot is in the middle of.
    updateResult = { ...updateResult, state: 'installing' };
    deps.refresh();
  });

  const reload = el('button', { class: 'bhb-btn bhb-btn--small', text: t('update.reload') });
  reload.addEventListener('click', () => {
    window.location.reload();
  });

  return el('div', { class: 'bhb-field' }, [
    el('div', { class: 'bhb-btnrow' }, [
      check,
      updateResult.state === 'newer' ? install : null,
      updateResult.state === 'installing' ? reload : null,
    ]),
    el('p', {
      class: `bhb-note ${updateResult.state === 'newer' || updateResult.state === 'installing' ? 'bhb-note--warn' : ''}`,
      text: messages[updateResult.state],
    }),
    el('p', { class: 'bhb-note', text: t('update.hint') }),
  ]);
}

/**
 * One collapsible section.
 *
 * The summary on the right is the reason this is not a plain accordion: most
 * visits here are to check a setting rather than change one, and a row that
 * says "tắt · 640×400" answers that without being opened at all.
 *
 * One section is open at a time, so the tab cannot grow back into the page it
 * was, and which one survives a reload — it is usually the same one twice.
 */
function section(deps, id, titleKey, summary, build) {
  const isOpen = deps.settings.openSection === id;

  const head = el('button', { class: `bhb-fold__head ${isOpen ? 'is-open' : ''}` }, [
    el('span', { class: 'bhb-fold__caret', text: isOpen ? '▾' : '▸' }),
    el('span', { class: 'bhb-label', text: t(titleKey) }),
    el('span', { class: 'bhb-fold__summary', text: summary || '' }),
  ]);
  head.addEventListener('click', () => {
    deps.updateSettings({ openSection: isOpen ? null : id });
    deps.refresh();
  });

  return el('div', { class: `bhb-fold ${isOpen ? 'is-open' : ''}` }, [
    head,
    // Built only when open: the alerts section alone is three inputs and five
    // switches, and nothing is gained by constructing it to hide it.
    isOpen ? el('div', { class: 'bhb-fold__body' }, [build()]) : null,
  ]);
}

/** How many of the behaviour switches are on, for the summary. */
function countBehaviour(settings) {
  const switches = [
    settings.watchdog,
    settings.closeAfterRound,
    settings.keepAlive,
    settings.sizeBadge,
    settings.fpsBadge,
    settings.clockSafety,
    settings.scaleMode === ScaleMode.ABSOLUTE,
  ];
  return switches.filter(Boolean).length;
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

  const notify = settings.notify;
  const channels = [
    notify.discordWebhook ? 'Discord' : null,
    notify.telegramToken && notify.telegramChat ? 'Telegram' : null,
  ].filter(Boolean);

  return el('div', { class: 'bhb-tab bhb-tab--folds' }, [
    section(deps, 'profiles', 'settings.profiles', profiles.activeName(), () =>
      el('div', { class: 'bhb-field' }, [
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
      ])
    ),

    section(
      deps,
      'behaviour',
      'settings.behaviour',
      t('settings.onCount', { n: countBehaviour(settings), total: 5 }),
      () =>
        el('div', { class: 'bhb-field' }, [
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
          toggleRow('settings.clockSafety', settings.clockSafety, (value) =>
            deps.updateSettings({ clockSafety: value })
          ),
          toggleRow('settings.fpsBadge', settings.fpsBadge, (value) =>
            deps.updateSettings({ fpsBadge: value })
          ),
          toggleRow('settings.sizeBadge', settings.sizeBadge, (value) =>
            deps.updateSettings({ sizeBadge: value })
          ),
          toggleRow('settings.absoluteCoords', settings.scaleMode === ScaleMode.ABSOLUTE, (value) =>
            deps.updateSettings({ scaleMode: value ? ScaleMode.ABSOLUTE : ScaleMode.SCALE })
          ),
          el('p', { class: 'bhb-note', text: t('settings.watchdogHint') }),
          el('p', { class: 'bhb-note', text: t('settings.keepAliveHint') }),
        ])
    ),

    section(deps, 'queue', 'queue.title', t('settings.queueCount', {
      n: deps.getActivities().filter((activity) => activity.enabled).length,
    }), () => renderQueueSection(deps)),

    section(
      deps,
      'lock',
      'lock.title',
      `${t(settings.canvasLock.enabled ? 'settings.on' : 'settings.off')} · ${
        normaliseLockSize(settings.canvasLock).width
      }×${normaliseLockSize(settings.canvasLock).height}`,
      () => renderCanvasLock(deps, toggleRow)
    ),

    section(
      deps,
      'probes',
      'probe.title',
      deps.getProbes().length > 0
        ? t('probe.count', { n: deps.getProbes().length })
        : t('probe.none'),
      () => renderProbeSection(deps, toggleRow)
    ),

    section(
      deps,
      'alerts',
      'notify.title',
      channels.length > 0 && notify.enabled ? channels.join(' + ') : t('settings.off'),
      () => renderAlerts(deps, toggleRow)
    ),

    section(deps, 'language', 'settings.language', getLanguage() === 'vi' ? 'Tiếng Việt' : 'English', () =>
      el('div', { class: 'bhb-field' }, [languagePicker])
    ),

    section(
      deps,
      'version',
      'update.title',
      updateResult.state === 'newer' ? t('update.badge', { version: updateResult.latest }) : `v${VERSION}`,
      () => renderVersion(deps)
    ),

    section(deps, 'transfer', 'settings.transfer', '', () =>
      el('div', { class: 'bhb-field' }, [
        transfer,
        el('div', { class: 'bhb-btnrow' }, [exportButton, importButton]),
      ])
    ),
  ]);
}
