/**
 * Reports whether an element with `position: sticky; bottom: <offset>` currently sticks to the bottom edge.
 * While it sticks, its lower edge lies exactly at the offset above the viewport bottom; a viewport shrunk by
 * one pixel more then no longer contains it completely. Returns the function that ends the observation.
 */
export function observeStickyBottom(element: HTMLElement, offsetPx: number, onChange: (stuck: boolean) => void): () => void {
  // Test environments and very old browsers: never "stuck", the element just has no extra shadow
  if (typeof IntersectionObserver === 'undefined') {
    return () => {};
  }
  const observer = new IntersectionObserver(
    ([entry]) => onChange(entry.intersectionRatio < 1 && entry.boundingClientRect.top < window.innerHeight),
    {rootMargin: `0px 0px -${offsetPx + 1}px 0px`, threshold: [1]},
  );
  observer.observe(element);
  return () => observer.disconnect();
}
