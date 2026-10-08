import {ZOOM_EASING, prefersReducedMotion, supportsWebAnimations} from './motion';

// Opens or closes a list entry vertically (height, padding, border and the list gap),
// so the neighbours slide along instead of jumping. Usable as Transition/TransitionGroup hooks.

const DURATION_MS = 320;

type Frame = Record<string, string | number>;

function collapsedFrame(gapPx: number): Frame {
  return {height: '0px', paddingTop: '0px', paddingBottom: '0px', borderTopWidth: '0px', borderBottomWidth: '0px',
    marginTop: `-${gapPx}px`, opacity: 0, transform: 'translateY(-8px) scale(0.98)'};
}

function openFrame(element: HTMLElement): Frame {
  const style = getComputedStyle(element);
  return {height: `${element.getBoundingClientRect().height}px`, paddingTop: style.paddingTop, paddingBottom: style.paddingBottom,
    borderTopWidth: style.borderTopWidth, borderBottomWidth: style.borderBottomWidth, marginTop: '0px', opacity: 1, transform: 'none'};
}

// Gap of the surrounding flex/grid list: closing it too keeps the end position exact
function listGap(element: HTMLElement): number {
  const parent = element.parentElement;
  return parent === null ? 0 : parseFloat(getComputedStyle(parent).rowGap) || 0;
}

function animate(element: Element, opening: boolean, done: () => void): void {
  const target = element as HTMLElement;
  if (!supportsWebAnimations(target) || prefersReducedMotion()) {
    done();
    return;
  }
  // Measured height includes padding and border
  target.style.boxSizing = 'border-box';
  target.style.overflow = 'hidden';
  const frames = [collapsedFrame(listGap(target)), openFrame(target)];
  const animation = target.animate(opening ? frames : frames.reverse(), {duration: DURATION_MS, easing: ZOOM_EASING});
  animation.onfinish = () => {
    target.style.boxSizing = '';
    target.style.overflow = '';
    done();
  };
}

export function collapseEnter(element: Element, done: () => void): void {
  animate(element, true, done);
}

export function collapseLeave(element: Element, done: () => void): void {
  animate(element, false, done);
}
