// The blink itself: the element lights up three times, and with every flash a ring ripples outwards
// like a drop in water, so the change catches the eye even at the edge of the screen.
// Brightness plus glow, because most values are white text on dark ground – brightness alone would
// not change them. drop-shadow follows the element's shape, so hexagon tiles glow as hexagons.
import {prefersReducedMotion, supportsWebAnimations} from '@/client/utils/motion';
import {FlashTone, toneColor} from '@/client/utils/changeFlashTone';

const PULSES = 3;
const PULSE_MS = 420;
// How far the ring travels outwards, independent of the element size (a colony card ripples as far as a number)
const RIPPLE_SPREAD_PX = 18;

function pulse(element: HTMLElement, tone: FlashTone, delayMs: number): void {
  const OFF = `brightness(1) drop-shadow(0 0 0 ${toneColor(tone, 0)})`;
  const ON = `brightness(${tone === 'loss' ? 1.4 : 2.2}) drop-shadow(0 0 14px ${toneColor(tone)})`;
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

// Rotated elements (markers on the curved Mars scales) get the ring as a child: it then turns with
// them and keeps their shape. All others get it as an own layer in the document, because they may
// sit in a container that clips overflow.
function placeRing(element: HTMLElement, ring: HTMLElement, rect: DOMRect): void {
  const style = getComputedStyle(element);
  if (style.transform !== 'none') {
    if (style.position === 'static') {
      element.style.position = 'relative';
    }
    Object.assign(ring.style, {position: 'absolute', inset: '0', borderRadius: 'inherit'});
    element.appendChild(ring);
    return;
  }
  Object.assign(ring.style, {
    position: 'absolute',
    left: `${rect.left + window.scrollX}px`,
    top: `${rect.top + window.scrollY}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    borderRadius: rippleRadius(element, rect),
  });
  document.body.appendChild(ring);
}

// Board spaces are hexagons (data-flash-shape="hex", BoardSpace.vue, MoonSpace.vue): their ring is a hexagon
// growing outwards instead of a circle. Pointy top like the space's clip-path (board.less).
const HEX_POINTS = '50,0 100,25 100,75 50,100 0,75 0,25';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

function hexRipple(tone: FlashTone, delayMs: number, rect: DOMRect): void {
  const ring = document.createElementNS(SVG_NAMESPACE, 'svg');
  ring.setAttribute('class', 'change-flash-ripple');
  ring.setAttribute('viewBox', '0 0 100 100');
  ring.setAttribute('preserveAspectRatio', 'none');
  const hexagon = document.createElementNS(SVG_NAMESPACE, 'polygon');
  hexagon.setAttribute('points', HEX_POINTS);
  hexagon.setAttribute('fill', 'none');
  hexagon.setAttribute('stroke', toneColor(tone, 0.9));
  hexagon.setAttribute('stroke-width', '3');
  // The line stays 3px thick while the hexagon grows
  hexagon.setAttribute('vector-effect', 'non-scaling-stroke');
  ring.appendChild(hexagon);
  Object.assign(ring.style, {
    position: 'absolute',
    left: `${rect.left + window.scrollX}px`,
    top: `${rect.top + window.scrollY}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    overflow: 'visible',
    pointerEvents: 'none',
    zIndex: '10000',
    filter: `drop-shadow(0 0 6px ${toneColor(tone, 0.6)})`,
  });
  document.body.appendChild(ring);
  // Same outward travel as the round ring, in px of the larger side
  const grown = 1 + (2 * RIPPLE_SPREAD_PX) / Math.max(rect.width, rect.height);
  const animation = ring.animate([
    {transform: 'scale(1)', opacity: 1},
    {transform: `scale(${grown})`, opacity: 0},
  ], {duration: PULSE_MS, delay: delayMs, iterations: PULSES, easing: 'ease-out', fill: 'backwards'});
  animation.onfinish = () => ring.remove();
  animation.oncancel = () => ring.remove();
}

function ripple(element: HTMLElement, tone: FlashTone, delayMs: number): void {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return;
  }
  if (element.dataset.flashShape === 'hex') {
    hexRipple(tone, delayMs, rect);
    return;
  }
  const ring = document.createElement('div');
  ring.className = 'change-flash-ripple';
  Object.assign(ring.style, {
    outline: `3px solid ${toneColor(tone, 0.9)}`,
    pointerEvents: 'none',
    zIndex: '10000',
  });
  placeRing(element, ring, rect);
  const animation = ring.animate([
    {outlineOffset: '0px', outlineColor: toneColor(tone, 0.9), boxShadow: `0 0 12px 2px ${toneColor(tone, 0.6)}`},
    {outlineOffset: `${RIPPLE_SPREAD_PX}px`, outlineColor: toneColor(tone, 0), boxShadow: `0 0 12px 2px ${toneColor(tone, 0)}`},
  ], {duration: PULSE_MS, delay: delayMs, iterations: PULSES, easing: 'ease-out', fill: 'backwards'});
  animation.onfinish = () => ring.remove();
  animation.oncancel = () => ring.remove();
}

export function flashElement(element: HTMLElement, delayMs: number, tone: FlashTone = 'gain'): void {
  if (!supportsWebAnimations(element)) {
    return;
  }
  pulse(element, tone, delayMs);
  // Reduced motion: lighting up only, no moving ring
  if (!prefersReducedMotion()) {
    ripple(element, tone, delayMs);
  }
}
