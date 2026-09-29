// Eigener Tooltip statt des nativen title: Milchglas, öffnet nach oben, Nase zeigt mittig auf das Element.
// Ein gemeinsames Element am Seitenende (position: fixed), damit es weder von overflow noch von
// backdrop-filter der Vorfahren abgeschnitten oder falsch geblurrt wird. Stil in glass_tooltip.less.
// Nutzung: v-glass-tooltip="text" (leerer Text = kein Tooltip).
import {Directive} from 'vue';

export const GLASS_TOOLTIP_CLASS = 'glass-tooltip';
export const GLASS_TOOLTIP_VISIBLE_CLASS = 'glass-tooltip--visible';
export const GLASS_TOOLTIP_NOSE_VARIABLE = '--glass-tooltip-nose-x';
// Mindestabstand zum Fensterrand und Abstand zwischen Nasenspitze und Element (Vertrag mit glass_tooltip.less)
const VIEWPORT_MARGIN = 8;
const ANCHOR_GAP = 10;
// Nase nie direkt in der abgerundeten Ecke
const NOSE_EDGE_MARGIN = 14;

type Anchor = {left: number; width: number};

// Waagerecht mittig über dem Element, am Fensterrand eingeklemmt; die Nase bleibt über der Elementmitte
export function tooltipPosition(anchor: Anchor, tooltipWidth: number, viewportWidth: number): {left: number; noseX: number} {
  const center = anchor.left + anchor.width / 2;
  const maxLeft = Math.max(VIEWPORT_MARGIN, viewportWidth - VIEWPORT_MARGIN - tooltipWidth);
  const left = Math.min(maxLeft, Math.max(VIEWPORT_MARGIN, center - tooltipWidth / 2));
  const noseX = Math.min(tooltipWidth - NOSE_EDGE_MARGIN, Math.max(NOSE_EDGE_MARGIN, center - left));
  return {left, noseX};
}

let tooltip: HTMLElement | undefined;
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
  const element = tooltipElement();
  element.textContent = text;
  // Erst Text setzen, dann messen
  element.style.left = '0px';
  const anchor = anchorElement.getBoundingClientRect();
  const {left, noseX} = tooltipPosition(anchor, element.offsetWidth, document.documentElement.clientWidth);
  element.style.left = `${left}px`;
  element.style.top = `${anchor.top - ANCHOR_GAP - element.offsetHeight}px`;
  element.style.setProperty(GLASS_TOOLTIP_NOSE_VARIABLE, `${noseX}px`);
  element.classList.add(GLASS_TOOLTIP_VISIBLE_CLASS);
}

function hide(): void {
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
  },
  beforeUnmount(element) {
    const events = handlers.get(element);
    if (events !== undefined) {
      element.removeEventListener('mouseenter', events.show);
      element.removeEventListener('mouseleave', events.hide);
      events.hide();
    }
  },
};
