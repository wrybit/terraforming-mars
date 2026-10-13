// Drag handle targets of the results page (GameEnd.vue, RowResizeHandle.vue), contract with game_end_columns.less:
// - victory point table: scales down (zoom) to the chosen height
// - board: by default as wide as its column allows (fit zoom); the handle sets a zoom up to that width
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
export const CHART_HEIGHT_LIMITS = {min: 180, max: 700};

const BOARD_SELECTOR = '.board-cont';

export function tableTarget(card: HTMLElement, table: HTMLElement): RowResizeTarget {
  return contentZoomTarget(card, {content: table, zoomVariable: TABLE_ZOOM_VARIABLE, minZoom: MIN_TABLE_ZOOM});
}

export function chartTarget(card: HTMLElement, chart: HTMLElement): RowResizeTarget {
  return contentHeightTarget(card, {content: chart, heightVariable: CHART_HEIGHT_VARIABLE, limits: CHART_HEIGHT_LIMITS});
}

// Zoom at which the board fills the width of its card
export function boardFitZoom(card: HTMLElement): number {
  return parseFloat(card.style.getPropertyValue(BOARD_FIT_ZOOM_VARIABLE)) || 1;
}

function measureBoardFit(card: HTMLElement, content: HTMLElement): number {
  const board = content.querySelector(BOARD_SELECTOR);
  if (board === null) {
    return 1;
  }
  const cardStyle = getComputedStyle(card);
  const available = card.clientWidth - parseFloat(cardStyle.paddingLeft) - parseFloat(cardStyle.paddingRight);
  // Natural width: board at zoom 1 (whatever the handle or the fit currently set) plus the room the content keeps
  // beside it for the colony spaces and scales (its padding, scaled along)
  const saved = card.style.getPropertyValue(BOARD_ZOOM_VARIABLE);
  card.style.setProperty(BOARD_ZOOM_VARIABLE, '1');
  const contentStyle = getComputedStyle(content);
  const natural = board.getBoundingClientRect().width + parseFloat(contentStyle.paddingLeft) + parseFloat(contentStyle.paddingRight);
  card.style.setProperty(BOARD_ZOOM_VARIABLE, saved);
  return natural > 0 ? Math.min(MAX_BOARD_ZOOM, available / natural) : 1;
}

export function boardTarget(card: HTMLElement, content: HTMLElement): RowResizeTarget {
  return contentZoomTarget(card, {content, zoomVariable: BOARD_ZOOM_VARIABLE, minZoom: MIN_BOARD_ZOOM, maxZoom: () => boardFitZoom(card)});
}

// Keeps the fit zoom up to date when the column width changes (window, column handle); onChange lets the handle
// clamp a chosen zoom to the new width. Returns a cleanup function.
export function observeBoardFit(card: HTMLElement, content: HTMLElement, onChange: () => void): () => void {
  let lastWidth = -1;
  const update = () => {
    const width = card.clientWidth;
    if (width === lastWidth) {
      return;
    }
    lastWidth = width;
    card.style.setProperty(BOARD_FIT_ZOOM_VARIABLE, String(measureBoardFit(card, content)));
    onChange();
  };
  update();
  // Without ResizeObserver (test environment) the fit is only measured once
  if (typeof ResizeObserver === 'undefined') {
    return () => {};
  }
  const observer = new ResizeObserver(update);
  observer.observe(card);
  return () => observer.disconnect();
}
