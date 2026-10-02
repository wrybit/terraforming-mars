// Custom tooltip instead of the native title: frosted glass, opens upward, the nose points at the element's center.
// One shared element at the end of the page (position: fixed), so it is neither clipped by overflow nor
// wrongly blurred by ancestors' backdrop-filter. Styles in glass_tooltip.less.
// Usage: v-glass-tooltip="text" (empty text = no tooltip).
import {Directive} from 'vue';

export const GLASS_TOOLTIP_CLASS = 'glass-tooltip';
export const GLASS_TOOLTIP_VISIBLE_CLASS = 'glass-tooltip--visible';
export const GLASS_TOOLTIP_NOSE_VARIABLE = '--glass-tooltip-nose-x';
// Minimum distance to the window edge and gap between nose tip and element (contract with glass_tooltip.less)
const VIEWPORT_MARGIN = 8;
const ANCHOR_GAP = 10;
// Nose never directly in the rounded corner
const NOSE_EDGE_MARGIN = 14;

type Anchor = {left: number; width: number};

// Horizontally centered above the element, clamped at the window edge; the nose stays above the element center
export function tooltipPosition(anchor: Anchor, tooltipWidth: number, viewportWidth: number): {left: number; noseX: number} {
  const center = anchor.left + anchor.width / 2;
  const maxLeft = Math.max(VIEWPORT_MARGIN, viewportWidth - VIEWPORT_MARGIN - tooltipWidth);
  const left = Math.min(maxLeft, Math.max(VIEWPORT_MARGIN, center - tooltipWidth / 2));
  const noseX = Math.min(tooltipWidth - NOSE_EDGE_MARGIN, Math.max(NOSE_EDGE_MARGIN, center - left));
  return {left, noseX};
}

let tooltip: HTMLElement | undefined;
// Element the tooltip is currently showing for
let currentAnchor: HTMLElement | undefined;
const texts = new WeakMap<HTMLElement, string>();
const handlers = new WeakMap<HTMLElement, {show: () => void, hide: () => void}>();

function tooltipElement(): HTMLElement {
  if (tooltip === undefined) {
    tooltip = document.createElement('div');
    tooltip.className = GLASS_TOOLTIP_CLASS;
    tooltip.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

function show(anchorElement: HTMLElement): void {
  const text = texts.get(anchorElement) ?? '';
  if (text === '') {
    return;
  }
  currentAnchor = anchorElement;
  const element = tooltipElement();
  element.textContent = text;
  // Set the text first, then measure
  element.style.left = '0px';
  const anchor = anchorElement.getBoundingClientRect();
  const {left, noseX} = tooltipPosition(anchor, element.offsetWidth, document.documentElement.clientWidth);
  element.style.left = `${left}px`;
  element.style.top = `${anchor.top - ANCHOR_GAP - element.offsetHeight}px`;
  element.style.setProperty(GLASS_TOOLTIP_NOSE_VARIABLE, `${noseX}px`);
  element.classList.add(GLASS_TOOLTIP_VISIBLE_CLASS);
}

function hide(): void {
  currentAnchor = undefined;
  tooltip?.classList.remove(GLASS_TOOLTIP_VISIBLE_CLASS);
}

export const glassTooltip: Directive<HTMLElement, string | undefined> = {
  mounted(element, binding) {
    texts.set(element, binding.value ?? '');
    const events = {show: () => show(element), hide};
    handlers.set(element, events);
    element.addEventListener('mouseenter', events.show);
    element.addEventListener('mouseleave', events.hide);
  },
  updated(element, binding) {
    texts.set(element, binding.value ?? '');
    // Text changes under the mouse (e.g. switch toggled): update the visible tooltip
    if (currentAnchor === element) {
      show(element);
    }
  },
  beforeUnmount(element) {
    const events = handlers.get(element);
    if (events !== undefined) {
      element.removeEventListener('mouseenter', events.show);
      element.removeEventListener('mouseleave', events.hide);
      if (currentAnchor === element) {
        events.hide();
      }
    }
  },
};
