import { el } from '../dom.js';
import { t } from '../../i18n/index.js';
import { startDragSelect } from '../dragselect.js';
import { WORLD_BOSSES } from '../../bot/worldboss.js';
import { Keys, keyLabel } from '../../core/keys.js';

/**
 * The screens tab.
 *
 * `minRatio` is the one number here that cannot be guessed, so every screen
 * shows its live ✓/✗ and measured ratio while the bot runs: it is tuned by
 * watching it, not by arithmetic.
 *
 * @param {object} deps
 * @param {() => import('../../bot/screen.js').Screen[]} deps.getScreens
 * @param {object} deps.screenEditor
 * @param {() => object} deps.getEngineState
 * @param {ReturnType<import('../store.js').createUiStore>} deps.store
 * @param {() => void} deps.refresh
 */
export function renderScreensTab(deps) {
  const screens = deps.getScreens();
  const active = deps.getEngineState().screen;

  function capture(screenId) {
    // The panel covers the game, so it gets out of the way for the drag.
    deps.store.closePanel();
    deps.refresh();
    startDragSelect(async (rect) => {
      if (rect) {
        await deps.screenEditor.captureAnchor(rect, screenId);
      }
      deps.store.openPanel();
      deps.refresh();
    });
  }

  // Armed here rather than always live: a stray S press starts a drag
  // nobody asked for otherwise. The hint below the toggle is the only
  // other thing needed; a second, separate button to start the same drag
  // the key already starts is one more control doing one job.
  const isScreenCaptureArmed = deps.store.get().isScreenCaptureArmed;
  const arm = el('button', {
    class: `bhb-task bhb-task--wrap ${isScreenCaptureArmed ? 'is-on' : ''}`,
  }, [
    el('span', { class: 'bhb-task__switch' }),
    el('span', { class: 'bhb-task__label', text: t('screens.armCapture') }),
    el('span', { class: 'bhb-kbd', text: keyLabel(Keys.CAPTURE_SCREEN) }),
  ]);
  arm.addEventListener('click', () => {
    deps.store.armScreenCapture(!isScreenCaptureArmed);
    deps.refresh();
  });

  const transferNote = el('p', { class: 'bhb-note' });

  const exportButton = el('button', { class: 'bhb-btn bhb-btn--small', text: t('screens.exportAll') });
  exportButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(deps.screenEditor.exportAll());
      transferNote.textContent = t('screens.exportCopied', { n: screens.length });
    } catch {
      transferNote.textContent = t('screens.exportCopyFailed');
    }
  });

  const importButton = el('button', { class: 'bhb-btn bhb-btn--small', text: t('screens.importAll') });
  importButton.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      const added = deps.screenEditor.importScreens(text);
      transferNote.textContent = t('screens.importAdded', { n: added });
      deps.refresh();
    } catch (error) {
      transferNote.textContent = error instanceof DOMException
        ? t('screens.pasteByHand')
        : `${t('screens.importFailed')}: ${error.message}`;
    }
  });

  const head = el('div', { class: 'bhb-field' }, [
    el('div', { class: 'bhb-field__head' }, [
      el('span', { class: 'bhb-label', text: `${t('screens.title')} · ${screens.length}` }),
      el('span', {
        class: 'bhb-mono bhb-screen__now',
        text: deps.getEngineState().screenName || t('screens.unknown'),
      }),
    ]),
    arm,
    el('p', { class: 'bhb-note', text: t('screens.captureHint') }),
    el('div', { class: 'bhb-field__head' }, [exportButton, importButton]),
    transferNote,
  ]);

  // Two screens matching at once is the quietest way to break a step set: the
  // runner takes the first, and a step gated to the second simply never comes
  // up — which reads exactly like a step whose turn has not arrived.
  const matching = screens.filter((screen) => {
    const score = deps.screenEditor.probe(screen.id);
    return Boolean(score && score.matched);
  });
  const clash =
    matching.length > 1
      ? el('p', { class: 'bhb-note bhb-note--warn bhb-screens__clash' }, [
          el('span', {
            text: t('screens.clash', {
              names: matching.map((screen) => screen.name || screen.id).join(', '),
              winner: matching[0].name || matching[0].id,
            }),
          }),
        ])
      : null;

  if (screens.length === 0) {
    return el('div', { class: 'bhb-tab' }, [
      head,
      el('p', { class: 'bhb-empty', text: t('screens.empty') }),
    ]);
  }

  const rows = screens.map((screen, index) => {
    const probe = deps.screenEditor.probe(screen.id);

    const name = el('input', { class: 'bhb-rule__name' });
    name.value = screen.name || '';
    name.placeholder = t('screens.unnamed');
    name.addEventListener('change', () => {
      deps.screenEditor.rename(screen.id, name.value.trim());
      deps.refresh();
    });

    const stops = el('button', {
      class: `bhb-icon ${screen.stopsTask ? 'is-danger-on' : ''}`,
      title: t('screens.stopsTask'),
      text: '⏹',
    });
    stops.addEventListener('click', () => {
      deps.screenEditor.setStopsTask(screen.id, !screen.stopsTask);
      deps.refresh();
    });

    const alertToggle = el('button', {
      class: `bhb-icon ${screen.notify ? 'is-notify-on' : ''}`,
      title: t('screens.notify'),
      text: '★',
    });
    alertToggle.addEventListener('click', () => {
      deps.screenEditor.setNotify(screen.id, !screen.notify);
      deps.refresh();
    });

    const add = el('button', { class: 'bhb-icon', title: t('screens.addAnchor'), text: '＋' });
    add.addEventListener('click', () => capture(screen.id));

    const copy = el('button', { class: 'bhb-icon', title: t('screens.duplicate'), text: '⧉' });
    copy.addEventListener('click', () => {
      const made = deps.screenEditor.duplicate(screen.id);
      deps.refresh();
      if (made) {
        const row = document.querySelector(`[data-screen-id="${CSS.escape(made.id)}"]`);
        const field = row ? row.querySelector('.bhb-rule__name') : null;
        if (row) {
          row.scrollIntoView({ block: 'nearest' });
        }
        if (field instanceof HTMLInputElement) {
          field.focus();
          field.select();
        }
      }
    });

    const up = el('button', { class: 'bhb-icon', title: t('steps.moveUp'), text: '▲' });
    up.addEventListener('click', () => {
      deps.screenEditor.move(screen.id, -1);
      deps.refresh();
    });

    const down = el('button', { class: 'bhb-icon', title: t('steps.moveDown'), text: '▼' });
    down.addEventListener('click', () => {
      deps.screenEditor.move(screen.id, 1);
      deps.refresh();
    });

    const remove = el('button', { class: 'bhb-icon bhb-icon--danger', title: t('steps.delete'), text: '✕' });
    remove.addEventListener('click', () => {
      deps.screenEditor.remove(screen.id);
      deps.refresh();
    });

    const ratio = el('input', { class: 'bhb-slider bhb-slider--thin' });
    ratio.type = 'range';
    ratio.min = '0.4';
    ratio.max = '1';
    ratio.step = '0.05';
    ratio.value = String(screen.minRatio);
    // The track's fill is a gradient stop, so the value has to be handed to CSS.
    ratio.style.setProperty('--bhb-fill', `${((screen.minRatio - 0.4) / 0.6) * 100}%`);
    ratio.addEventListener('input', () => {
      deps.screenEditor.setMinRatio(screen.id, Number(ratio.value));
      deps.refresh();
    });

    // A party screen names its own slot geometry, so a point captured on one
    // team mate's seat reads every seat the boss has, whichever one they are
    // sitting in today.
    const partyToggle = el('button', {
      class: `bhb-icon ${screen.isParty ? 'is-notify-on' : ''}`,
      title: t('screens.isParty'),
      text: '⛭',
    });
    partyToggle.addEventListener('click', () => {
      deps.screenEditor.setIsParty(screen.id, !screen.isParty);
      deps.refresh();
    });

    const party = screen.isParty
      ? (() => {
          const bossSelect = el('select', { class: 'bhb-rule__gate', title: t('screens.bossHint') });
          const blank = el('option', { text: t('screens.bossUnset') });
          blank.value = '';
          bossSelect.append(blank);
          for (const boss of WORLD_BOSSES) {
            const option = el('option', { text: `${boss.name} (${boss.slots})` });
            option.value = boss.id;
            bossSelect.append(option);
          }
          bossSelect.value = screen.bossId || '';
          bossSelect.addEventListener('change', () => {
            deps.screenEditor.setBossId(screen.id, bossSelect.value || null);
            deps.refresh();
          });

          const captureList = el('button', {
            class: 'bhb-btn',
            text: t('screens.captureList'),
          });
          captureList.addEventListener('click', () => {
            deps.store.closePanel();
            deps.refresh();
            startDragSelect((rect) => {
              if (rect) {
                deps.screenEditor.captureListFrame(rect, screen.id);
              }
              deps.store.openPanel();
              deps.refresh();
            });
          });

          const pitch = el('input', { class: 'bhb-rest bhb-mono', title: t('screens.pitchHint') });
          pitch.type = 'number';
          pitch.min = '1';
          pitch.max = '400';
          pitch.value = String(screen.pitch || 0);
          pitch.addEventListener('change', () => {
            deps.screenEditor.setPitch(screen.id, pitch.value);
            deps.refresh();
          });

          return el('div', { class: 'bhb-screen__party' }, [
            bossSelect,
            captureList,
            pitch,
          ]);
        })()
      : null;

    const classes = ['bhb-step', 'bhb-screen'];
    if (active === screen.id) {
      classes.push('is-active');
    }
    if (screen.stopsTask) {
      classes.push('is-stopper');
    }

    const wrap = el('div', { class: 'bhb-screen__wrap' }, [
      el('div', { class: classes.join(' ') }, [
        el('span', { class: 'bhb-rule__n', text: String(index + 1) }),
        el('span', {
          class: `bhb-screen__state ${probe && probe.matched ? 'is-seen' : ''}`,
          text: probe ? (probe.matched ? '✓' : '✗') : '·',
        }),
        name,
        el('span', {
          class: 'bhb-rule__coord bhb-mono',
          title: t('screens.ratioHint'),
          text: probe ? probe.ratio.toFixed(2) : '—',
        }),
        el('span', { class: 'bhb-rule__actions' }, [
          stops,
          alertToggle,
          partyToggle,
          add,
          copy,
          up,
          down,
          remove,
        ]),
      ]),
      el('div', { class: 'bhb-screen__tune' }, [
        el('span', { class: 'bhb-note', text: `${t('screens.anchors')} ${screen.anchors.length}` }),
        ratio,
        el('span', { class: 'bhb-mono bhb-note', text: screen.minRatio.toFixed(2) }),
      ]),
      party,
    ]);
    wrap.dataset.screenId = screen.id;
    return wrap;
  });

  return el('div', { class: 'bhb-tab' }, [
    head,
    clash,
    el('div', { class: 'bhb-steps' }, rows),
  ]);
}
