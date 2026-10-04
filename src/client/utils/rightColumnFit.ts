// Uses free height in the right column (board, milestones, log) in levels – only as far as it fits the window.
// Levels in fixed order; each is kept only if the column still fits afterwards, and it stops at the first
// one that doesn't fit (later levels don't take space an earlier one didn't get).
// The classes are evaluated by player_home_columns.less.

// Contract with player_home_columns.less
export const MARS_WIDE_CLASS = 'player-home-columns__board--mars-wide';
export const LOG_FULL_CLASS = 'player-home-columns__board--log-full';
export const BOARD_WIDE_ZOOM_VARIABLE = '--board-wide-zoom';
// Base zoom: board never wider than the column (the user sets the column width via drag handle, columnResize.ts)
export const BOARD_FIT_ZOOM_VARIABLE = '--board-fit-zoom';

const STEPS: ReadonlyArray<string> = [
  MARS_WIDE_CLASS, // 1) Mars as wide as the column (or the milestone block, where shown below Mars)
  LOG_FULL_CLASS, // 2) Log card at 100 % size, log correspondingly taller
];

const horizontalCenter = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return rect.left + rect.width / 2;
};

// Center of the planet disc = center of the hex spaces on Mars. The .board box itself is wider than the disc
// (room for scales on the right), so its center lies to the right of the planet.
const GLOBE_SPACES_SELECTOR = '.board .board-space';
function globeCenter(board: HTMLElement): number | undefined {
  const spaces = [...board.querySelectorAll(GLOBE_SPACES_SELECTOR)].map((space) => space.getBoundingClientRect());
  if (spaces.length === 0) {
    return undefined;
  }
  const left = Math.min(...spaces.map((rect) => rect.left));
  const right = Math.max(...spaces.map((rect) => rect.right));
  return (left + right) / 2;
}

// Move Mars (the sphere, not the whole board box with scales and outer spaces) centered over the reference.
// translate doesn't change the layout; the offset is measured once because zoom levels scale it.
function centerMars(board: HTMLElement, reference: Element): void {
  board.style.translate = '';
  const before = globeCenter(board);
  if (before === undefined) {
    return;
  }
  const probe = 100;
  board.style.translate = `${probe}px 0`;
  const scale = ((globeCenter(board) ?? before) - before) / probe;
  board.style.translate = scale > 0 ? `${(horizontalCenter(reference) - before) / scale}px 0` : '';
}

// Width Mars grows to and is centered over: the milestone block, where it is shown below Mars. Without it
// (desktop: milestones & awards are a tab of the log box; solo game; hidden via settings) the board block itself – otherwise Mars would stay small and left, or
// a hidden block with width 0 would shrink Mars to zoom 0.
const MILESTONES_SELECTOR = '.player_home_block--milestones-and-awards';
const MARS_BLOCK_SELECTOR = '.player-home-columns__mars';
function widthReference(column: HTMLElement): Element | undefined {
  const milestones = column.querySelector(MILESTONES_SELECTOR);
  if (milestones !== null && milestones.getBoundingClientRect().width > 0) {
    return milestones;
  }
  return column.querySelector(MARS_BLOCK_SELECTOR) ?? undefined;
}

// Outer spaces left of the planet (colony, spaceport) with labels: when a large Mars is centered over a wide
// reference, they stick out of the column on the left and its overflow clips them. Returns the factor by which the zoom
// must drop so everything from the left column edge stays visible (1 = fits).
function leftOverflowScale(column: HTMLElement, board: HTMLElement): number {
  const center = globeCenter(board);
  if (center === undefined) {
    return 1;
  }
  const columnLeft = column.getBoundingClientRect().left;
  const lefts = [...board.querySelectorAll('*')]
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .map((rect) => rect.left);
  const leftmost = Math.min(...lefts);
  if (leftmost >= columnLeft || center <= columnLeft) {
    return 1;
  }
  return (center - columnLeft) / (center - leftmost);
}

function fit(column: HTMLElement): void {
  column.classList.remove(...STEPS);
  column.style.setProperty(BOARD_FIT_ZOOM_VARIABLE, '1');

  // Without a height limit (single-column layout below 1400px) there is nothing to weigh
  const available = parseFloat(getComputedStyle(column).maxHeight);
  if (Number.isNaN(available)) {
    return;
  }

  // Zoom at which the board becomes as wide as the reference (both measured in the same zoom space)
  const board = column.querySelector<HTMLElement>('.board-cont');
  const reference = widthReference(column);
  const widenZoom = board !== null && reference !== undefined ?
    reference.getBoundingClientRect().width / board.getBoundingClientRect().width :
    1;
  column.style.setProperty(BOARD_WIDE_ZOOM_VARIABLE, String(widenZoom));
  // Narrow column: always shrink the board so it doesn't stick out past the edge
  column.style.setProperty(BOARD_FIT_ZOOM_VARIABLE, String(Math.min(1, widenZoom)));

  for (const step of STEPS) {
    // Only enlarge Mars, never shrink it
    if (step === MARS_WIDE_CLASS && widenZoom <= 1) {
      continue;
    }
    column.classList.add(step);
    if (column.scrollHeight > available) {
      column.classList.remove(step);
      break;
    }
  }

  if (board !== null && reference !== undefined) {
    centerMars(board, reference);
    const scale = leftOverflowScale(column, board);
    if (scale < 1) {
      // The zoom of the highest level reached is the effective one
      const variable = column.classList.contains(MARS_WIDE_CLASS) ? BOARD_WIDE_ZOOM_VARIABLE : BOARD_FIT_ZOOM_VARIABLE;
      const current = parseFloat(column.style.getPropertyValue(variable)) || 1;
      column.style.setProperty(variable, String(current * scale));
      centerMars(board, reference);
    }
  }
}

// Starts fitting and returns a cleanup function
export function observeRightColumnFit(column: HTMLElement): () => void {
  let frame: number | undefined;
  // Recompute at most once per frame (resize fires in rapid succession)
  const schedule = () => {
    if (frame === undefined) {
      frame = requestAnimationFrame(() => {
        frame = undefined;
        fit(column);
      });
    }
  };
  window.addEventListener('resize', schedule);
  // Width also changes without a window resize (drag handle between the columns); ignore height,
  // fit() changes that itself. Without ResizeObserver (test environment) only observe the window
  let lastWidth = column.getBoundingClientRect().width;
  const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => {
    const width = column.getBoundingClientRect().width;
    if (width !== lastWidth) {
      lastWidth = width;
      schedule();
    }
  });
  resizeObserver?.observe(column);
  schedule();

  return () => {
    window.removeEventListener('resize', schedule);
    resizeObserver?.disconnect();
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
    }
    column.classList.remove(...STEPS);
  };
}
