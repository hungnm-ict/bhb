import { el, mount } from '../dom.js';
import { t } from '../../i18n/index.js';
import { Tab } from '../store.js';
import { VERSION } from '../../core/constants.js';
import { renderTasksTab, updateSpeedDisplay } from './tasks.js';
import { renderStepsTab, highlightSteps } from './steps.js';
import { renderScreensTab } from './screens.js';
import { renderSettingsTab } from './settings.js';
import { renderLogTab } from './log.js';
import { renderHelpTab } from './help.js';

/**
 * The control panel.
 *
 * Opens over the game, because configuring and farming never happen at once.
 * It owns the frame and the tab strip only; each tab renders itself.
 */

const TABS = [
  [Tab.TASKS, 'tab.tasks'],
  [Tab.STEPS, 'tab.steps'],
  [Tab.SCREENS, 'tab.screens'],
  [Tab.SETTINGS, 'tab.settings'],
  [Tab.LOG, 'tab.log'],
  [Tab.HELP, 'tab.help'],
];

/**
 * @param {object} deps
 * @param {ReturnType<import('../store.js').createUiStore>} deps.store
 * @param {() => object} deps.getEngineState
 * @param {(taskId: string) => void} deps.toggleTask
 * @param {() => import('../../bot/step.js').Step[]} deps.getSteps
 * @param {object} deps.stepEditor
 * @param {object} deps.screenEditor
 * @param {() => import('../../bot/screen.js').Screen[]} deps.getScreens
 * @param {() => string} deps.getProfileName
 * @param {() => void} deps.refresh
 */
export function createPanel(deps) {
  /** @type {HTMLElement | null} */
  let node = null;

  /**
   * The tab the last render drew.
   *
   * The panel is rebuilt on every engine tick, and a rebuilt body starts at
   * scroll zero — which is what dragged the scrollbar back up under the user a
   * couple of seconds after they scrolled down. Restoring the offset fixes that,
   * but only within one tab: arriving at a tab part-way down is disorienting,
   * so a tab change deliberately starts at the top.
   *
   * @type {string | null}
   */
  let renderedTab = null;

  function ensureNode() {
    if (!node) {
      node = mount(el('div', { class: 'bhb-panel' }));
    }
    return node;
  }

  function renderBody(tab) {
    if (tab === Tab.STEPS) {
      return renderStepsTab(deps);
    }
    if (tab === Tab.SCREENS) {
      return renderScreensTab(deps);
    }
    if (tab === Tab.SETTINGS) {
      return renderSettingsTab(deps);
    }
    if (tab === Tab.HELP) {
      return renderHelpTab();
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
      renderedTab = null;
      return;
    }
    target.style.display = 'flex';

    const close = el('button', { class: 'bhb-icon', title: t('panel.close'), text: '✕' });
    close.addEventListener('click', () => {
      deps.store.closePanel();
      deps.refresh();
    });

    /** @type {HTMLElement | null} */
    let activeTab = null;

    const tabs = TABS.map(([id, labelKey]) => {
      const button = el('button', {
        class: `bhb-tabbtn ${id === Tab.HELP ? 'bhb-tabbtn--help' : ''} ${
          state.tab === id ? 'is-active' : ''
        }`,
        text: t(labelKey),
      });
      button.addEventListener('click', () => {
        deps.store.setTab(id);
        deps.refresh();
      });
      if (state.tab === id) {
        activeTab = button;
      }
      return button;
    });

    const previousBody = target.querySelector('.bhb-panel__body');
    const keptScroll = previousBody && renderedTab === state.tab ? previousBody.scrollTop : 0;

    const body = el('div', { class: 'bhb-panel__body' }, [renderBody(state.tab)]);

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
      body
    );

    body.scrollTop = keptScroll;
    renderedTab = state.tab;

    // The strip scrolls, so the tab the user just picked has to be brought
    // into view or it stays off the right edge.
    if (activeTab && typeof activeTab.scrollIntoView === 'function') {
      activeTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  /** Speed changes touch two numbers; they never need the panel rebuilt. */
  function updateSpeed() {
    updateSpeedDisplay();
  }

  function highlight() {
    highlightSteps(deps.store.get());
  }

  return { render, highlight, updateSpeed };
}
