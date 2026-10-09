// Icon tabs (Pass on, End) show a text label next to the icon as long as the tab bar has room for it.
// The labels are the first thing to go when space runs short: before any other tab label gets truncated
// (…), the icon tabs fall back to the bare icon. Whether the room suffices is only known to the DOM:
// the directive shows the labels, checks whether a tab title got truncated and hides them again if so.
// Usage: v-tab-icon-labels on the tab bar (.or-tabs); style in or_options_tabs.less.
import {Directive} from 'vue';

// Attribute instead of class: Vue resets bound classes on every render and would remove a class of our own
export const ICON_LABELS_HIDDEN_ATTRIBUTE = 'data-icon-labels-hidden';

const observers = new WeakMap<HTMLElement, ResizeObserver>();

function isTruncated(element: Element): boolean {
  return element.scrollWidth > element.clientWidth + 1;
}

export function updateTabIconLabels(tabStrip: HTMLElement): void {
  // Measure with labels shown; reading scrollWidth forces the layout synchronously, so nothing flickers
  tabStrip.removeAttribute(ICON_LABELS_HIDDEN_ATTRIBUTE);
  if (tabStrip.querySelector('.or-tab-icon-label') === null) {
    return;
  }
  const titles = tabStrip.querySelectorAll('.or-tab-title, .or-tab-icon-label');
  const tooNarrow = isTruncated(tabStrip) || Array.from(titles).some(isTruncated);
  if (tooNarrow) {
    tabStrip.setAttribute(ICON_LABELS_HIDDEN_ATTRIBUTE, '');
  }
}

export const vTabIconLabels: Directive<HTMLElement> = {
  mounted(tabStrip) {
    updateTabIconLabels(tabStrip);
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    // Width of the bar itself (window, sidebar); the tab set changes come via updated()
    const observer = new ResizeObserver(() => updateTabIconLabels(tabStrip));
    observer.observe(tabStrip);
    observers.set(tabStrip, observer);
  },
  updated(tabStrip) {
    updateTabIconLabels(tabStrip);
  },
  unmounted(tabStrip) {
    observers.get(tabStrip)?.disconnect();
    observers.delete(tabStrip);
  },
};
