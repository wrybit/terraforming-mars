// Joins the active tab seamlessly with its box (.or-tab-panel, style in or_options_tabs.less).
// Tab and box are translucent (frosted glass): the tab could not cover the box's top border,
// it would shine through. So the box leaves out its top border under the active tab. The position of this
// gap is only known to the DOM – the directive measures the tab and passes it to the box as CSS variables.
// Usage: v-docked-tab on the box; the tab bar (.or-tabs) sits directly before it or in the element before it.
import {Directive} from 'vue';

// Attribute instead of class: Vue resets bound classes on every render and would remove a class of our own
export const DOCKED_TAB_ATTRIBUTE = 'data-docked-tab';
export const DOCKED_TAB_START = '--docked-tab-start';
export const DOCKED_TAB_END = '--docked-tab-end';
// Attribute value when the active tab is flush with the box's right edge
export const DOCKED_TAB_RIGHT_EDGE = 'right-edge';

type Observed = {
  tabStrip: Element;
  observers: Array<{disconnect(): void}>;
};

const observedPanels = new WeakMap<HTMLElement, Observed>();

// Tab bar directly before the box – or embedded in it (log: "GEN:" title and bar in .log-generations)
function findTabStrip(panel: HTMLElement): Element | undefined {
  const previous = panel.previousElementSibling;
  if (previous === null) {
    return undefined;
  }
  if (previous.classList.contains('or-tabs')) {
    return previous;
  }
  return previous.querySelector(':scope > .or-tabs') ?? undefined;
}

export function updateDockedTab(panel: HTMLElement): void {
  const activeTab = findTabStrip(panel)?.querySelector<HTMLElement>('.or-tab--active');
  if (activeTab === null || activeTab === undefined) {
    // No active tab (e.g. action menu as a list): full border
    panel.removeAttribute(DOCKED_TAB_ATTRIBUTE);
    return;
  }
  const panelRect = panel.getBoundingClientRect();
  const panelLeft = panelRect.left;
  const tabRect = activeTab.getBoundingClientRect();
  // Horizontally scrollable bar (log generations): only the visible part of the tab opens the border
  const stripRect = activeTab.parentElement?.getBoundingClientRect() ?? tabRect;
  const visibleLeft = Math.max(tabRect.left, stripRect.left);
  const visibleRight = Math.min(tabRect.right, stripRect.right);
  if (visibleRight - visibleLeft < 1) {
    panel.removeAttribute(DOCKED_TAB_ATTRIBUTE);
    return;
  }
  // The box border stays under the tab's side borders, so the corners join without gaps;
  // a clipped side has no tab border
  const tabBorder = parseFloat(getComputedStyle(activeTab).borderLeftWidth) || 0;
  const startBorder = visibleLeft === tabRect.left ? tabBorder : 0;
  const endBorder = visibleRight === tabRect.right ? tabBorder : 0;
  panel.style.setProperty(DOCKED_TAB_START, `${Math.round(visibleLeft - panelLeft + startBorder)}px`);
  panel.style.setProperty(DOCKED_TAB_END, `${Math.round(visibleRight - panelLeft - endBorder)}px`);
  // Tab flush with the right edge (e.g. End): the box's rounding is dropped there, like on the left for the first tab
  const atRightEdge = Math.round(panelRect.right - visibleRight) <= 0;
  panel.setAttribute(DOCKED_TAB_ATTRIBUTE, atRightEdge ? DOCKED_TAB_RIGHT_EDGE : '');
}

function stopObserving(panel: HTMLElement): void {
  observedPanels.get(panel)?.observers.forEach((observer) => observer.disconnect());
  observedPanels.delete(panel);
}

// Tab changes (class), width changes (font, window) and horizontal scrolling of the bar move the gap
function observe(panel: HTMLElement): void {
  const tabStrip = findTabStrip(panel);
  if (observedPanels.get(panel)?.tabStrip === tabStrip) {
    return;
  }
  stopObserving(panel);
  if (tabStrip === undefined) {
    return;
  }
  const update = () => updateDockedTab(panel);
  const observers: Array<{disconnect(): void}> = [];
  if (typeof MutationObserver !== 'undefined') {
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(tabStrip, {subtree: true, childList: true, attributes: true, attributeFilter: ['class']});
    observers.push(mutationObserver);
  }
  // jsdom (client tests) has no ResizeObserver
  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(tabStrip);
    resizeObserver.observe(panel);
    observers.push(resizeObserver);
  }
  tabStrip.addEventListener('scroll', update, {passive: true});
  observers.push({disconnect: () => tabStrip.removeEventListener('scroll', update)});
  observedPanels.set(panel, {tabStrip, observers});
}

export const vDockedTab: Directive<HTMLElement> = {
  mounted(panel) {
    observe(panel);
    updateDockedTab(panel);
  },
  updated(panel) {
    observe(panel);
    updateDockedTab(panel);
  },
  beforeUnmount(panel) {
    stopObserving(panel);
  },
};
