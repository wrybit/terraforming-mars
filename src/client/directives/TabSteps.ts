// The action tab bar gets shorter step by step when its tabs don't fit in one line (Jens, 25 Oct 2026).
// Each step is an attribute on the bar; the steps add up and always apply to the whole bar, so the tabs stay alike.
// Order: icon tabs (Pass on, End) drop their text, the parameter tab gets a shorter title ("Water store"), the
// shortcut keys go (they stay in the tooltip), "All cards" becomes "All", every tab its single word
// (orOptionsShortLabels.ts), "All" becomes its icon, finally every tab with an icon shows only the icon.
// Whether a step suffices is only known to the DOM: the directive takes all steps away, measures and adds one
// step after the other until nothing is cut off any more. Usage: v-tab-steps on the tab bar (.or-tabs);
// style in or_options_tabs.less.
import {Directive} from 'vue';
import {cancelLayoutJob, scheduleLayoutJob} from '@/client/utils/layoutBatch';

// Attributes instead of classes: Vue resets bound classes on every render and would remove classes of our own
export const TAB_STEPS = [
  'data-tab-step-icon-labels',
  'data-tab-step-medium',
  'data-tab-step-keys',
  'data-tab-step-hand-word',
  'data-tab-step-words',
  'data-tab-step-hand-icon',
  'data-tab-step-icons',
] as const;

const observers = new WeakMap<HTMLElement, ResizeObserver>();

function isTruncated(element: Element): boolean {
  return element.scrollWidth > element.clientWidth + 1;
}

function tooNarrow(tabStrip: HTMLElement): boolean {
  const labels = tabStrip.querySelectorAll('.or-tab-title, .or-tab-icon-label');
  return isTruncated(tabStrip) || Array.from(labels).some(isTruncated);
}

// Number of steps the bar needs: each further step is only tried while the bar is still too narrow
export function stepsNeeded(tabStrip: HTMLElement): number {
  let steps = 0;
  while (steps < TAB_STEPS.length && tooNarrow(tabStrip)) {
    tabStrip.setAttribute(TAB_STEPS[steps], '');
    steps++;
  }
  return steps;
}

function setSteps(tabStrip: HTMLElement, steps: number): void {
  TAB_STEPS.forEach((attribute, index) => {
    if (index < steps) {
      tabStrip.setAttribute(attribute, '');
    } else {
      tabStrip.removeAttribute(attribute);
    }
  });
}

export function updateTabSteps(tabStrip: HTMLElement): void {
  scheduleLayoutJob(tabStrip, {
    // Measure from the full bar; runs before painting (layoutBatch.ts), so nothing flickers
    prepare: () => setSteps(tabStrip, 0),
    // Adds the steps while measuring: each step changes the widths the next measurement needs
    measure: () => stepsNeeded(tabStrip),
    apply: (steps) => setSteps(tabStrip, steps),
  });
}

export const vTabSteps: Directive<HTMLElement> = {
  mounted(tabStrip) {
    updateTabSteps(tabStrip);
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    // Width of the bar itself (window, sidebar); the tab set changes come via updated()
    const observer = new ResizeObserver(() => updateTabSteps(tabStrip));
    observer.observe(tabStrip);
    observers.set(tabStrip, observer);
  },
  updated(tabStrip) {
    updateTabSteps(tabStrip);
  },
  unmounted(tabStrip) {
    cancelLayoutJob(tabStrip);
    observers.get(tabStrip)?.disconnect();
    observers.delete(tabStrip);
  },
};
