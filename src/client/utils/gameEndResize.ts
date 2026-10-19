// Drag handle targets of the results page (GameEnd.vue, RowResizeHandle.vue), contract with game_end_columns.less:
// - victory point table: scales down (zoom) to the chosen height
// - board: by default as large as the column allows (fit zoom: column width, and in the window-high layout the room
//   the charts and the log leave); the handle sets a zoom between a minimum and the column width – larger than the
//   fit the column scrolls (game_end_columns.less)
// - charts: height of the chart area
import {RowResizeTarget} from '@/client/utils/rowResize';
import {contentHeightTarget, contentZoomTarget} from '@/client/utils/contentResizeTarget';

export const TABLE_ZOOM_VARIABLE = '--game-end-table-zoom';
export const MIN_TABLE_ZOOM = 0.6;

export const BOARD_ZOOM_VARIABLE = '--game-end-board-zoom';
export const BOARD_FIT_ZOOM_VARIABLE = '--game-end-board-fit-zoom';
export const MIN_BOARD_ZOOM = 0.5;
// Upper bound of the fit zoom: on very wide columns the board would otherwise make the page endlessly long
export const MAX_BOARD_ZOOM = 1.6;

export const CHART_HEIGHT_VARIABLE = '--game-end-chart-height';
export const CHART_HEIGHT_LIMITS = {min: 120, max: 700};

const BOARD_SELECTOR = '.board-cont';
const LOG_SELECTOR = '.game_end_block--log';
// Below this the fit does not shrink the board further; the column runs over instead (page scrolls)
const MIN_FIT_ZOOM = 0.3;

export function tableTarget(card: HTMLElement, table: HTMLElement): RowResizeTarget {
  return contentZoomTarget(card, {content: table, zoomVariable: TABLE_ZOOM_VARIABLE, minZoom: MIN_TABLE_ZOOM});
}

export function chartTarget(card: HTMLElement, chart: HTMLElement): RowResizeTarget {
  return contentHeightTarget(card, {content: chart, heightVariable: CHART_HEIGHT_VARIABLE, limits: CHART_HEIGHT_LIMITS});
}

// Zoom at which the board fills its card: as wide as the column and – in the window-high layout – only as high as
// the room the charts and the log (at its minimum height) leave
export function boardFitZoom(card: HTMLElement): number {
  return parseFloat(card.style.getPropertyValue(BOARD_FIT_ZOOM_VARIABLE)) || 1;
}

type BoardFit = {
  // Default zoom: column width and window height
  fit: number;
  // Largest zoom of the handle: column width only. Limited to the fit before, the handle could not make the board
  // larger at all and in low windows (fit below MIN_BOARD_ZOOM) not move at all
  widthFit: number;
};

// Last measured width fit per card (observeBoardFit); the CSS only needs the default fit
const widthFits = new WeakMap<HTMLElement, number>();

function measureBoardFit(card: HTMLElement, content: HTMLElement): BoardFit {
  const board = content.querySelector(BOARD_SELECTOR);
  if (board === null) {
    return {fit: 1, widthFit: 1};
  }
  const cardStyle = getComputedStyle(card);
  const available = card.clientWidth - parseFloat(cardStyle.paddingLeft) - parseFloat(cardStyle.paddingRight);
  // Natural size: board at zoom 1 (whatever the handle or the fit currently set) plus the room the content keeps
  // beside it for the colony spaces and scales (its padding, scaled along)
  const saved = card.style.getPropertyValue(BOARD_ZOOM_VARIABLE);
  card.style.setProperty(BOARD_ZOOM_VARIABLE, '1');
  const contentStyle = getComputedStyle(content);
  const naturalWidth = board.getBoundingClientRect().width + parseFloat(contentStyle.paddingLeft) + parseFloat(contentStyle.paddingRight);
  const heightRoom = roomForContentHeight(card, content);
  const naturalHeight = content.getBoundingClientRect().height;
  card.style.setProperty(BOARD_ZOOM_VARIABLE, saved);
  if (naturalWidth <= 0) {
    return {fit: 1, widthFit: 1};
  }
  const widthFit = Math.min(MAX_BOARD_ZOOM, available / naturalWidth);
  const heightFit = heightRoom === undefined || naturalHeight <= 0 ? Infinity : Math.max(MIN_FIT_ZOOM, heightRoom / naturalHeight);
  return {fit: Math.min(widthFit, heightFit), widthFit};
}

// Height left for the board content in the window-high layout (game_end_columns.less): the column ends at the window,
// below the card come the charts and the log at its minimum height. undefined in the scrolling layouts
// (no minimum height on the log there), where the height does not limit the board.
function roomForContentHeight(card: HTMLElement, content: HTMLElement): number | undefined {
  const column = card.parentElement;
  const log = column?.querySelector<HTMLElement>(LOG_SELECTOR);
  if (column === null || column === undefined || log === null || log === undefined) {
    return undefined;
  }
  const logMinHeight = parseFloat(getComputedStyle(log).minHeight);
  if (!(logMinHeight > 0)) {
    return undefined;
  }
  const cardRect = card.getBoundingClientRect();
  // Everything between the card and the log (handles, charts, gaps) keeps its size whatever the board does
  const between = log.getBoundingClientRect().top - cardRect.bottom;
  const cardRoom = column.getBoundingClientRect().bottom - logMinHeight - between - cardRect.top;
  const chrome = cardRect.height - content.getBoundingClientRect().height;
  return cardRoom - chrome;
}

// Range of the handle: from the minimum (or the fit, if that is even smaller) up to the column width
export function boardZoomRange(fit: number, widthFit: number): {min: number, max: number} {
  return {min: Math.min(MIN_BOARD_ZOOM, fit), max: Math.max(fit, widthFit)};
}

export function boardTarget(card: HTMLElement, content: HTMLElement): RowResizeTarget {
  const fit = boardFitZoom(card);
  const range = boardZoomRange(fit, widthFits.get(card) ?? fit);
  return contentZoomTarget(card, {content, zoomVariable: BOARD_ZOOM_VARIABLE, minZoom: range.min, maxZoom: () => range.max});
}

// Keeps the fit zoom up to date when the room changes (window, column handle, charts handle); onChange lets the
// handle clamp a chosen zoom to the new room. Returns a cleanup function.
export function observeBoardFit(card: HTMLElement, content: HTMLElement, onChange: () => void): () => void {
  let lastFit = -1;
  const update = () => {
    const {fit, widthFit} = measureBoardFit(card, content);
    widthFits.set(card, widthFit);
    // Its own resize (new zoom) triggers the observer again: only react to a real change, otherwise it would loop
    if (Math.abs(fit - lastFit) < 0.001) {
      return;
    }
    lastFit = fit;
    card.style.setProperty(BOARD_FIT_ZOOM_VARIABLE, String(fit));
    onChange();
  };
  update();
  // Without ResizeObserver (test environment) the fit is only measured once
  if (typeof ResizeObserver === 'undefined') {
    return () => {};
  }
  const observer = new ResizeObserver(update);
  // The card (width), the column (window height) and its other cards (charts height)
  observer.observe(card);
  const column = card.parentElement;
  if (column !== null) {
    observer.observe(column);
    for (const sibling of Array.from(column.children)) {
      if (sibling !== card) {
        observer.observe(sibling);
      }
    }
  }
  return () => observer.disconnect();
}
