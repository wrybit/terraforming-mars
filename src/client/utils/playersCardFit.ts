// Height of the players card (left column) via the drag handle below it (RowResizeHandle.vue):
// the player table scales down to fit the chosen height (zoom) instead of scrolling, so all players stay visible.
// Never taller than the table at full size – there would only be empty space.
import {RowResizeTarget, clampHeight} from '@/client/utils/rowResize';

// Contract with home_cards.less
export const PLAYERS_TABLE_ZOOM_VARIABLE = '--players-table-zoom';
// Below this the values in the table become hard to read
export const MIN_PLAYERS_TABLE_ZOOM = 0.7;

type NaturalSize = {height: number; chrome: number};

// Card height at full table size and the part that does not scale (padding, border)
function naturalSize(card: HTMLElement): NaturalSize {
  const savedHeight = card.style.height;
  const savedZoom = card.style.getPropertyValue(PLAYERS_TABLE_ZOOM_VARIABLE);
  card.style.height = '';
  card.style.setProperty(PLAYERS_TABLE_ZOOM_VARIABLE, '1');
  const height = card.getBoundingClientRect().height;
  const tableHeight = card.querySelector('.players-table')?.getBoundingClientRect().height ?? 0;
  card.style.height = savedHeight;
  card.style.setProperty(PLAYERS_TABLE_ZOOM_VARIABLE, savedZoom);
  return {height, chrome: height - tableHeight};
}

function limitsOf(size: NaturalSize) {
  return {min: size.chrome + (size.height - size.chrome) * MIN_PLAYERS_TABLE_ZOOM, max: size.height};
}

export function playersCardTarget(card: HTMLElement): RowResizeTarget {
  return {
    current: () => card.getBoundingClientRect().height,
    limits: () => limitsOf(naturalSize(card)),
    apply(height) {
      if (height === undefined) {
        card.style.height = '';
        card.style.removeProperty(PLAYERS_TABLE_ZOOM_VARIABLE);
        return;
      }
      const size = naturalSize(card);
      const clamped = clampHeight(height, limitsOf(size));
      const tableHeight = size.height - size.chrome;
      card.style.height = `${clamped}px`;
      card.style.setProperty(PLAYERS_TABLE_ZOOM_VARIABLE, String(tableHeight > 0 ? (clamped - size.chrome) / tableHeight : 1));
    },
  };
}
