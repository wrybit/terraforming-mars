// Height of the players card (left column) via the drag handle below it (RowResizeHandle.vue).
// One size value in --players-table-zoom (set on the card, read by home_cards.less):
// - below 1 the whole table zooms down to fit the chosen height, so all players stay visible without scrolling;
// - above 1 the numbers and their boxes grow (boost) while the widths stay – the boxes have room for bigger digits.
// Without a value of the player's own the table uses the largest size (Jens, 21 Oct 2026: default = maximum height).
import {HeightLimits, RowResizeTarget, clampHeight} from '@/client/utils/rowResize';

// Contract with home_cards.less
export const PLAYERS_TABLE_ZOOM_VARIABLE = '--players-table-zoom';
// Below this the values in the table become hard to read
export const MIN_PLAYERS_TABLE_ZOOM = 0.7;
// Largest boost of numbers and boxes (~20 %); same value as @players-table-max-boost in home_cards.less
export const MAX_PLAYERS_TABLE_BOOST = 1.2;

type Sizes = {
  // Card height at size 1, at the largest size, and the part of the card that does not scale
  natural: number;
  largest: number;
  chrome: number;
};

// Measures the card at size 1 and at the largest size, then restores what was set
function measure(card: HTMLElement, table: HTMLElement): Sizes {
  const savedHeight = card.style.height;
  const savedSize = card.style.getPropertyValue(PLAYERS_TABLE_ZOOM_VARIABLE);
  card.style.height = '';
  card.style.setProperty(PLAYERS_TABLE_ZOOM_VARIABLE, '1');
  const natural = card.getBoundingClientRect().height;
  const chrome = natural - table.getBoundingClientRect().height;
  card.style.setProperty(PLAYERS_TABLE_ZOOM_VARIABLE, String(MAX_PLAYERS_TABLE_BOOST));
  const largest = Math.max(natural, card.getBoundingClientRect().height);
  card.style.height = savedHeight;
  if (savedSize === '') {
    card.style.removeProperty(PLAYERS_TABLE_ZOOM_VARIABLE);
  } else {
    card.style.setProperty(PLAYERS_TABLE_ZOOM_VARIABLE, savedSize);
  }
  return {natural, largest, chrome};
}

function limits(sizes: Sizes): HeightLimits {
  return {min: sizes.chrome + (sizes.natural - sizes.chrome) * MIN_PLAYERS_TABLE_ZOOM, max: sizes.largest};
}

export function playersCardTarget(card: HTMLElement, table: HTMLElement): RowResizeTarget {
  return {
    current: () => card.getBoundingClientRect().height,
    limits: () => limits(measure(card, table)),
    apply(height) {
      if (height === undefined) {
        card.style.height = '';
        card.style.removeProperty(PLAYERS_TABLE_ZOOM_VARIABLE);
        return;
      }
      const sizes = measure(card, table);
      const clamped = clampHeight(height, limits(sizes));
      if (clamped <= sizes.natural) {
        // Zoom down: fixed height, otherwise flex in the fixed layout would stretch the card again
        const content = sizes.natural - sizes.chrome;
        card.style.height = `${clamped}px`;
        card.style.setProperty(PLAYERS_TABLE_ZOOM_VARIABLE, String(content > 0 ? (clamped - sizes.chrome) / content : 1));
        return;
      }
      // Boost: the card follows its content, which grows from the natural to the largest height
      const share = sizes.largest > sizes.natural ? Math.min(1, (clamped - sizes.natural) / (sizes.largest - sizes.natural)) : 1;
      card.style.height = '';
      card.style.setProperty(PLAYERS_TABLE_ZOOM_VARIABLE, String(1 + share * (MAX_PLAYERS_TABLE_BOOST - 1)));
    },
  };
}
