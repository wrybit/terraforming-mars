// Uses free height in the right column (board, milestones, log) in levels – only as far as it fits the window.
// Levels in fixed order; each is kept only if the column still fits afterwards, and it stops at the first
// one that doesn't fit (later levels don't take space an earlier one didn't get).
// The classes are evaluated by player_home_columns.less.
// In the fixed layout the user can also set the Mars card height via the drag handle below it (RowResizeHandle.vue):
// then Mars is zoomed to that height instead of the "Mars wide" level.
import {RowResizeTarget} from '@/client/utils/rowResize';

// Contract with player_home_columns.less
export const MARS_WIDE_CLASS = 'player-home-columns__board--mars-wide';
export const LOG_FULL_CLASS = 'player-home-columns__board--log-full';
export const BOARD_WIDE_ZOOM_VARIABLE = '--board-wide-zoom';
// Base zoom: board never wider than the column (the user sets the column width via drag handle, columnResize.ts)
export const BOARD_FIT_ZOOM_VARIABLE = '--board-fit-zoom';

// Requested Mars card height (px) on the column; limits are written by fit() for the drag handle
export const MARS_HEIGHT_ATTRIBUTE = 'data-mars-height';
const MARS_MIN_HEIGHT_ATTRIBUTE = 'data-mars-min-height';
const MARS_MAX_HEIGHT_ATTRIBUTE = 'data-mars-max-height';
// Fired on the column when the requested height changes, so the observer refits
export const MARS_HEIGHT_EVENT = 'mars-height-change';
// Smallest Mars relative to its widest size
const MIN_MARS_SIZE_SHARE = 0.4;
// Only the fixed layout (window-high columns, player_home_fixed.less) has a height to distribute
const FIXED_LAYOUT_SELECTOR = '.player-home--fixed';
const LOG_SELECTOR = '.player-home-columns__log';
const LOG_PANEL_SELECTOR = '.log-panel';

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
// Content box (without padding and border): the board must fit inside the card frame
function contentBox(element: Element): {left: number; right: number; width: number} {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const left = rect.left + (parseFloat(style.borderLeftWidth) || 0) + (parseFloat(style.paddingLeft) || 0);
  const right = rect.right - (parseFloat(style.borderRightWidth) || 0) - (parseFloat(style.paddingRight) || 0);
  return {left, right, width: Math.max(0, right - left)};
}

const MILESTONES_SELECTOR = '.player_home_block--milestones-and-awards';
const MARS_BLOCK_SELECTOR = '.player-home-columns__mars';
// The box of the board tabs (BoardTabs.vue) carries the card frame and padding – Mars must fit inside it
const BOARD_TABS_PANEL_SELECTOR = '.board-tabs-panel';
function widthReference(column: HTMLElement): Element | undefined {
  const milestones = column.querySelector(MILESTONES_SELECTOR);
  if (milestones !== null && milestones.getBoundingClientRect().width > 0) {
    return milestones;
  }
  return column.querySelector(BOARD_TABS_PANEL_SELECTOR) ?? column.querySelector(MARS_BLOCK_SELECTOR) ?? undefined;
}

// Outer spaces left of the planet (colony, spaceport) with labels and scales on the right: when a large Mars is centered
// over a wide reference, they stick out of the card frame. Returns the factor by which the zoom must drop so everything
// stays inside the reference's content box (1 = fits).
function overflowScale(reference: Element, board: HTMLElement): number {
  const center = globeCenter(board);
  if (center === undefined) {
    return 1;
  }
  const bounds = contentBox(reference);
  const rects = [...board.querySelectorAll('*')]
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);
  if (rects.length === 0) {
    return 1;
  }
  const leftmost = Math.min(...rects.map((rect) => rect.left));
  const rightmost = Math.max(...rects.map((rect) => rect.right));
  let scale = 1;
  if (leftmost < bounds.left && center > bounds.left) {
    scale = Math.min(scale, (center - bounds.left) / (center - leftmost));
  }
  if (rightmost > bounds.right && center < bounds.right) {
    scale = Math.min(scale, (bounds.right - center) / (rightmost - center));
  }
  return scale;
}

// Mars card height chosen by the user: zoom Mars so it fills exactly that height. Limits: not wider than the column
// (widenZoom), not smaller than MIN_MARS_SIZE_SHARE of that, and the log below keeps its minimum height.
// Measured with the board at zoom 1 (fit() resets it before).
function fitMarsHeight(column: HTMLElement, block: HTMLElement, board: HTMLElement, widenZoom: number, available: number): boolean {
  block.style.height = '';
  const naturalHeight = block.getBoundingClientRect().height;
  const boardStyle = getComputedStyle(board);
  const boardOuter = board.getBoundingClientRect().height + (parseFloat(boardStyle.marginTop) || 0) + (parseFloat(boardStyle.marginBottom) || 0);
  if (boardOuter <= 0) {
    return false;
  }
  const chrome = naturalHeight - boardOuter;
  // Free height of the log beyond its minimum (the log grows into the rest of the fixed column)
  const log = column.querySelector(LOG_SELECTOR);
  const logPanel = column.querySelector(LOG_PANEL_SELECTOR);
  const logSlack = log !== null && logPanel !== null ?
    Math.max(0, logPanel.getBoundingClientRect().height - (parseFloat(getComputedStyle(logPanel).minHeight) || 0)) :
    Math.max(0, available - column.scrollHeight);
  const maxZoom = Math.min(widenZoom, (naturalHeight + logSlack - chrome) / boardOuter);
  const max = Math.floor(chrome + boardOuter * maxZoom);
  const min = Math.min(max, Math.ceil(chrome + boardOuter * widenZoom * MIN_MARS_SIZE_SHARE));
  column.setAttribute(MARS_MIN_HEIGHT_ATTRIBUTE, String(min));
  column.setAttribute(MARS_MAX_HEIGHT_ATTRIBUTE, String(max));

  const requested = Number(column.getAttribute(MARS_HEIGHT_ATTRIBUTE));
  if (!(requested > 0)) {
    return false;
  }
  const height = Math.min(max, Math.max(min, requested));
  block.style.height = `${height}px`;
  column.style.setProperty(BOARD_FIT_ZOOM_VARIABLE, String((height - chrome) / boardOuter));
  return true;
}

function fit(column: HTMLElement): void {
  column.classList.remove(...STEPS);
  column.style.setProperty(BOARD_FIT_ZOOM_VARIABLE, '1');
  const block = column.querySelector<HTMLElement>(MARS_BLOCK_SELECTOR);
  block?.style.removeProperty('height');

  // Without a height limit (single-column layout below 1400px) there is nothing to weigh
  const available = parseFloat(getComputedStyle(column).maxHeight);
  if (Number.isNaN(available)) {
    return;
  }

  // Zoom at which the board becomes as wide as the reference's content box (both measured in the same zoom space)
  const board = column.querySelector<HTMLElement>('.board-cont');
  const reference = widthReference(column);
  const widenZoom = board !== null && reference !== undefined ?
    contentBox(reference).width / board.getBoundingClientRect().width :
    1;
  column.style.setProperty(BOARD_WIDE_ZOOM_VARIABLE, String(widenZoom));

  // User-chosen Mars height (fixed layout only); otherwise the levels decide
  const heightFixed = board !== null && block !== null && column.closest(FIXED_LAYOUT_SELECTOR) !== null &&
    fitMarsHeight(column, block, board, widenZoom, available);
  if (!heightFixed) {
    // Narrow column: always shrink the board so it doesn't stick out past the edge
    column.style.setProperty(BOARD_FIT_ZOOM_VARIABLE, String(Math.min(1, widenZoom)));
  }

  for (const step of STEPS) {
    // Only enlarge Mars, never shrink it; with a fixed height the height decides the size
    if (step === MARS_WIDE_CLASS && (widenZoom <= 1 || heightFixed)) {
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
    const scale = overflowScale(reference, board);
    if (scale < 1) {
      // The zoom of the highest level reached is the effective one
      const variable = column.classList.contains(MARS_WIDE_CLASS) ? BOARD_WIDE_ZOOM_VARIABLE : BOARD_FIT_ZOOM_VARIABLE;
      const current = parseFloat(column.style.getPropertyValue(variable)) || 1;
      column.style.setProperty(variable, String(current * scale));
      centerMars(board, reference);
    }
  }
}

// Drag handle target for the Mars card (RowResizeHandle.vue); the column refits on every change
export function marsCardTarget(column: HTMLElement, block: HTMLElement): RowResizeTarget {
  return {
    current: () => block.getBoundingClientRect().height,
    limits() {
      const current = block.getBoundingClientRect().height;
      const min = Number(column.getAttribute(MARS_MIN_HEIGHT_ATTRIBUTE)) || current;
      const max = Number(column.getAttribute(MARS_MAX_HEIGHT_ATTRIBUTE)) || current;
      return {min, max: Math.max(min, max)};
    },
    apply(height) {
      if (height === undefined) {
        column.removeAttribute(MARS_HEIGHT_ATTRIBUTE);
      } else {
        column.setAttribute(MARS_HEIGHT_ATTRIBUTE, String(height));
      }
      column.dispatchEvent(new Event(MARS_HEIGHT_EVENT));
    },
  };
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
  column.addEventListener(MARS_HEIGHT_EVENT, schedule);
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
    column.removeEventListener(MARS_HEIGHT_EVENT, schedule);
    resizeObserver?.disconnect();
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
    }
    column.classList.remove(...STEPS);
    column.querySelector<HTMLElement>(MARS_BLOCK_SELECTOR)?.style.removeProperty('height');
  };
}
