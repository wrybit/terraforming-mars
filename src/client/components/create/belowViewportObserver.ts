/**
 * Reports whether an element still lies (partly) below the visible area, i.e. the user has not scrolled down to it
 * completely yet. `bottomInsetPx` shrinks the visible area at the bottom (e.g. for a bar floating there).
 * Returns the function that ends the observation.
 */
export function observeBelowViewport(element: HTMLElement, bottomInsetPx: number, onChange: (below: boolean) => void): () => void {
  // Test environments and very old browsers: never "below", so nothing extra is shown
  if (typeof IntersectionObserver === 'undefined') {
    return () => {};
  }
  const observer = new IntersectionObserver(
    // Not fully visible and its top edge is still under the visible area's bottom edge: lies below, not above
    ([entry]) => onChange(entry.intersectionRatio < 1 && entry.boundingClientRect.bottom > (entry.rootBounds?.bottom ?? window.innerHeight)),
    {rootMargin: `0px 0px -${bottomInsetPx}px 0px`, threshold: [0, 1]},
  );
  observer.observe(element);
  return () => observer.disconnect();
}
