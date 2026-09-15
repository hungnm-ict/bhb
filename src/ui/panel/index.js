import { el, mount } from '../dom.js';
import { t } from '../../i18n/index.js';
import { Tab } from '../store.js';
import { VERSION } from '../../core/constants.js';
import { renderTasksTab } from './tasks.js';
import { renderRulesTab } from './rules.js';
import { renderScreensTab } from './screens.js';
import { renderQueueTab } from './queue.js';
import { renderLogTab } from './log.js';

/**
 * The control panel.
 *
 * Opens over the game, because configuring and farming never happen at once.
 * It owns the frame and the tab strip only; each tab renders itself.
 */

const TABS = [
  [Tab.TASKS, 'tab.tasks'],
  [Tab.RULES, 'tab.rules'],
  [Tab.SCREENS, 'tab.screens'],
  [Tab.QUEUE, 'tab.queue'],
  [Tab.LOG, 'tab.log'],
];

/**
 * @param {object} deps
 * @param {ReturnType<import('../store.js').createUiStore>} deps.store
 * @param {() => object} deps.getEngineState
 * @param {(taskId: string) => void} deps.toggleTask
 * @param {() => import('../../rules/model.js').Rule[]} deps.getRules
 * @param {object} deps.editor
 * @param {object} deps.screenEditor
 * @param {() => import('../../rules/screen.js').Screen[]} deps.getScreens
 * @param {() => string} deps.getProfileName
 * @param {() => void} deps.refresh
 */
export function createPanel(deps) {
  /** @type {HTMLElement | null} */
  let node = null;

  function ensureNode() {
    if (!node) {
      node = mount(el('div', { class: 'bhb-panel' }));
    }
    return node;
  }

  function renderBody(tab) {
    if (tab === Tab.RULES) {
      return renderRulesTab(deps);
    }
    if (tab === Tab.SCREENS) {
      return renderScreensTab(deps);
    }
    if (tab === Tab.QUEUE) {
      return renderQueueTab(deps);
    }
    if (tab === Tab.LOG) {
      return renderLogTab(deps);
    }
    return renderTasksTab(deps);
  }

  function render() {
    const target = ensureNode();
    const state = deps.store.get();

    if (!state.panelOpen) {
      target.style.display = 'none';
      target.replaceChildren();
      return;
    }
    target.style.display = 'flex';

    const close = el('button', { class: 'bhb-icon', title: t('panel.close'), text: '✕' });
    close.addEventListener('click', () => {
      deps.store.closePanel();
      deps.refresh();
    });

    const tabs = TABS.map(([id, labelKey]) => {
      const button = el('button', {
        class: `bhb-tabbtn ${state.tab === id ? 'is-active' : ''}`,
        text: t(labelKey),
      });
      button.addEventListener('click', () => {
        deps.store.setTab(id);
        deps.refresh();
      });
      return button;
    });

    target.replaceChildren(
      el('header', { class: 'bhb-panel__head' }, [
        el('span', { class: 'bhb-panel__brand' }, [
          el('span', { class: 'bhb-panel__name', text: t('app.name') }),
          el('span', { class: 'bhb-panel__ver', text: `v${VERSION}` }),
        ]),
        el('span', { class: 'bhb-panel__profile', text: deps.getProfileName() }),
        close,
      ]),
      el('nav', { class: 'bhb-tabs' }, tabs),
      el('div', { class: 'bhb-panel__body' }, [renderBody(state.tab)])
    );
  }

  return { render };
}
