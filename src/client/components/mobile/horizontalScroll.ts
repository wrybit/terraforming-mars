// Class on horizontally scrolled elements: only then do player columns lie below the sticky
// icon columns, and those need their frosted-glass background (mobile.less)
export const HORIZONTALLY_SCROLLED_CLASS = 'mb-scrolled-x';

/* Scroll event (caught in the capture phase of an ancestor, since scroll doesn't bubble). */
export function markHorizontalScroll(event: Event): void {
  const target = event.target;
  if (target instanceof HTMLElement) {
    target.classList.toggle(HORIZONTALLY_SCROLLED_CLASS, target.scrollLeft > 0);
  }
}
