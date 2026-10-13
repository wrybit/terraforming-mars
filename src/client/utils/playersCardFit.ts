// Height of the players card (left column) via the drag handle below it (RowResizeHandle.vue):
// the player table scales down to fit the chosen height (zoom) instead of scrolling, so all players stay visible.
// Never taller than the table at full size – there would only be empty space.
import {RowResizeTarget} from '@/client/utils/rowResize';
import {contentZoomTarget} from '@/client/utils/contentResizeTarget';

// Contract with home_cards.less
export const PLAYERS_TABLE_ZOOM_VARIABLE = '--players-table-zoom';
// Below this the values in the table become hard to read
export const MIN_PLAYERS_TABLE_ZOOM = 0.7;

export function playersCardTarget(card: HTMLElement, table: HTMLElement): RowResizeTarget {
  return contentZoomTarget(card, {content: table, zoomVariable: PLAYERS_TABLE_ZOOM_VARIABLE, minZoom: MIN_PLAYERS_TABLE_ZOOM, lockHeight: true});
}
