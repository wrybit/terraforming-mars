// The blink itself: the element lights up five times, and with every flash a ring ripples outwards
// like a drop in water, so the change catches the eye even at the edge of the screen.
// Brightness plus glow, because most values are white text on dark ground – brightness alone would
// not change them. drop-shadow follows the element's shape, so hexagon tiles glow as hexagons.
import {prefersReducedMotion, supportsWebAnimations} from '@/client/utils/motion';

const PULSES = 5;
const PULSE_MS = 420;
const OFF = 'brightness(1) drop-shadow(0 0 0 rgba(255, 255, 255, 0))';
const ON = 'brightness(2.2) drop-shadow(0 0 14px rgb(255, 255, 255))';
// How far the ring travels outwards, independent of the element size (a colony card ripples as far as a number)
const RIPPLE_SPREAD_PX = 18;

function pulse(element: HTMLElement, delayMs: number): void {
  element.animate([
    {filter: OFF, offset: 0},
    {filter: ON, offset: 0.35},
    {filter: OFF, offset: 1},
  ], {duration: PULSE_MS, delay: delayMs, iterations: PULSES, easing: 'ease-in-out'});
}

// Rounded boxes (table cells, tabs) keep their shape, the ring then reads as the cell's own frame;
// square elements (hexagon tiles, numbers) get a circle/pill, like a ring in water
function rippleRadius(element: HTMLElement, rect: DOMRect): string {
  const radius = getComputedStyle(element).borderTopLeftRadius;
  return parseFloat(radius) > 0 ? radius : `${Math.min(rect.width, rect.height) / 2}px`;
}

// Ring as an own layer in the document: the element itself may sit in a container that clips overflow
function ripple(element: HTMLElement, delayMs: number): void {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return;
  }
  const ring = document.createElement('div');
  ring.className = 'change-flash-ripple';
  Object.assign(ring.style, {
    position: 'absolute',
    left: `${rect.left + window.scrollX}px`,
    top: `${rect.top + window.scrollY}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    borderRadius: rippleRadius(element, rect),
    outline: '3px solid rgba(255, 255, 255, 0.9)',
    pointerEvents: 'none',
    zIndex: '10000',
  });
  document.body.appendChild(ring);
  const animation = ring.animate([
    {outlineOffset: '0px', outlineColor: 'rgba(255, 255, 255, 0.9)', boxShadow: '0 0 12px 2px rgba(255, 255, 255, 0.6)'},
    {outlineOffset: `${RIPPLE_SPREAD_PX}px`, outlineColor: 'rgba(255, 255, 255, 0)', boxShadow: '0 0 12px 2px rgba(255, 255, 255, 0)'},
  ], {duration: PULSE_MS, delay: delayMs, iterations: PULSES, easing: 'ease-out', fill: 'backwards'});
  animation.onfinish = () => ring.remove();
  animation.oncancel = () => ring.remove();
}

export function flashElement(element: HTMLElement, delayMs: number): void {
  if (!supportsWebAnimations(element)) {
    return;
  }
  pulse(element, delayMs);
  // Reduced motion: lighting up only, no moving ring
  if (!prefersReducedMotion()) {
    ripple(element, delayMs);
  }
}
