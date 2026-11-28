import {ZOOM_EASING, prefersReducedMotion, supportsWebAnimations} from './motion';

// A block at the top of a bottom-anchored footer (card impact above the payment area) slides out from
// behind the area below it, and back. Everything is a transform with the same timing, so the graphics card runs
// it in step: the whole footer (surface, blur, shadow) moves as one piece, its other children move the opposite
// way and so stay in place, among them the block's frame. The frame cuts off the block (overflow) at the edge of
// the area below, which is see-through glass on phones; the block inside moves along with the footer.
// The layout changes once at the start or the end, never per frame. `element` is always the frame.

const DURATION_MS = 300;

const timing = {duration: DURATION_MS, easing: ZOOM_EASING};

// Clean-up of a running animation (e.g. restoring the padding), so a quick next click starts from a clean state
const pendingCleanups = new WeakMap<Element, () => void>();

function footerOf(block: Element): HTMLElement | null {
  const footer = block.parentElement;
  return footer !== null && supportsWebAnimations(footer) ? footer : null;
}

// All children of the footer (the frame included) keep their place on screen
function partsOf(frame: Element): Array<HTMLElement> {
  return Array.from(frame.parentElement?.children ?? []).filter((child): child is HTMLElement => child instanceof HTMLElement);
}

function blockOf(frame: Element): HTMLElement | undefined {
  const block = frame.firstElementChild;
  return block instanceof HTMLElement ? block : undefined;
}

function cancelAll(frame: Element): void {
  [frame.parentElement, ...partsOf(frame), blockOf(frame)].forEach((element) => element?.getAnimations().forEach((animation) => animation.cancel()));
}

// Ends a running animation of the block at once: before measuring it again or starting the next one
export function revealSettle(element: Element): void {
  const cleanup = pendingCleanups.get(element);
  pendingCleanups.delete(element);
  cleanup?.();
  if (supportsWebAnimations(element)) {
    cancelAll(element);
  }
}

// Distance from the block's top to the area below it: its height plus the gap that follows it
function revealDistance(block: HTMLElement): number {
  const footer = block.parentElement;
  const gap = footer === null ? 0 : parseFloat(getComputedStyle(footer).rowGap) || 0;
  return block.getBoundingClientRect().height + gap + (parseFloat(getComputedStyle(block).marginBottom) || 0);
}

// Moves the footer and the block from `from` to `to` pixels down while all parts of the footer stay in place
function moveFooter(frame: HTMLElement, from: number, to: number, keepEnd: boolean): Animation | undefined {
  const footer = footerOf(frame);
  const block = blockOf(frame);
  if (footer === null || block === undefined) {
    return undefined;
  }
  const options = {...timing, fill: keepEnd ? 'forwards' as const : 'none' as const};
  const frames = [{transform: `translateY(${from}px)`}, {transform: `translateY(${to}px)`}];
  const counterFrames = [{transform: `translateY(${-from}px)`}, {transform: `translateY(${-to}px)`}];
  const animation = footer.animate(frames, options);
  partsOf(frame).forEach((part) => part.animate(counterFrames, options));
  block.animate(frames, options);
  // Parts added while it runs (the payment area is rebuilt for the new card) join the counter movement in step
  const observer = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
    if (node instanceof HTMLElement) {
      node.animate(counterFrames, options).currentTime = animation.currentTime;
    }
  })));
  observer.observe(footer, {childList: true});
  const stop = () => observer.disconnect();
  animation.addEventListener('finish', stop);
  animation.addEventListener('cancel', stop);
  return animation;
}

function canAnimate(element: Element): element is HTMLElement {
  return supportsWebAnimations(element) && !prefersReducedMotion();
}

export function revealEnter(element: Element, done: () => void): void {
  if (!canAnimate(element)) {
    done();
    return;
  }
  revealSettle(element);
  // The footer already has its new height: it starts lowered by the block, so its top edge rises from where it was
  const animation = moveFooter(element, revealDistance(element), 0, false);
  if (animation === undefined) {
    done();
    return;
  }
  animation.onfinish = () => done();
}

export function revealLeave(element: Element, done: () => void): void {
  if (!canAnimate(element)) {
    done();
    return;
  }
  revealSettle(element);
  const footer = element.parentElement;
  const animation = moveFooter(element, 0, revealDistance(element), true);
  if (animation === undefined) {
    done();
    return;
  }
  animation.onfinish = () => {
    // Remove the block first, then release the footer and its current parts (some may have been rebuilt
    // meanwhile): the other way round it flashes up for one frame
    done();
    [footer, ...Array.from(footer?.children ?? [])].forEach((part) => part?.getAnimations().forEach((animation) => animation.cancel()));
    blockOf(element)?.getAnimations().forEach((running) => running.cancel());
  };
}

// The block's content changed (other card): the footer's height difference slides instead of jumping.
// Call revealSettle and measure the height before the change.
export function revealResize(element: Element, previousHeight: number): void {
  if (!canAnimate(element)) {
    return;
  }
  const difference = element.getBoundingClientRect().height - previousHeight;
  if (Math.abs(difference) < 1) {
    return;
  }
  if (difference > 0) {
    moveFooter(element, difference, 0, false);
    return;
  }
  // Lower: the block keeps the old height with extra bottom padding (its glass still reaches the area below)
  // while it slides down, then the padding is dropped (one layout change at the end, where it has arrived)
  const block = blockOf(element);
  if (block === undefined) {
    return;
  }
  const padding = block.style.paddingBottom;
  block.style.paddingBottom = `${parseFloat(getComputedStyle(block).paddingBottom) - difference}px`;
  pendingCleanups.set(element, () => {
    block.style.paddingBottom = padding;
  });
  const animation = moveFooter(element, 0, -difference, true);
  if (animation !== undefined) {
    animation.onfinish = () => revealSettle(element);
  }
}

// Cross-fade of the content when the card changes: a copy of the old lines fades out over the new ones
export function crossFade(element: HTMLElement, oldContent: HTMLElement): void {
  if (!canAnimate(element)) {
    return;
  }
  element.appendChild(oldContent);
  // Same duration and linear on both sides: together they stay fully visible, no dip in the middle
  const fadeTiming = {duration: DURATION_MS, easing: 'linear'};
  const fadeOut = oldContent.animate([{opacity: 1}, {opacity: 0}], {...fadeTiming, fill: 'forwards'});
  fadeOut.onfinish = () => oldContent.remove();
  Array.from(element.children).filter((child) => child !== oldContent)
    .forEach((child) => child.animate([{opacity: 0}, {opacity: 1}], fadeTiming));
}
