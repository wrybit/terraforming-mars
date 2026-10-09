/**
 * Third settings column on wide screens: Setup, Rules, Milestones & Awards and Card pool move next to Expansions and Board,
 * so every option is visible side by side. Below the width the cards stay in the two fixed columns.
 */
// Below this the expansion tiles in the narrower first column cut their names off
export const THREE_COLUMN_MIN_WIDTH_PX = 1800;

/** Reports now and on every change whether the window is wide enough; returns the function that ends watching. */
export function watchThreeColumns(onChange: (threeColumns: boolean) => void): () => void {
  // Test environments without matchMedia: always two columns
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    onChange(false);
    return () => {};
  }
  const query = window.matchMedia(`(min-width: ${THREE_COLUMN_MIN_WIDTH_PX}px)`);
  const listener = () => onChange(query.matches);
  listener();
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
