// The scroll area of a Dune card: where its content lies and where its scrollbar runs, per kind of card. The values
// were set by Jens in the card editor (_outputs/dune-card-box/karten-scrollbereich.html, 21 Oct 2026), in card pixels
// measured from the outer edge of the card. The content scrolls between its top and bottom line; the scrollbar runs
// along the scroll box, which keeps clear of the victory point tab.

/** Kinds of cards with their own scroll area */
export type CardScrollKind = 'project' | 'projectWithTab' | 'house' | 'standardProject';

/** Distances from the outer edge of the card, in card pixels */
export type CardScrollArea = {
  /** Top and bottom line of the scrolling content */
  contentTop: number,
  contentBottom: number,
  /** Scroll box: the scrollbar runs along its right side from its top to its bottom */
  boxTop: number,
  boxBottom: number,
  /** Left and right side of the scroll box, also the sides of the content */
  sides: number,
};

const SIDES = 4;
const BOTTOM = 16;
// The victory point tab and the resource counter sit on the bottom edge: the scrollbar ends above them
const ABOVE_TAB = 44;

export const CARD_SCROLL_AREAS: Readonly<Record<CardScrollKind, CardScrollArea>> = {
  project: {contentTop: 78, contentBottom: BOTTOM, boxTop: 78, boxBottom: BOTTOM, sides: SIDES},
  projectWithTab: {contentTop: 78, contentBottom: BOTTOM, boxTop: 78, boxBottom: ABOVE_TAB, sides: SIDES},
  house: {contentTop: 53, contentBottom: BOTTOM, boxTop: 53, boxBottom: BOTTOM, sides: SIDES},
  standardProject: {contentTop: 38, contentBottom: BOTTOM, boxTop: 38, boxBottom: BOTTOM, sides: SIDES},
};

/** Width of the scrollbar and its gap to the right side of the scroll box, in card pixels */
export const CARD_SCROLLBAR_WIDTH = 6;
export const CARD_SCROLLBAR_GAP = 3;
/** Length of the fade at an edge with hidden content */
export const CARD_FADE_LENGTH = 20;
/** The thumb never gets shorter than this, so it can still be grabbed */
const MIN_THUMB = 18;

export function cardScrollKind(card: {isHouse: boolean, isStandardProject: boolean, hasBottomTab: boolean}): CardScrollKind {
  if (card.isHouse) {
    return 'house';
  }
  if (card.isStandardProject) {
    return 'standardProject';
  }
  return card.hasBottomTab ? 'projectWithTab' : 'project';
}

/** Size of the card and where the content's positioning parent and the card's padding box start, in card pixels */
export type CardFrame = {
  width: number,
  height: number,
  /** Offset of the content's positioning parent from the outer edge of the card */
  parentTop: number,
  parentLeft: number,
  /** Width of the card's frame: positioned children of the card start inside it */
  frameTop: number,
  frameLeft: number,
};

/** CSS custom properties of the card (theme-extra.css): content box and scrollbar, in px */
export function cardScrollStyle(area: CardScrollArea, frame: CardFrame): Record<string, string> {
  const px = (value: number) => Math.round(value) + 'px';
  return {
    '--card-content-top': px(area.contentTop - frame.parentTop),
    '--card-content-left': px(area.sides - frame.parentLeft),
    '--card-content-width': px(frame.width - 2 * area.sides),
    '--card-content-height': px(Math.max(0, frame.height - area.contentTop - area.contentBottom)),
    '--card-scrollbar-top': px(area.boxTop - frame.frameTop),
    '--card-scrollbar-left': px(frame.width - area.sides - CARD_SCROLLBAR_GAP - CARD_SCROLLBAR_WIDTH - frame.frameLeft),
    '--card-scrollbar-height': px(Math.max(0, frame.height - area.boxTop - area.boxBottom)),
  };
}

/** What the scrollbar and the fades show for a scroll position */
export type CardScrollState = {
  scrolls: boolean,
  /** Fades at the top and bottom edge, only where content is hidden behind them */
  fadeTop: number,
  fadeBottom: number,
  thumbTop: number,
  thumbHeight: number,
};

export function cardScrollState(scroll: {top: number, height: number, visible: number}, trackHeight: number): CardScrollState {
  const range = scroll.height - scroll.visible;
  // One pixel of rounding is no reason to scroll
  if (range <= 1) {
    return {scrolls: false, fadeTop: 0, fadeBottom: 0, thumbTop: 0, thumbHeight: 0};
  }
  const thumbHeight = Math.min(trackHeight, Math.max(MIN_THUMB, trackHeight * scroll.visible / scroll.height));
  const share = Math.min(1, Math.max(0, scroll.top / range));
  return {
    scrolls: true,
    fadeTop: scroll.top > 0 ? CARD_FADE_LENGTH : 0,
    fadeBottom: scroll.top < range - 1 ? CARD_FADE_LENGTH : 0,
    thumbTop: (trackHeight - thumbHeight) * share,
    thumbHeight,
  };
}

/** Scroll position for a thumb dragged by `distance` track pixels from where it was grabbed at `startTop` */
export function scrollTopForThumb(startTop: number, distance: number, scroll: {height: number, visible: number}, trackHeight: number, thumbHeight: number): number {
  const range = scroll.height - scroll.visible;
  const travel = Math.max(1, trackHeight - thumbHeight);
  return Math.min(range, Math.max(0, startTop + distance * range / travel));
}
