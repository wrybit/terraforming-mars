// Provides the left edge of the right column (board + log) as a CSS variable.
// The opponent modal (player_home_columns.less) uses it to cover exactly this column, even if its
// width varies with the content (milestones, Turmoil, zoom) – fixed values in CSS would be too fragile.

export const BOARD_COLUMN_LEFT_VARIABLE = '--board-column-left';

// Starts observing and returns a cleanup function
export function observeBoardColumn(column: HTMLElement): () => void {
  let written: string | undefined;
  const update = () => {
    const left = column.getBoundingClientRect().left + 'px';
    // Only on a real change: a variable on the root element makes the browser recalculate the styles of the whole
    // page, and the column reports every height change (the replay changes it on every step)
    if (left !== written) {
      written = left;
      document.documentElement.style.setProperty(BOARD_COLUMN_LEFT_VARIABLE, left);
    }
  };
  // Column width changes with the content, the position with the window width.
  // Without ResizeObserver (test environment) only observe the window
  const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update);
  resizeObserver?.observe(column);
  window.addEventListener('resize', update);
  update();

  return () => {
    resizeObserver?.disconnect();
    window.removeEventListener('resize', update);
    document.documentElement.style.removeProperty(BOARD_COLUMN_LEFT_VARIABLE);
  };
}
