// Orientation of the milestone table in the log box (contract with milestone_award_table.less):
// with enough width one row per player; when the box gets too narrow for comfortable value columns,
// the table is transposed (players as columns, milestones and awards as rows) instead of scrolling.

// Name column plus the three dividers of the horizontal table (MilestoneAwardTable.columnTemplate)
const NAME_PART_WIDTH = 104 + 6 + 6 + 16;
// Below this width per value column the numbers and icons get cramped
const COMFORTABLE_COLUMN_WIDTH = 40;

// Width 0: not laid out yet (hidden tab) – keep the horizontal table
export function prefersTransposed(availableWidth: number, valueColumns: number): boolean {
  return availableWidth > 0 && availableWidth < NAME_PART_WIDTH + valueColumns * COMFORTABLE_COLUMN_WIDTH;
}

// Watches the container width and reports the preferred orientation; returns a cleanup function.
// Measures the container, not the table: its width doesn't depend on the orientation, so nothing flips back and forth.
export function observeOrientation(container: HTMLElement, valueColumns: () => number, onChange: (transposed: boolean) => void): () => void {
  const update = () => onChange(prefersTransposed(container.offsetWidth, valueColumns()));
  const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update);
  resizeObserver?.observe(container);
  update();
  return () => resizeObserver?.disconnect();
}
