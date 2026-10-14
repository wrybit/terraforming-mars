// Joins the active tab seamlessly with its box (.or-tab-panel, style in or_options_tabs.less).
// Tab and box are translucent (frosted glass): the tab could not cover the box's top border,
// it would shine through. So the box leaves out its top border under the active tab. The position of this
// gap is only known to the DOM – the directive measures the tab and passes it to the box as CSS variables.
// Usage: v-docked-tab on the box; the tab bar (.or-tabs) sits directly before it or in the element before it.
import {Directive} from 'vue';
import {cancelLayoutJob, scheduleLayoutJob} from '@/client/utils/layoutBatch';

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

// Class of an element holding several tab bars for the same box (log: milestones tab, "GEN:", generation tabs)
export const TAB_GROUP_CLASS = 'or-tabs-group';

// Tab bar directly before the box – or embedded in it (log: "GEN:" title and bar in .log-generations)
function findTabStrip(panel: HTMLElement): Element | undefined {
  const previous = panel.previousElementSibling;
  if (previous === null) {
    return undefined;
  }
  if (previous.classList.contains('or-tabs') || previous.classList.contains(TAB_GROUP_CLASS)) {
    return previous;
  }
  return previous.querySelector(':scope > .or-tabs') ?? undefined;
}

// Lage der Lücke relativ zur Box; undefined = keine Lücke (volle Kante)
type DockedTabGap = {start: number, end: number, atRightEdge: boolean} | undefined;

// Liest nur: läuft gebündelt mit den Messungen anderer Komponenten (layoutBatch.ts)
function measureDockedTab(panel: HTMLElement): DockedTabGap {
  const activeTab = findTabStrip(panel)?.querySelector<HTMLElement>('.or-tab--active');
  if (activeTab === null || activeTab === undefined) {
    // No active tab (e.g. action menu as a list): full border
    return undefined;
  }
  const panelRect = panel.getBoundingClientRect();
  const panelLeft = panelRect.left;
  const tabRect = activeTab.getBoundingClientRect();
  // Horizontally scrollable bar (log generations): only the visible part of the tab opens the border
  const stripRect = activeTab.parentElement?.getBoundingClientRect() ?? tabRect;
  const visibleLeft = Math.max(tabRect.left, stripRect.left);
  const visibleRight = Math.min(tabRect.right, stripRect.right);
  if (visibleRight - visibleLeft < 1) {
    return undefined;
  }
  // The box border stays under the tab's side borders, so the corners join without gaps;
  // a clipped side has no tab border
  const tabBorder = parseFloat(getComputedStyle(activeTab).borderLeftWidth) || 0;
  const startBorder = visibleLeft === tabRect.left ? tabBorder : 0;
  const endBorder = visibleRight === tabRect.right ? tabBorder : 0;
  return {
    start: Math.round(visibleLeft - panelLeft + startBorder),
    end: Math.round(visibleRight - panelLeft - endBorder),
    // Tab flush with the right edge (e.g. End): the box's rounding is dropped there, like on the left for the first tab
    atRightEdge: Math.round(panelRect.right - visibleRight) <= 0,
  };
}

// Schreibt nur
function applyDockedTab(panel: HTMLElement, gap: DockedTabGap): void {
  if (gap === undefined) {
    panel.removeAttribute(DOCKED_TAB_ATTRIBUTE);
    return;
  }
  panel.style.setProperty(DOCKED_TAB_START, `${gap.start}px`);
  panel.style.setProperty(DOCKED_TAB_END, `${gap.end}px`);
  panel.setAttribute(DOCKED_TAB_ATTRIBUTE, gap.atRightEdge ? DOCKED_TAB_RIGHT_EDGE : '');
}

export function updateDockedTab(panel: HTMLElement): void {
  scheduleLayoutJob(panel, {
    measure: () => measureDockedTab(panel),
    apply: (gap) => applyDockedTab(panel, gap),
  });
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
  // Capture: in a tab group the scrolling bar is a descendant, and scroll events don't bubble
  tabStrip.addEventListener('scroll', update, {passive: true, capture: true});
  observers.push({disconnect: () => tabStrip.removeEventListener('scroll', update, {capture: true})});
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
    cancelLayoutJob(panel);
  },
};
