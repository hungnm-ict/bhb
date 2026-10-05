import { el } from '../dom.js';
import { t } from '../../i18n/index.js';
import { startDragSelect } from '../dragselect.js';
import { WORLD_BOSSES } from '../../bot/worldboss.js';
import { Keys, keyLabel } from '../../core/keys.js';

// Which screens have their anchor list open, by id. Module scope rather than
// the store: it is a scratch UI toggle, not something worth persisting or
// rebuilding the rest of the panel's state shape for.
const expandedAnchors = new Set();

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

  function capture(screenId, anchorIndex = null) {
    // The panel covers the game, so it gets out of the way for the drag.
    deps.store.closePanel();
    deps.refresh();
    startDragSelect(async (rect) => {
      if (rect) {
        await deps.screenEditor.captureAnchor(rect, screenId, anchorIndex);
      }
      deps.store.openPanel();
      deps.refresh();
    });
  }

  // One chip per anchor: the game moves on, so a single anchor going stale
  // used to mean deleting it and capturing a fresh one at the end of the
  // list — losing its place for no reason. Recapture overwrites it in place
  // instead. Folded shut by default: a screen rarely needs this once its
  // anchors are set, and listing every one of them every tick is exactly
  // the kind of row that pushed the name field back into clipping.
  //
  // The toggle doubles as the threshold slider's own label: "Anchors (2)"
  // right next to the slider it tunes reads as what it is, where a label
  // plus a separate toggle row below it read as two different settings.
  function renderAnchorsToggle(screen) {
    const isOpen = expandedAnchors.has(screen.id);
    const toggle = el('button', {
      class: 'bhb-note bhb-screen__anchortoggle',
      title: t('screens.matchThreshold'),
      text: `${isOpen ? '▾' : '▸'} ${t('screens.anchors')} (${screen.anchors.length})`,
    });
    toggle.addEventListener('click', () => {
      if (isOpen) {
        expandedAnchors.delete(screen.id);
      } else {
        expandedAnchors.add(screen.id);
      }
      deps.refresh();
    });
    return toggle;
  }

  function renderAnchorsList(screen) {
    const isOpen = expandedAnchors.has(screen.id);
    if (!isOpen || screen.anchors.length === 0) {
      return null;
    }

    const rows = screen.anchors.map((_, anchorIndex) => {
      const recaptureBtn = el('button', {
        class: 'bhb-icon',
        title: t('screens.recaptureAnchor', { n: anchorIndex + 1 }),
        text: '↻',
      });
      recaptureBtn.addEventListener('click', () => capture(screen.id, anchorIndex));

      const removeBtn = el('button', {
        class: 'bhb-icon bhb-icon--danger',
        title: t('screens.removeAnchor', { n: anchorIndex + 1 }),
        text: '✕',
      });
      removeBtn.addEventListener('click', () => {
        deps.screenEditor.removeAnchor(screen.id, anchorIndex);
        deps.store.hoverAnchor(null);
        deps.refresh();
      });

      const row = el('div', { class: 'bhb-screen__anchorrow' }, [
        el('span', { class: 'bhb-note', text: t('screens.anchorRow', { n: anchorIndex + 1 }) }),
        el('span', { class: 'bhb-screen__anchoractions' }, [recaptureBtn, removeBtn]),
      ]);
      // Hovering outlines the actual rectangle this anchor reads, over the
      // game — a colour fingerprint means nothing on its own otherwise.
      row.addEventListener('mouseenter', () => {
        deps.store.hoverAnchor({ screenId: screen.id, anchorIndex });
      });
      row.addEventListener('mouseleave', () => {
        deps.store.hoverAnchor(null);
      });
      return row;
    });

    return el('div', { class: 'bhb-screen__anchorlist' }, rows);
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

  // Each probe costs a `gl.readPixels`, which forces a GPU sync — fine for a
  // handful of screens, but a long list scored every tick is what stutters.
  // The row heights below are an estimate, not a measurement (the rows don't
  // exist yet to measure), so the window is padded generously on both sides:
  // a few extra rows probed for nothing costs far less than a stale icon on
  // a row that was actually in view.
  const ROW_HEIGHT_ESTIMATE = 70;
  const VIEWPORT_PAD = 3 * ROW_HEIGHT_ESTIMATE;
  const viewport = deps.screensViewport;
  function isNearViewport(index) {
    if (!viewport) {
      return true;
    }
    const top = index * ROW_HEIGHT_ESTIMATE;
    const bottom = top + ROW_HEIGHT_ESTIMATE;
    return bottom >= viewport.scrollTop - VIEWPORT_PAD
      && top <= viewport.scrollTop + viewport.clientHeight + VIEWPORT_PAD;
  }

  // One probe per screen per render: it costs a `gl.readPixels`, and scoring
  // the same frame against the same screen twice just doubles that for free.
  // Screens scrolled well out of view skip it entirely (see isNearViewport).
  const probes = new Map(
    screens.map((screen, index) => [
      screen.id,
      isNearViewport(index) ? deps.screenEditor.probe(screen.id) : null,
    ])
  );

  // Two screens matching at once is the quietest way to break a step set: the
  // runner takes the first, and a step gated to the second simply never comes
  // up — which reads exactly like a step whose turn has not arrived. This is
  // a live authoring aid, not the runner's own gating, so a clash involving a
  // screen scrolled out of view just waits until it scrolls back near one.
  const matching = screens.filter((screen) => {
    const score = probes.get(screen.id);
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
    const probe = probes.get(screen.id);

    // The title attribute is what makes a name readable on hover rather
    // than only after clicking in, once it is longer than the row is wide.
    const name = el('input', { class: 'bhb-rule__name', title: screen.name || '' });
    name.value = screen.name || '';
    name.placeholder = t('screens.unnamed');
    name.addEventListener('input', () => {
      name.title = name.value;
    });
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

    const add = el('button', { class: 'bhb-icon', title: t('screens.addAnchor'), text: '＋' });
    add.addEventListener('click', () => capture(screen.id));

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
            class: 'bhb-btn bhb-btn--small',
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
          class: `bhb-screen__state ${probe ? (probe.matched ? 'is-seen' : 'is-unseen') : ''}`,
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
          partyToggle,
          add,
          up,
          down,
          remove,
        ]),
      ]),
      // One shared threshold for every anchor on the screen, not one per
      // anchor. The toggle that doubles as its label is also the slider's
      // only on-screen hint of what "Anchors (N)" is there for.
      el('div', { class: 'bhb-screen__tune' }, [
        renderAnchorsToggle(screen),
        ratio,
        el('span', { class: 'bhb-mono bhb-note', text: screen.minRatio.toFixed(2) }),
      ]),
      renderAnchorsList(screen),
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
