import {ZOOM_EASING, prefersReducedMotion, supportsWebAnimations} from './motion';

// Opens or closes a list entry vertically (height, padding, border and the list gap),
// so the neighbours slide along instead of jumping. Usable as Transition/TransitionGroup hooks.

const DURATION_MS = 320;

type Frame = Record<string, string | number>;

// How the block appears: lists open downward and fade in; a block on top of a bottom-anchored footer
// slides out from behind the area below it (no fade: its top edge rises, the area below covers the rest)
type SlideFrom = 'above' | 'behind';

// The list gap is closed on the side facing the neighbour: above for list entries, below for a block
// sitting on top of the area it slides out from (absolute, so a block that already overlaps the gap works too)
function collapsedFrame(gapPx: number, from: SlideFrom): Frame {
  const frame: Frame = {height: '0px', paddingTop: '0px', paddingBottom: '0px', borderTopWidth: '0px', borderBottomWidth: '0px'};
  return from === 'above' ?
    {...frame, marginTop: `-${gapPx}px`, opacity: 0, transform: 'translateY(-8px) scale(0.98)'} :
    {...frame, marginBottom: `-${gapPx}px`};
}

function openFrame(element: HTMLElement, from: SlideFrom): Frame {
  const style = getComputedStyle(element);
  const frame: Frame = {height: `${element.getBoundingClientRect().height}px`, paddingTop: style.paddingTop, paddingBottom: style.paddingBottom,
    borderTopWidth: style.borderTopWidth, borderBottomWidth: style.borderBottomWidth};
  return from === 'above' ?
    {...frame, marginTop: '0px', opacity: 1, transform: 'none'} :
    {...frame, marginBottom: style.marginBottom};
}

// Gap of the surrounding flex/grid list: closing it too keeps the end position exact
function listGap(element: HTMLElement): number {
  const parent = element.parentElement;
  return parent === null ? 0 : parseFloat(getComputedStyle(parent).rowGap) || 0;
}

function animate(element: Element, opening: boolean, done: () => void, from: SlideFrom = 'above'): void {
  const target = element as HTMLElement;
  if (!supportsWebAnimations(target) || prefersReducedMotion()) {
    done();
    return;
  }
  // Measured height includes padding and border
  target.style.boxSizing = 'border-box';
  target.style.overflow = 'hidden';
  // In a column flex container min-height:auto would keep the item at its content height
  target.style.minHeight = '0';
  const frames = [collapsedFrame(listGap(target), from), openFrame(target, from)];
  const animation = target.animate(opening ? frames : frames.reverse(), {duration: DURATION_MS, easing: ZOOM_EASING});
  animation.onfinish = () => {
    target.style.boxSizing = '';
    target.style.overflow = '';
    target.style.minHeight = '';
    done();
  };
}

export function collapseEnter(element: Element, done: () => void): void {
  animate(element, true, done);
}

export function collapseLeave(element: Element, done: () => void): void {
  animate(element, false, done);
}

// Block on top of a bottom-anchored footer (card impact above the payment area):
// comes out from behind the area below it and disappears behind it again
export function riseEnter(element: Element, done: () => void): void {
  animate(element, true, done, 'behind');
}

export function riseLeave(element: Element, done: () => void): void {
  animate(element, false, done, 'behind');
}
