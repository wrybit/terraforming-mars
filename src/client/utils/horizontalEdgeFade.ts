// Soft fade at the left and right edge of a sideways scrolling row, but only on the side where more content
// is hidden: at the start there is nothing to the left, at the end nothing to the right, a row that fits
// shows no fade at all. The widths go into CSS variables that the mask in .horizontal-edge-fade() reads.

// Width of the fade on a side that has hidden content
export const HORIZONTAL_EDGE_FADE = 32;

// Rounding of scroll positions (zoom, fractional pixels) must not leave a fade at the very end
const TOLERANCE = 1;

function update(element: HTMLElement): void {
  const hiddenLeft = element.scrollLeft > TOLERANCE;
  const hiddenRight = element.scrollLeft + element.clientWidth < element.scrollWidth - TOLERANCE;
  element.style.setProperty('--edge-fade-left', `${hiddenLeft ? HORIZONTAL_EDGE_FADE : 0}px`);
  element.style.setProperty('--edge-fade-right', `${hiddenRight ? HORIZONTAL_EDGE_FADE : 0}px`);
}

/** Keeps the fade in step with scrolling and size changes; returns the cleanup for unmounting. */
export function watchHorizontalEdgeFade(element: HTMLElement): () => void {
  const onChange = () => update(element);
  element.addEventListener('scroll', onChange, {passive: true});
  // Size of the row and of its content (images load later, cards change with the filter)
  const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(onChange);
  observer?.observe(element);
  for (const child of Array.from(element.children)) {
    observer?.observe(child);
  }
  onChange();
  return () => {
    element.removeEventListener('scroll', onChange);
    observer?.disconnect();
  };
}
