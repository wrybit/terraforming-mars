// Height of the players card (left column) via the drag handle below it (RowResizeHandle.vue).
// One size value in --players-table-zoom (set on the card, read by home_cards.less):
// - below 1 the whole table zooms down to fit the chosen height, so all players stay visible without scrolling;
// - above 1 the card gets up to 20 % taller than its natural height: the rows stretch to the chosen height (1fr rows,
//   players_table.less) and numbers, boxes and names grow along (boost) while the widths stay.
// Without a value of the player's own the card takes the largest size (Jens, 21 Oct 2026: default = maximum height).
import {HeightLimits, RowResizeTarget, clampHeight} from '@/client/utils/rowResize';

// Contract with home_cards.less
export const PLAYERS_TABLE_ZOOM_VARIABLE = '--players-table-zoom';
// Below this the values in the table become hard to read
export const MIN_PLAYERS_TABLE_ZOOM = 0.7;
// Largest size (~20 % above the natural height); same value as @players-table-max-boost in home_cards.less
export const MAX_PLAYERS_TABLE_BOOST = 1.2;

type Sizes = {
  // Card height at size 1 and the part of the card that does not scale
  natural: number;
  chrome: number;
};

// Measures the card at size 1 (no fixed height), then restores what was set
function measure(card: HTMLElement, table: HTMLElement): Sizes {
  const saved = {height: card.style.height, minHeight: card.style.minHeight, size: card.style.getPropertyValue(PLAYERS_TABLE_ZOOM_VARIABLE)};
  card.style.height = '';
  card.style.minHeight = '';
  card.style.setProperty(PLAYERS_TABLE_ZOOM_VARIABLE, '1');
  const natural = card.getBoundingClientRect().height;
  const chrome = natural - table.getBoundingClientRect().height;
  card.style.height = saved.height;
  card.style.minHeight = saved.minHeight;
  if (saved.size === '') {
    card.style.removeProperty(PLAYERS_TABLE_ZOOM_VARIABLE);
  } else {
    card.style.setProperty(PLAYERS_TABLE_ZOOM_VARIABLE, saved.size);
  }
  return {natural, chrome};
}

function limits(sizes: Sizes): HeightLimits {
  const content = sizes.natural - sizes.chrome;
  return {min: sizes.chrome + content * MIN_PLAYERS_TABLE_ZOOM, max: sizes.chrome + content * MAX_PLAYERS_TABLE_BOOST};
}

export function playersCardTarget(card: HTMLElement, table: HTMLElement): RowResizeTarget {
  return {
    current: () => card.getBoundingClientRect().height,
    limits: () => limits(measure(card, table)),
    defaultHeight: () => limits(measure(card, table)).max,
    apply(height) {
      if (height === undefined) {
        card.style.height = '';
        card.style.minHeight = '';
        card.style.removeProperty(PLAYERS_TABLE_ZOOM_VARIABLE);
        return;
      }
      const sizes = measure(card, table);
      const range = limits(sizes);
      const clamped = clampHeight(height, range);
      const content = sizes.natural - sizes.chrome;
      if (clamped <= sizes.natural) {
        // Zoom down: fixed height, otherwise flex in the fixed layout would stretch the card again
        card.style.height = `${clamped}px`;
        card.style.minHeight = '';
        card.style.setProperty(PLAYERS_TABLE_ZOOM_VARIABLE, String(content > 0 ? (clamped - sizes.chrome) / content : 1));
        return;
      }
      // Taller: minimum height only, so the card still grows when its content does (e.g. a name wraps later)
      const share = range.max > sizes.natural ? Math.min(1, (clamped - sizes.natural) / (range.max - sizes.natural)) : 1;
      card.style.height = '';
      card.style.minHeight = `${clamped}px`;
      card.style.setProperty(PLAYERS_TABLE_ZOOM_VARIABLE, String(1 + share * (MAX_PLAYERS_TABLE_BOOST - 1)));
    },
  };
}

// Calls onChange when the width of the card changes (the natural height follows the width); height changes – which
// the handle itself causes – are ignored, so applying a height never triggers another one
export function observePlayersCardWidth(card: HTMLElement, onChange: () => void): () => void {
  if (typeof ResizeObserver === 'undefined') {
    return () => {};
  }
  // Two frames later the table has laid itself out for the new width (PlayersTable.vue), so its natural height is right
  let frame = 0;
  const later = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(onChange);
    });
  };
  let width = card.getBoundingClientRect().width;
  const observer = new ResizeObserver(() => {
    const next = card.getBoundingClientRect().width;
    if (Math.abs(next - width) >= 1) {
      width = next;
      later();
    }
  });
  observer.observe(card);
  later();
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
  };
}
