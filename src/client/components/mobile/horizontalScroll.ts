// Klasse an waagerecht gescrollten Elementen: erst dann liegen Spieler-Spalten unter den stehenbleibenden
// Symbol-Spalten, und diese brauchen ihren Frosted-Glass-Hintergrund (mobile.less)
export const HORIZONTALLY_SCROLLED_CLASS = 'mb-scrolled-x';

/* Scroll-Ereignis (in der Capture-Phase eines Vorfahren abgefangen, da scroll nicht hochblubbert). */
export function markHorizontalScroll(event: Event): void {
  const target = event.target;
  if (target instanceof HTMLElement) {
    target.classList.toggle(HORIZONTALLY_SCROLLED_CLASS, target.scrollLeft > 0);
  }
}
