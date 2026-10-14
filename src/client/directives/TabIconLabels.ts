// Icon tabs (Pass on, End) show a text label next to the icon as long as the tab bar has room for it.
// The labels are the first thing to go when space runs short: before any other tab label gets truncated
// (…), the icon tabs fall back to the bare icon. Whether the room suffices is only known to the DOM:
// the directive shows the labels, checks whether a tab title got truncated and hides them again if so.
// Usage: v-tab-icon-labels on the tab bar (.or-tabs); style in or_options_tabs.less.
import {Directive} from 'vue';
import {cancelLayoutJob, scheduleLayoutJob} from '@/client/utils/layoutBatch';

// Attribute instead of class: Vue resets bound classes on every render and would remove a class of our own
export const ICON_LABELS_HIDDEN_ATTRIBUTE = 'data-icon-labels-hidden';

const observers = new WeakMap<HTMLElement, ResizeObserver>();

function isTruncated(element: Element): boolean {
  return element.scrollWidth > element.clientWidth + 1;
}

export function updateTabIconLabels(tabStrip: HTMLElement): void {
  scheduleLayoutJob(tabStrip, {
    // Measure with labels shown; runs before painting (layoutBatch.ts), so nothing flickers
    prepare: () => tabStrip.removeAttribute(ICON_LABELS_HIDDEN_ATTRIBUTE),
    measure: () => {
      if (tabStrip.querySelector('.or-tab-icon-label') === null) {
        return false;
      }
      const titles = tabStrip.querySelectorAll('.or-tab-title, .or-tab-icon-label');
      return isTruncated(tabStrip) || Array.from(titles).some(isTruncated);
    },
    apply: (tooNarrow) => {
      if (tooNarrow) {
        tabStrip.setAttribute(ICON_LABELS_HIDDEN_ATTRIBUTE, '');
      }
    },
  });
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
    cancelLayoutJob(tabStrip);
    observers.get(tabStrip)?.disconnect();
    observers.delete(tabStrip);
  },
};
