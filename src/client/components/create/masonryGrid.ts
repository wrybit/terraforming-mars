/**
 * Masonry for the settings cards of "Create game": the container is a grid with 1px rows, every card spans as many
 * rows as it is high (plus the gap). The grid's normal auto-placement then puts each card into the column that is free
 * first – the columns stay balanced without gaps, the first cards stay side by side in reading order.
 * Re-measures when a card changes its height or cards come and go. Returns the function that ends it.
 */
export function startMasonryGrid(container: HTMLElement, gapPx: number): () => void {
  // Test environments without the observers keep the plain grid
  if (typeof ResizeObserver === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {};
  }
  const layout = (card: HTMLElement) => {
    card.style.gridRowEnd = `span ${Math.ceil(card.getBoundingClientRect().height / currentZoom(container) + gapPx)}`;
  };
  const resizeObserver = new ResizeObserver((entries) => entries.forEach((entry) => layout(entry.target as HTMLElement)));
  const observeChildren = () => {
    for (const child of Array.from(container.children)) {
      resizeObserver.observe(child);
    }
  };
  const mutationObserver = new MutationObserver(observeChildren);
  observeChildren();
  mutationObserver.observe(container, {childList: true});
  return () => {
    resizeObserver.disconnect();
    mutationObserver.disconnect();
  };
}

// getBoundingClientRect includes a CSS zoom of the page; grid rows are counted without it
function currentZoom(element: HTMLElement): number {
  const zoom = Number(getComputedStyle(element).zoom);
  return Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
}
