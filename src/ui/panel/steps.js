import { el } from '../dom.js';
import { t } from '../../i18n/index.js';
import { Keys, keyLabel } from '../../core/keys.js';
import { StepKind, pointsByPlace } from '../../bot/step.js';
import { isLegacyPoint } from '../../core/coords.js';
import { startDragSelect } from '../dragselect.js';
import { getRenderTarget } from '../../core/canvas.js';
import { getBufferSize } from '../../core/coords.js';
import { scoreStepDetail } from '../../bot/dry-run.js';
import { exportSteps, importSteps, mergeSteps } from '../../bot/step-pack.js';

/**
 * The steps table.
 *
 * Paired with the marker layer: hovering a row lights the marker on the canvas
 * and the other way round, which is how a bare coordinate becomes a place.
 */

/**
 * @param {object} deps
 * @param {() => import('../../bot/step.js').Step[]} deps.getSteps
 * @param {ReturnType<import('../store.js').createUiStore>} deps.store
 * @param {() => import('../../bot/screen.js').Screen[]} deps.getScreens
 * @param {() => import('../../bot/activity.js').Activity[]} deps.getActivities
 * @param {object} deps.stepEditor
 * @param {() => void} deps.refresh
 */
/** @type {Map<string, HTMLElement>} step id to its row, for highlighting */
const rows = new Map();

/** Lighting a row is a class change; it never needs the table rebuilt. */
const peekWatchers = new WeakSet();

/**
 * Ends a preview once the pointer is off its ◉. Matched by step id rather than
 * by node, because the row the button sits in is rebuilt on every change.
 */
function releasePeek(store) {
  if (peekWatchers.has(store)) {
    return;
  }
  peekWatchers.add(store);
  document.addEventListener('pointermove', (event) => {
    const previewing = store.get().previewStepId;
    if (previewing === null) {
      return;
    }
    const button = event.target instanceof Element ? event.target.closest('[data-peek-step]') : null;
    if (button === null || button.dataset.peekStep !== previewing) {
      store.previewStep(null);
    }
  });
}

export function highlightSteps(state) {
  for (const [stepId, row] of rows) {
    row.classList.toggle('is-selected', state.selectedStepId === stepId);
    row.classList.toggle('is-hovered', state.hoveredStepId === stepId);
  }
}

/** Kept across renders: the tab rebuilds every tick, and a box that emptied
 *  itself under the user's hands would be unusable. */
let packBox = null;
/** The three paragraphs explaining capture: read once, then in the way. */
let areHintsOpen = false;
/** What this tab last wrote into the box, so a paste is never overwritten. */
let packedValue = null;

/** True when a pack was captured on a different pinned size than this window. */
function mismatch(packLock, windowLock) {
  if (!packLock || !windowLock) {
    return false;
  }
  return packLock.width !== windowLock.width || packLock.height !== windowLock.height;
}

/**
 * What this step's spot looks like on screen right now.
 *
 * A step that will not fire gives the same silence whether it is pointed at
 * the wrong place or at the right one in the wrong shade, and those need
 * opposite fixes. Read only for the step being previewed: it costs a
 * `readPixels`, and the answer is only wanted about one step at a time.
 *
 * @returns {{ verdict: string, drift?: number, seen?: string } | null}
 */
function readLive(step, deps, screenId) {
  const target = getRenderTarget();
  if (!target) {
    return null;
  }
  return scoreStepDetail(
    step,
    target.gl,
    getBufferSize(target.canvas),
    deps.settings.scaleMode,
    screenId
  );
}

/**
 * What to show before the user has narrowed anything.
 *
 * A profile with twenty steps across eight activities opened on a list nobody
 * was working in. Whatever Run is set to run is what they came here to edit.
 *
 * @returns {string | null} an activity id, '' for the loose set, null for all
 */
function filterForRunTarget(deps) {
  const target = deps.getRunTarget ? deps.getRunTarget() : null;
  if (target === 'script') {
    return '';
  }
  if (!target || target === 'runAll') {
    return null;
  }
  return deps.getActivities().some((activity) => activity.id === target) ? target : null;
}

export function renderStepsTab(deps) {
  const all = deps.getSteps();
  const engineState = deps.getEngineState();
  const expectedStepId = engineState.expectedStepId;
  const engineScreen = engineState.screen || null;
  const state = deps.store.get();
  const activities = deps.getActivities();
  // Eight activities' steps in one list is unreadable, so the table is filtered.
  const filter = state.stepFilter === undefined ? filterForRunTarget(deps) : state.stepFilter;
  const steps = filter === null ? all : all.filter((step) => (step.activity || '') === filter);

  // The hotkey is armed here rather than always live: `0` sits beside the keys
  // that start the bot, and a stray press mid-fight captures whatever the
  // cursor happened to be over. The button below is explicit, so it always works.
  const isArmed = state.isCaptureArmed;
  const arm = el('button', { class: `bhb-task bhb-task--wrap ${isArmed ? 'is-on' : ''}` }, [
    el('span', { class: 'bhb-task__switch' }),
    el('span', { class: 'bhb-task__label', text: t('steps.armCapture') }),
    el('span', { class: 'bhb-kbd', text: keyLabel(Keys.CAPTURE) }),
  ]);
  arm.addEventListener('click', () => {
    deps.store.armCapture(!isArmed);
    deps.refresh();
  });

  const isDryRunning = state.dryRun !== null;

  const dryRun = el('button', { class: `bhb-btn ${isDryRunning ? 'is-busy' : ''}` }, [
    el('span', { text: isDryRunning ? t('steps.dryRunStop') : t('steps.dryRun') }),
  ]);
  dryRun.addEventListener('click', () => {
    if (isDryRunning) {
      deps.dryRunner.stop();
    } else {
      deps.dryRunner.start();
    }
    deps.refresh();
  });

  const pin = el('button', {
    class: `bhb-btn ${state.areMarkersPinned ? 'is-busy' : ''}`,
    text: t('steps.pinMarkers'),
  });
  pin.addEventListener('click', () => {
    deps.store.pinMarkers(!state.areMarkersPinned);
    deps.refresh();
  });

  const capture = el('button', { class: 'bhb-btn bhb-btn--primary' }, [
    el('span', { class: 'bhb-btn__dot' }),
    el('span', { text: t('steps.capture') }),
  ]);
  capture.addEventListener('click', async () => {
    await deps.stepEditor.captureAtCursor();
    deps.refresh();
  });

  const hintToggle = el('button', {
    class: `bhb-icon bhb-steps__hints ${areHintsOpen ? 'is-on' : ''}`,
    title: t('steps.hints'),
    text: '?',
  });
  hintToggle.addEventListener('click', () => {
    areHintsOpen = !areHintsOpen;
    deps.refresh();
  });

  const filterSelect = el('select', { class: 'bhb-rule__gate', title: t('steps.filter') });
  // Activities first: they are what the list is usually being narrowed to. The
  // two catch-alls sit at the bottom, where widening out again is one reach.
  for (const activity of activities) {
    const option = el('option', { text: activity.name });
    option.value = activity.id;
    filterSelect.append(option);
  }
  // The two below the line are not modes to farm; they are how a step set is
  // read and exported whole.
  const divider = el('option', { text: '──────────' });
  divider.disabled = true;
  filterSelect.append(divider);
  for (const [value, label] of [['', t('steps.loose')], ['__all__', t('steps.allSteps')]]) {
    const option = el('option', { text: label });
    option.value = value;
    filterSelect.append(option);
  }
  filterSelect.value = filter === null ? '__all__' : filter;
  filterSelect.addEventListener('change', () => {
    deps.store.setRuleFilter(filterSelect.value === '__all__' ? null : filterSelect.value);
    deps.refresh();
  });

  // Moving twenty steps one dropdown at a time is the same choice twenty times.
  const moveAll = el('select', { class: 'bhb-rule__gate', title: t('steps.moveAll') });
  const movePrompt = el('option', { text: t('steps.moveAll') });
  movePrompt.value = '__none__';
  moveAll.append(movePrompt);
  const looseTarget = el('option', { text: t('steps.noActivity') });
  looseTarget.value = '';
  moveAll.append(looseTarget);
  for (const activity of activities) {
    const option = el('option', { text: activity.name });
    option.value = activity.id;
    moveAll.append(option);
  }
  moveAll.value = '__none__';
  moveAll.disabled = steps.length === 0;
  moveAll.addEventListener('change', () => {
    if (moveAll.value === '__none__') {
      return;
    }
    const target = moveAll.value || null;
    for (const step of steps) {
      deps.stepEditor.setActivity(step.id, target);
    }
    deps.refresh();
  });

  // A legacy step cannot be rescaled, so it clicks the wrong place the moment
  // the window moves — loud enough to act on, not a ⚠ to squint at.
  const legacyCount = all.filter((step) => step.points[0] && isLegacyPoint(step.points[0])).length;

  // Carrying a combo to another window: each instance is its own browser
  // profile, so the only road between them is text.
  //
  // The box survives the tick that rebuilds this tab, and it refills itself
  // from the filter — but only while it still holds what it last put there.
  // Once the user has pasted or typed, that is theirs to keep.
  if (!packBox) {
    packBox = el('textarea', { class: 'bhb-textarea' });
    packBox.spellcheck = false;
  }
  const transfer = packBox;
  transfer.placeholder = t('steps.transferHint');

  const lock = deps.getCanvasLock ? deps.getCanvasLock() : null;
  const packed = steps.length > 0 ? exportSteps(steps, lock) : '';
  if (transfer.value === packedValue || transfer.value === '') {
    transfer.value = packed;
  }
  packedValue = packed;

  function load(text) {
    try {
      const pack = importSteps(text);
      deps.stepEditor.replaceAll(mergeSteps(deps.getSteps(), pack.steps));
      note.textContent = mismatch(pack.lock, lock)
        ? t('steps.importedButSized', {
            from: `${pack.lock.width}×${pack.lock.height}`,
            to: `${lock.width}×${lock.height}`,
          })
        : t('steps.imported', { n: pack.steps.length });
      // The next render repacks from the filter rather than keeping the paste.
      packedValue = null;
      deps.refresh();
    } catch (error) {
      note.textContent = `${t('steps.importFailed')}: ${error.message}`;
    }
  }

  const note = el('p', { class: 'bhb-note' });

  const exportButton = el('button', {
    class: 'bhb-btn bhb-btn--small',
    text: t('steps.export'),
  });
  exportButton.addEventListener('click', async () => {
    transfer.select();
    try {
      await navigator.clipboard.writeText(transfer.value);
      note.textContent = t('steps.copied', { n: steps.length });
    } catch {
      // Clipboard access can be refused; the text is selected either way.
      note.textContent = t('steps.copyByHand');
    }
  });

  const importButton = el('button', {
    class: 'bhb-btn bhb-btn--small',
    text: t('steps.import'),
  });
  importButton.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      transfer.value = text;
      load(text);
    } catch {
      note.textContent = t('steps.pasteByHand');
      transfer.focus();
    }
  });

  // Pasting straight into the box counts as asking for it to be loaded.
  transfer.addEventListener('paste', (event) => {
    const text = event.clipboardData && event.clipboardData.getData('text');
    if (!text) {
      return;
    }
    event.preventDefault();
    transfer.value = text;
    load(text);
  });

  const head = el('div', { class: 'bhb-field' }, [
    el('div', { class: 'bhb-field__head' }, [
      el('span', { class: 'bhb-label', text: `${t('overlay.steps')} · ${steps.length}` }),
      hintToggle,
      filterSelect,
    ]),
    el('div', { class: 'bhb-btnrow' }, [moveAll]),
    arm,
    capture,
    el('div', { class: 'bhb-btnrow' }, [dryRun, pin]),
    el('div', { class: 'bhb-btnrow' }, [exportButton, importButton]),
    transfer,
    note,
    areHintsOpen ? el('p', { class: 'bhb-note', text: t('steps.captureHint') }) : null,
    areHintsOpen ? el('p', { class: 'bhb-note', text: t('steps.armHint') }) : null,
    areHintsOpen ? el('p', { class: 'bhb-note', text: t('steps.dryRunHint') }) : null,
    legacyCount > 0
      ? el('p', { class: 'bhb-note bhb-note--warn', text: t('steps.legacyWarning', { n: legacyCount }) })
      : null,
  ]);

  if (steps.length === 0) {
    return el('div', { class: 'bhb-tab' }, [head, el('p', { class: 'bhb-empty', text: t('overlay.noSteps') })]);
  }

  rows.clear();
  const stepRows = steps.map((step, index) => {
    const point = step.points[0];
    const miss = state.dryRun && state.dryRun.misses ? state.dryRun.misses[step.id] : null;
    const legacy = point && isLegacyPoint(point);

    const name = el('input', { class: 'bhb-rule__name' });
    name.value = step.label || '';
    name.placeholder = t('steps.unnamed');
    name.addEventListener('change', () => {
      deps.stepEditor.rename(step.id, name.value.trim());
      deps.refresh();
    });

    const slot = el('select', { class: 'bhb-rule__gate', title: t('steps.activity') });
    const loose = el('option', { text: t('steps.noActivity') });
    loose.value = '';
    slot.append(loose);
    for (const activity of activities) {
      const option = el('option', { text: activity.name });
      option.value = activity.id;
      slot.append(option);
    }
    slot.value = step.activity || '';
    slot.addEventListener('change', () => {
      deps.stepEditor.setActivity(step.id, slot.value || null);
      deps.refresh();
    });

    const gate = el('select', { class: 'bhb-rule__gate', title: t('steps.screenGate') });
    gate.append(el('option', { text: t('steps.anywhere') }));
    gate.options[0].value = '';
    for (const screen of deps.getScreens()) {
      const option = el('option', { text: screen.name || screen.id });
      option.value = screen.id;
      gate.append(option);
    }
    gate.value = (step.screens && step.screens[0]) || '';
    gate.addEventListener('change', () => {
      deps.stepEditor.setScreens(step.id, gate.value ? [gate.value] : []);
      deps.refresh();
    });

    const toggle = el('button', {
      class: `bhb-icon ${step.enabled ? 'is-on' : ''}`,
      title: t(step.enabled ? 'steps.disable' : 'steps.enable'),
      text: step.enabled ? '◉' : '○',
    });
    toggle.addEventListener('click', () => {
      deps.stepEditor.setEnabled(step.id, !step.enabled);
      deps.refresh();
    });

    const up = el('button', { class: 'bhb-icon', title: t('steps.moveUp'), text: '▲' });
    up.addEventListener('click', () => {
      deps.stepEditor.move(step.id, -1);
      deps.refresh();
    });

    const down = el('button', { class: 'bhb-icon', title: t('steps.moveDown'), text: '▼' });
    down.addEventListener('click', () => {
      deps.stepEditor.move(step.id, 1);
      deps.refresh();
    });

    const remove = el('button', { class: 'bhb-icon bhb-icon--danger', title: t('steps.delete'), text: '✕' });
    remove.addEventListener('click', () => {
      deps.stepEditor.remove(step.id);
      deps.store.forgetStep(step.id);
      deps.refresh();
    });

    // Four behaviours, one control: click it, click it only if it is there,
    // hold here while it is there, or click it and call the resource spent.
    // The third is how "wait for a third player" is expressed — the empty
    // slot's button is the colour to wait out.
    const behaviour = el('select', { class: 'bhb-rule__gate', title: t('steps.behaviourHint') });
    for (const [value, labelKey] of [
      ['click', 'steps.kindClick'],
      ['optional', 'steps.kindOptional'],
      ['wait', 'steps.kindWait'],
      ['count', 'steps.kindCount'],
      ['spent', 'steps.kindSpent'],
    ]) {
      const option = el('option', { text: t(labelKey) });
      option.value = value;
      behaviour.append(option);
    }
    behaviour.value =
      step.kind === StepKind.WAIT
        ? 'wait'
        : step.kind === StepKind.COUNT
          ? 'count'
          : step.endsRun
            ? 'spent'
            : step.optional
              ? 'optional'
              : 'click';
    behaviour.addEventListener('change', () => {
      const kinds = { wait: StepKind.WAIT, count: StepKind.COUNT };
      deps.stepEditor.setBehaviour(step.id, {
        kind: kinds[behaviour.value] || StepKind.CLICK,
        optional: behaviour.value === 'optional',
        endsRun: behaviour.value === 'spent',
      });
      deps.refresh();
    });

    // A dungeon run lasts a minute; the step that starts one says how long to
    // stop looking, rather than the bot re-reading the same frame throughout.
    const rest = el('input', { class: 'bhb-rest bhb-mono', title: t('steps.restHint') });
    rest.type = 'number';
    rest.min = '0';
    rest.max = '600';
    rest.value = String(step.restSec || 0);
    rest.addEventListener('change', () => {
      deps.stepEditor.setRest(step.id, rest.value);
      deps.refresh();
    });

    // How many changes to wait out, and how long before giving up on them.
    const countTarget = el('input', { class: 'bhb-rest bhb-mono', title: t('steps.countToHint') });
    countTarget.type = 'number';
    countTarget.min = '0';
    countTarget.max = '99';
    countTarget.value = String(step.countTo || 0);
    countTarget.addEventListener('change', () => {
      deps.stepEditor.setCount(step.id, { countTo: countTarget.value });
      deps.refresh();
    });

    const countCap = el('input', { class: 'bhb-rest bhb-mono', title: t('steps.countCapHint') });
    countCap.type = 'number';
    countCap.min = '0';
    countCap.max = '170';
    countCap.value = String(step.countCap || 0);
    countCap.addEventListener('change', () => {
      deps.stepEditor.setCount(step.id, { countCap: countCap.value });
      deps.refresh();
    });

    const drawRegion = el('button', {
      class: 'bhb-icon bhb-step__region',
      title: t('steps.drawRegion'),
      text: '▭',
    });
    drawRegion.addEventListener('click', () => {
      // The panel covers the game, so it gets out of the way for the drag.
      deps.store.closePanel();
      deps.refresh();
      startDragSelect((rect) => {
        if (rect) {
          deps.stepEditor.captureRegion(rect, step.id);
        }
        deps.store.openPanel();
        deps.refresh();
      });
    });

    // Only while the eye is held: this is the answer to "why will it not fire".
    const live = state.previewStepId === step.id ? readLive(step, deps, engineScreen) : null;
    const liveRow = live
      ? el('div', { class: 'bhb-live' }, [
          el('span', { class: `bhb-live__verdict is-${live.verdict}`, text: t(`steps.live.${live.verdict}`) }),
          el('span', { class: 'bhb-live__swatch', style: { background: step.hex || 'transparent' } }),
          el('span', { class: 'bhb-live__arrow', text: '→' }),
          el('span', {
            class: 'bhb-live__swatch',
            style: { background: live.seen || 'transparent' },
          }),
          el('span', {
            class: 'bhb-mono bhb-live__drift',
            text: typeof live.drift === 'number' ? `${live.seen} · Δ${live.drift}` : live.seen || '',
          }),
        ])
      : null;

    const places = pointsByPlace(step);
    const isWait = step.kind === StepKind.WAIT;
    const isCount = step.kind === StepKind.COUNT;

    // A wait can watch several places at once, and then it is a count that
    // matters: four empty party slots, at most two of them still empty.
    // Click, not hover: a rebuild under the pointer drops the old node without a
    // mouseleave, and the panel stayed faded. Leaving is watched by releasePeek.
    const preview = el('button', {
      class: 'bhb-icon bhb-step__peek',
      title: t('steps.preview'),
      text: '\u25c9',
    });
    preview.dataset.peekStep = step.id;
    preview.addEventListener('click', () => {
      const isPeeking = deps.store.get().previewStepId === step.id;
      deps.store.previewStep(isPeeking ? null : step.id);
    });
    releasePeek(deps.store);

    const addPlace = el('button', {
      class: 'bhb-icon',
      title: t('steps.addPlace'),
      text: '＋',
    });
    addPlace.addEventListener('click', () => {
      // Out of the way, then the next X lands on this step.
      deps.store.awaitPlaceFor(step.id);
      deps.store.armCapture(true);
      deps.store.closePanel();
      deps.refresh();
    });

    const threshold = el('input', { class: 'bhb-rest bhb-mono', title: t('steps.maxMatchesHint') });
    threshold.type = 'number';
    threshold.min = '0';
    threshold.max = '20';
    threshold.value = String(step.maxMatches || 0);
    threshold.addEventListener('change', () => {
      deps.stepEditor.setMaxMatches(step.id, threshold.value);
      deps.refresh();
    });

    const placeCount = el('span', {
      class: 'bhb-note bhb-mono',
      title: t('steps.placeCount'),
      text: places.length > 1 ? `×${places.length}` : '',
    });

    const classes = ['bhb-step', 'bhb-step--stacked'];
    if (step.id === expectedStepId) {
      classes.push('is-next');
    }
    if (!step.enabled) {
      classes.push('is-off');
    }
    if (state.selectedStepId === step.id) {
      classes.push('is-selected');
    }
    if (state.hoveredStepId === step.id) {
      classes.push('is-hovered');
    }

    const row = el('div', { class: classes.join(' ') }, [
      el('div', { class: 'bhb-rule__main' }, [
        el('span', { class: 'bhb-rule__n', text: String(index + 1) }),
        el('span', { class: 'bhb-rule__swatch', style: { background: step.hex || 'transparent' } }),
        name,
        el('span', { class: 'bhb-rule__actions' }, [
          isCount ? drawRegion : addPlace,
          toggle,
          up,
          down,
          // Next to delete rather than first: it is the one button here that
          // is safe to hit by accident, and the one beside it is not.
          preview,
          remove,
        ]),
      ]),
      el('div', { class: 'bhb-rule__meta' }, [
        behaviour,
        placeCount,
        isCount ? countTarget : isWait ? threshold : rest,
        isCount ? countCap : null,
        el('span', { class: 'bhb-rule__meta-coord' }, [
          el('span', {
            class: 'bhb-rule__coord bhb-mono',
            text: point ? `${point.x},${point.y}` : '—',
          }),
          legacy
            ? el('span', {
                class: 'bhb-rule__legacy',
                title: t('overlay.needsRecapture'),
                text: `⚠ ${t('steps.legacyBadge')}`,
              })
            : null,
          // A dry run's verdict is a colour on the marker; the number behind it
          // is what says whether to widen the tolerance or re-capture.
          miss
            ? el('span', {
                class: 'bhb-rule__drift bhb-mono',
                title: t('steps.driftHint', { hex: miss.seen }),
                text: `Δ${miss.drift}`,
              })
            : null,
        ]),
        activities.length > 0 ? slot : null,
        deps.settings.showScreens && deps.getScreens().length > 0 ? gate : null,
      ]),
      liveRow,
    ]);

    row.addEventListener('mouseenter', () => deps.store.hoverStep(step.id));
    row.addEventListener('mouseleave', () => deps.store.hoverStep(null));
    row.addEventListener('click', () => deps.store.selectStep(step.id));

    rows.set(step.id, row);
    return row;
  });

  return el('div', { class: 'bhb-tab' }, [head, el('div', { class: 'bhb-steps' }, stepRows)]);
}
