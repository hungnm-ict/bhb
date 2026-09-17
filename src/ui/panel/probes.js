import { el } from '../dom.js';
import { t } from '../../i18n/index.js';

/**
 * The probe table: does the preset survive a resolution change?
 *
 * Every row answers the two halves of that question side by side — where the
 * scaling now puts the point, and how far its colour drifted. A row that only
 * said "moved" would leave the user guessing which half broke.
 *
 * Capture arms rather than captures, because this panel covers the button the
 * user wants to aim at.
 */

function sizeText(width, height) {
  return `${width}×${height}`;
}

function aspectText(width, height) {
  return (width / height).toFixed(2);
}

function verdictRow(probe, score) {
  const cells = [
    el('span', { class: 'bhb-probe-row__name', text: probe.label }),
    el('span', {
      class: 'bhb-mono bhb-probe-row__size',
      text: sizeText(probe.bw, probe.bh),
      title: t('probe.captured'),
    }),
    el('span', {
      class: 'bhb-mono bhb-probe-row__pos',
      text: `${score.resolved.x}, ${score.resolved.y}`,
    }),
    el('span', { class: 'bhb-probe-row__swatch', style: { background: probe.hex } }),
    el('span', {
      class: 'bhb-probe-row__swatch',
      style: { background: score.liveHex || 'transparent' },
    }),
  ];

  if (score.matches === null) {
    cells.push(el('span', { class: 'bhb-note', text: t('probe.unknown') }));
  } else {
    cells.push(
      el('span', {
        class: `bhb-mono bhb-probe-row__delta ${score.matches ? 'is-match' : 'is-miss'}`,
        text: `${score.delta} ${score.matches ? '✓' : '✗'}`,
      })
    );
  }

  return cells;
}

/**
 * @param {object} deps
 * @param {() => import('../../core/probe.js').Probe[]} deps.getProbes
 * @param {object} deps.probeEditor
 * @param {ReturnType<import('../store.js').createUiStore>} deps.store
 * @param {() => void} deps.refresh
 * @param {(labelKey: string, value: boolean, onChange: (v: boolean) => void) => HTMLElement}
 *   toggleRow
 */
export function renderProbeSection(deps, toggleRow) {
  const probes = deps.getProbes();
  const { buffer, scores } = deps.probeEditor.scoreAll();
  const state = deps.store.get();

  const capture = el('button', {
    class: `bhb-btn bhb-btn--small ${state.isAwaitingProbe ? 'bhb-btn--primary' : ''}`,
    text: t(state.isAwaitingProbe ? 'probe.cancel' : 'probe.capture'),
  });
  capture.addEventListener('click', () => {
    const awaiting = !state.isAwaitingProbe;
    deps.store.awaitProbe(awaiting);
    // Arming the probe is pointless while the capture key itself is off, and a
    // user who just asked for a probe has said what they want the key for.
    if (awaiting) {
      deps.store.armCapture(true);
      deps.store.closePanel();
    }
    deps.refresh();
  });

  const clear = el('button', { class: 'bhb-btn bhb-btn--small', text: t('probe.clear') });
  clear.addEventListener('click', () => {
    deps.probeEditor.clear();
    deps.refresh();
  });

  const rows = probes.map((probe, index) => {
    const score = scores[index];
    const remove = el('button', { class: 'bhb-icon', title: t('probe.clear'), text: '✕' });
    remove.addEventListener('click', () => {
      deps.probeEditor.remove(probe.id);
      deps.refresh();
    });

    return el('div', { class: 'bhb-probe-row' }, [
      ...(score
        ? verdictRow(probe, score)
        : [el('span', { class: 'bhb-probe-row__name', text: probe.label })]),
      remove,
    ]);
  });

  // One warning for the section, not one per row: the aspect ratio is a
  // property of the framebuffer, and every probe would report the same thing.
  const drifted = scores.find((score) => score.aspectChanged);
  const capturedAt = probes[0];

  return el('div', { class: 'bhb-field' }, [
    el('div', { class: 'bhb-btnrow' }, [
      capture,
      probes.length > 0 ? clear : null,
      buffer
        ? el('span', {
            class: 'bhb-mono bhb-note',
            text: `${t('probe.now')} ${sizeText(buffer.width, buffer.height)}`,
          })
        : null,
    ]),
    state.isAwaitingProbe
      ? el('p', { class: 'bhb-note bhb-note--warn', text: t('probe.capturing') })
      : null,
    toggleRow('probe.pin', state.areProbesPinned, (value) => deps.store.pinProbes(value)),
    drifted && capturedAt && buffer
      ? el('p', {
          class: 'bhb-note bhb-note--warn',
          text: t('probe.aspectWarn', {
            before: aspectText(capturedAt.bw, capturedAt.bh),
            after: aspectText(buffer.width, buffer.height),
          }),
        })
      : null,
    rows.length > 0
      ? el('div', { class: 'bhb-probe-table' }, rows)
      : el('p', { class: 'bhb-note', text: t('probe.empty') }),
    el('p', { class: 'bhb-note', text: t('probe.hint') }),
  ]);
}
