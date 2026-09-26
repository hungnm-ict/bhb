import { el } from '../dom.js';
import { t } from '../../i18n/index.js';
import { startDragSelect } from '../dragselect.js';

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
    startDragSelect((rect) => {
      if (rect) {
        deps.screenEditor.captureAnchor(rect, screenId);
      }
      deps.store.openPanel();
      deps.refresh();
    });
  }

  const captureButton = el('button', { class: 'bhb-btn bhb-btn--primary' }, [
    el('span', { class: 'bhb-btn__dot' }),
    el('span', { text: t('screens.capture') }),
  ]);
  captureButton.addEventListener('click', () => capture(null));

  const head = el('div', { class: 'bhb-field' }, [
    el('div', { class: 'bhb-field__head' }, [
      el('span', { class: 'bhb-label', text: `${t('screens.title')} · ${screens.length}` }),
      el('span', {
        class: 'bhb-mono bhb-screen__now',
        text: deps.getEngineState().screenName || t('screens.unknown'),
      }),
    ]),
    captureButton,
    el('p', { class: 'bhb-note', text: t('screens.captureHint') }),
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

    const classes = ['bhb-step', 'bhb-screen'];
    if (active === screen.id) {
      classes.push('is-active');
    }
    if (screen.stopsTask) {
      classes.push('is-stopper');
    }

    return el('div', { class: 'bhb-screen__wrap' }, [
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
        el('span', { class: 'bhb-rule__actions' }, [stops, alertToggle, add, up, down, remove]),
      ]),
      el('div', { class: 'bhb-screen__tune' }, [
        el('span', { class: 'bhb-note', text: `${t('screens.anchors')} ${screen.anchors.length}` }),
        ratio,
        el('span', { class: 'bhb-mono bhb-note', text: screen.minRatio.toFixed(2) }),
      ]),
    ]);
  });

  return el('div', { class: 'bhb-tab' }, [
    head,
    clash,
    el('div', { class: 'bhb-steps' }, rows),
  ]);
}
