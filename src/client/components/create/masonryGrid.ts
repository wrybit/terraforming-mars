/**
 * Masonry for the settings cards of "Create game": the container is a grid with 1px rows, every card spans as many
 * rows as it is high (plus the gap) and gets its column assigned here. The first cards stay side by side (one per
 * column); the others are spread so both columns end up as equally long as possible, keeping their order within a
 * column (dense placement fills each column from the top). Re-arranges when a card changes its height or cards come
 * and go. Returns the function that ends it.
 */
export function startMasonryGrid(container: HTMLElement, gapPx: number): () => void {
  // Test environments without the observers keep the plain grid
  if (typeof ResizeObserver === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {};
  }
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => arrange(container, gapPx));
  };
  const resizeObserver = new ResizeObserver(schedule);
  const observeChildren = () => {
    resizeObserver.disconnect();
    resizeObserver.observe(container);
    for (const child of Array.from(container.children)) {
      resizeObserver.observe(child);
    }
    schedule();
  };
  const mutationObserver = new MutationObserver(observeChildren);
  observeChildren();
  mutationObserver.observe(container, {childList: true});
  return () => {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    mutationObserver.disconnect();
  };
}

function arrange(container: HTMLElement, gapPx: number): void {
  const cards = Array.from(container.children) as Array<HTMLElement>;
  const columnCount = getComputedStyle(container).gridTemplateColumns.split(' ').filter((value) => value !== '').length;
  const heights = cards.map((card) => card.offsetHeight + gapPx);
  const columns = columnCount === 2 ? balancedColumns(heights, 2) : cards.map(() => 0);
  cards.forEach((card, index) => {
    card.style.gridRowEnd = `span ${Math.ceil(heights[index])}`;
    card.style.gridColumn = columnCount === 2 ? String(columns[index] + 1) : '';
  });
}

/**
 * Column per card: the first `columnCount` cards one per column, the rest so that the longest column is as short as
 * possible. Tries every assignment – there are only a handful of cards. On a tie the earlier found one wins.
 */
export function balancedColumns(heights: ReadonlyArray<number>, columnCount: number): Array<number> {
  const fixed = heights.slice(0, columnCount).map((_, index) => index);
  const rest = heights.slice(columnCount);
  let best: Array<number> = [];
  let bestHeight = Infinity;
  const combinations = Math.pow(columnCount, rest.length);
  for (let combination = 0; combination < combinations; combination++) {
    const assignment: Array<number> = [];
    let remainder = combination;
    for (let index = 0; index < rest.length; index++) {
      assignment.push(remainder % columnCount);
      remainder = Math.floor(remainder / columnCount);
    }
    const totals = fixed.map((column) => heights[column]);
    assignment.forEach((column, index) => totals[column] += rest[index]);
    const tallest = Math.max(...totals);
    if (tallest < bestHeight) {
      bestHeight = tallest;
      best = assignment;
    }
  }
  return [...fixed, ...best];
}
