/*
 * Scales fixed game building blocks (cards, Mars board) to the width of the mobile view.
 *
 * No CSS `zoom` (Safari computes it differently in grids, cards overlap), but `transform: scale()`
 * on the element; negative margins shrink the layout box to the visible size. Only styles
 * are set, no nodes are moved – otherwise Vue would get confused when updating.
 */

import {MARS_CROP} from '@/client/components/mobile/mobileBoardZoom';
import {choiceBlockColumns, choiceBlockColumnsPortrait, choiceBlockFillsWidth} from '@/client/components/choiceBlock';

/* Visible area of an element in its own px (before scaling). */
export type FitCrop = {left: number, top: number, width: number, height: number};

/* Rule: which elements get scaled and how. */
type FitRule = {
  selector: string;
  // Do not touch inside these areas
  exclude?: string;
  // Number of elements side by side (depending on list width, for choice grids also on count) or full width with a crop
  columns?: (listWidth: number, element: HTMLElement) => number;
  crop?: FitCrop;
  // Choice grid: gaps in px instead of GAP_PX; the list overhangs on the right by the column gap (mobile.less),
  // so the columns fill the full width and space only remains between the tiles
  choiceGap?: {column: number, row: number};
  // Choice grid: this list gets the column count as --mb-grid-columns (mobile.less arranges by it)
  grid?: string;
  // Rule applies only while this is true (otherwise a later rule takes over)
  when?: () => boolean;
};

// Spacing between elements of a list (right and bottom, as part of the margin)
const GAP_PX = 6;
// Gaps between choice tiles (standard projects), cf. @mb-choice-gap/@mb-choice-row-gap in mobile.less;
// the checkmark flag sits between the rows
const CHOICE_GAP = {column: 14, row: 36};
// Reference width: the nearest box or screen the element is in (lists themselves are often only as wide as their content)
// Played cards (mobile_played_cards.less) extend wider than the screen padding
const CONTAINER_SELECTOR = '.setup-column-body, .or-tab-panel, .other_player_cont, .mb-screen, .game-end-box';
const FITTED_CLASS = 'mb-fit';
// Mars without the scale ring (mobile.less: planet image, colony spaces in the corners)
const CROPPED_CLASS = 'mb-mars-cropped';

/* Column count for a card list of width `width` px: phone 2, tablet portrait 3, tablet landscape 4. */
export function cardColumns(width: number): number {
  if (width >= 900) {
    return 4;
  }
  return width >= 560 ? 3 : 2;
}

/*
 * Columns of a choice grid with `count` cards: landscape as square as possible, portrait more rows than columns
 * (choiceBlock.ts) – at most as many as cards fit side by side.
 */
export function choiceGridColumns(width: number, count: number, portrait: boolean): number {
  const columns = portrait ? choiceBlockColumnsPortrait(count) : choiceBlockColumns(count);
  return Math.min(cardColumns(width), columns);
}

// Choice grid: standard projects and card selection (draft, buy cards, select card); one label per card in the block
const STANDARD_PROJECT_LIST = '.payments_cont';
const CARD_CHOICE_LIST = '.wf-component--select-card.choice-block';

/* Number of choices (one label each) in the list around `element`. */
function choiceCount(element: HTMLElement, listSelector: string): number {
  return element.closest(listSelector)?.querySelectorAll(':scope > label').length ?? 1;
}

function choiceGridColumnsFor(listSelector: string) {
  return (listWidth: number, element: HTMLElement): number => {
    const count = choiceCount(element, listSelector);
    return choiceGridColumns(listWidth, count, isPortrait());
  };
}

/*
 * Card selection (draft, buy, sell …): few cards as the square block (choiceGridColumns), many cards
 * (choiceBlockFillsWidth) as many per row as fit – like the hand cards.
 */
export function cardGridColumns(width: number, count: number, portrait: boolean): number {
  return choiceBlockFillsWidth(count) ? cardColumns(width) : choiceGridColumns(width, count, portrait);
}

function cardGridColumnsFor(listSelector: string) {
  return (listWidth: number, element: HTMLElement): number => cardGridColumns(listWidth, choiceCount(element, listSelector), isPortrait());
}

function isPortrait(): boolean {
  return window.innerHeight > window.innerWidth;
}

/* Scale at which `columns` elements of width `itemWidth` plus gap `gap` fit into `listWidth` (at most 1). */
export function fitScale(listWidth: number, itemWidth: number, columns: number, gap: number = GAP_PX): number {
  if (itemWidth <= 0) {
    return 1;
  }
  const available = listWidth / columns - gap;
  return Math.max(0.3, Math.min(1, available / itemWidth));
}

// Mars without the scale ring: planet including colony spaces in the top corners (mobile.less)
// Portrait: at most this share of the window height for the board, so the bars below stay visible
const BOARD_HEIGHT_SHARE = 0.62;
// Tablet landscape (mobile.less, @mb-landscape: Mars left, rest right; player tables horizontal): from this width in landscape
export const LANDSCAPE_MIN_WIDTH = 900;
const BARS_HEIGHT = 180;

/* Maximum board height in px for the current window. */
export function boardMaxHeight(width: number, height: number): number {
  const landscape = width >= LANDSCAPE_MIN_WIDTH && width > height;
  return landscape ? height - BARS_HEIGHT : height * BOARD_HEIGHT_SHARE;
}

const RULES: ReadonlyArray<FitRule> = [
  {selector: '.mb-screen--mars .board-tabs-mars > .board-cont.board-without-venus, #game-end .board-cont.board-without-venus', crop: MARS_CROP},
  {selector: '.mb-screen--mars .board-tabs-mars > .board-cont, #game-end .board-cont'},
  // Rotated results table across the full width
  {selector: '#game-end .game_end_table.mb-transposed', columns: () => 1},
  // Milestones & awards as a table across the full width
  {selector: '.mb-screen .ma-table', columns: () => 1},
  // Standard projects: all at a glance, no carousel (cf. cardCarousel.ts); landscape as square as possible (5 → 3×2),
  // portrait more rows (5 → 2×3), and
  // centered as on desktop (choiceBlock.ts). Gaps like the milestone/award tiles (mobile.less)
  {
    selector: '.mb-screen--turn .payments_cont .card-container.card-standard-project',
    columns: choiceGridColumnsFor(STANDARD_PROJECT_LIST),
    choiceGap: CHOICE_GAP,
    grid: STANDARD_PROJECT_LIST,
  },
  // Card selection on the turn screen as a grid only in portrait (mobile.less); in landscape the general card rule below applies.
  // Initial selection has its own columns
  {
    selector: `.mb-screen--turn ${CARD_CHOICE_LIST} > label > .card-container`,
    exclude: '.setup-column-body',
    when: isPortrait,
    columns: cardGridColumnsFor(CARD_CHOICE_LIST),
    choiceGap: CHOICE_GAP,
    grid: CARD_CHOICE_LIST,
  },
  // Card selection with header (select all, sorting) also as a grid in landscape, so the bar lines up with the cards
  {
    selector: `.mb-screen--turn ${CARD_CHOICE_LIST}:has(> .select-card-toolbar) > label > .card-container`,
    exclude: '.setup-column-body',
    columns: cardGridColumnsFor(CARD_CHOICE_LIST),
    choiceGap: CHOICE_GAP,
    grid: CARD_CHOICE_LIST,
  },
  // Card carousel (play card): one large card in the middle
  {selector: '.mb-screen--turn .payments_cont .card-container', columns: () => 1},
  {
    selector: '.card-container',
    // Log preview, cards in explainer tiles and nested cards keep their size
    exclude: '.log-container, .mb-fit-off, .card-intro-block, .tab-intro-block, .mb-fit > .card-container .card-container',
    columns: cardColumns,
  },
];

function innerWidth(element: HTMLElement): number {
  const style = getComputedStyle(element);
  return element.clientWidth - parseFloat(style.paddingLeft || '0') - parseFloat(style.paddingRight || '0');
}

type StyleProperty = 'transform' | 'marginRight' | 'marginBottom' | 'clipPath' | 'transformOrigin';

function setStyles(element: HTMLElement, styles: Partial<Record<StyleProperty, string>>): void {
  for (const [property, value] of Object.entries(styles) as Array<[StyleProperty, string]>) {
    // Only write on change, otherwise every measurement wakes the MutationObserver again
    if (element.style[property] !== value) {
      element.style[property] = value;
    }
  }
}

function fit(element: HTMLElement, rule: FitRule): void {
  const list = element.closest<HTMLElement>(CONTAINER_SELECTOR);
  // offsetWidth/-Height ignore transform: these are the natural dimensions
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  if (list === null || width === 0) {
    return; // invisible (other screen): measure the next time it becomes visible
  }
  const listWidth = innerWidth(list);
  const crop = rule.crop ?? {left: 0, top: 0, width, height};
  const gap = rule.columns === undefined ? 0 : rule.choiceGap?.column ?? GAP_PX;
  const rowGap = rule.columns === undefined ? 0 : rule.choiceGap?.row ?? GAP_PX;
  const fitWidth = listWidth + (rule.choiceGap?.column ?? 0);
  const columns = rule.columns?.(listWidth, element);
  const scale = columns === undefined ? Math.min(listWidth / crop.width, boardMaxHeight(window.innerWidth, window.innerHeight) / crop.height) : fitScale(fitWidth, width, columns, gap);
  if (rule.grid !== undefined && columns !== undefined) {
    const grid = element.closest<HTMLElement>(rule.grid);
    // Only write on change (MutationObserver on style)
    if (grid !== null && grid.style.getPropertyValue('--mb-grid-columns') !== String(columns)) {
      grid.style.setProperty('--mb-grid-columns', String(columns));
    }
  }
  element.classList.add(FITTED_CLASS);
  element.classList.toggle(CROPPED_CLASS, rule.crop !== undefined);
  setStyles(element, {
    transformOrigin: '0 0',
    transform: `translate(${-crop.left * scale}px, ${-crop.top * scale}px) scale(${scale.toFixed(4)})`,
    // Shrink the layout box to the visible area; in lists plus the gap to the neighbor
    // (rounded down, otherwise the last column no longer fits into the row due to rounding)
    marginRight: Math.floor(crop.width * scale + gap) - width + 'px',
    marginBottom: Math.floor(crop.height * scale + rowGap) - height + 'px',
    clipPath: rule.crop === undefined ? '' :
      `inset(${crop.top}px ${width - crop.left - crop.width}px ${height - crop.top - crop.height}px ${crop.left}px)`,
  });
}

function fitAll(root: HTMLElement): void {
  const done = new Set<Element>();
  for (const rule of RULES) {
    if (rule.when !== undefined && !rule.when()) {
      continue;
    }
    root.querySelectorAll<HTMLElement>(rule.selector).forEach((element) => {
      if (done.has(element) || (rule.exclude !== undefined && element.matches(`:is(${rule.exclude}) *, :is(${rule.exclude})`))) {
        return;
      }
      done.add(element);
      fit(element, rule);
    });
  }
}

/* Keeps cards and board under `root` scaled to fit until the returned function is called. */
export function observeMobileFit(root: HTMLElement): () => void {
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => fitAll(root));
  };
  const mutations = new MutationObserver(schedule);
  // style/class: screen switches via v-show only make elements visible
  mutations.observe(root, {childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class']});
  // Without ResizeObserver (test environment) the window event is enough
  const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule);
  resize?.observe(root);
  window.addEventListener('resize', schedule);
  schedule();
  return () => {
    cancelAnimationFrame(frame);
    mutations.disconnect();
    resize?.disconnect();
    window.removeEventListener('resize', schedule);
  };
}
