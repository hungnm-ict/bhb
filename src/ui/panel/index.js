import { el, mount } from '../dom.js';
import { t } from '../../i18n/index.js';
import { Tab } from '../store.js';
import { VERSION } from '../../core/constants.js';
import { renderTasksTab, updateSpeedDisplay, speedIsBeingDragged } from './tasks.js';
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
 *
 * There is no title bar: a row that only repeated the app's own name cost as
 * much height as two switches. What was in it that carries meaning — which
 * profile is live, and the way out — sits at the end of the tab strip, and the
 * version moved to the reference tab, where someone reporting a bug looks.
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

  /**
   * A dropdown somewhere in the panel, with its list open.
   *
   * A native list belongs to the element that opened it, so any rebuild closes
   * it — which is what made a click on one read as a dismiss. The open list
   * holds the focus, which is how we know to leave the panel alone.
   */
  function aDropdownIsOpen() {
    const active = document.activeElement;
    return active instanceof HTMLSelectElement && Boolean(node) && node.contains(active);
  }

  function ensureNode() {
    if (!node) {
      node = mount(el('div', { class: 'bhb-panel' }));
      // A choice that has been made is not a list being read. The guard below
      // keeps the tick off an open dropdown, but a browser leaves focus on a
      // select afterwards — so the redraw the choice itself asked for was the
      // one getting skipped, and the table kept showing the old filter.
      node.addEventListener('change', () => render({ force: true }));
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

  /** @param {{ force?: boolean }} [options] force: the user just committed a change. */
  function render(options = {}) {
    const target = ensureNode();
    const state = deps.store.get();

    // Rebuilding under a held slider tore the drag apart, and rebuilding under
    // an open dropdown closed it before it could be read. Both own the input
    // the user is in the middle of giving, so the tick waits.
    if (
      !options.force &&
      renderedTab !== null &&
      (speedIsBeingDragged() || aDropdownIsOpen())
    ) {
      return;
    }

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

    // The profile name is also the way to the profile list, which is the only
    // thing anyone wants after reading it.
    const profile = el('button', {
      class: 'bhb-panel__profile',
      title: t('settings.profiles'),
      text: deps.getProfileName(),
    });
    profile.addEventListener('click', () => {
      deps.store.setTab(Tab.SETTINGS);
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

    const help = tabs.pop();

    target.replaceChildren(
      el('nav', { class: 'bhb-tabs' }, [
        ...tabs,
        el('span', { class: 'bhb-tabs__end' }, [
          // The version left the HUD, which needed the room; it belongs where
          // the update check already lives.
          el('span', { class: 'bhb-tabs__ver bhb-mono', text: `v${VERSION}` }),
          profile,
          help,
          close,
        ]),
      ]),
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
