// Measures whether the content of a card runs out of it. Used by CardDescription.vue (smaller text when a rule note
// makes a card too full) and by Card.vue (the Dune cards show larger icons and text; where that does not fit, the
// content scrolls inside the card). Measured instead of guessed, because it depends on the card, the language and the
// theme.

// Room kept free above the bottom edge of the card (the frame and its light edge)
const BOTTOM_MARGIN = 4;

function lowestContent(card: Element): number {
  // The lowest content counts, not only one text: a note in an effect box pushes the rows below it down
  const contents = Array.from(card.querySelectorAll('.card-content .card-description, .card-content .card-row'));
  return Math.max(...contents.map((content) => content.getBoundingClientRect().bottom));
}

/** True when the description or a row of the card ends below its bottom edge. Hidden cards measure 0: never. */
export function contentOverflowsCard(card: Element): boolean {
  const box = card.getBoundingClientRect();
  // Height, not position: a card scrolled above the window has a negative bottom but is measured all the same
  return box.height > 0 && lowestContent(card) > box.bottom - BOTTOM_MARGIN;
}

// The scene strip fades in from its top edge (mask in theme-extra.css): text may reach into this share of it, where
// the picture is still almost invisible, before it sits on the picture
const SCENE_FADE_SHARE = 0.35;

/**
 * True when the description or a row of a Dune card reaches into the scene strip along its bottom edge (Jens: the
 * text must stay readable above the picture), or out of the card where the strip is hidden.
 */
export function contentRunsIntoFooter(card: Element): boolean {
  const box = card.getBoundingClientRect();
  if (box.height === 0) {
    return false;
  }
  const scene = card.querySelector('.card-scene')?.getBoundingClientRect();
  const limit = scene !== undefined && scene.height > 0 ? scene.top + scene.height * SCENE_FADE_SHARE : box.bottom - BOTTOM_MARGIN;
  return lowestContent(card) > limit;
}

/** True when the description or a row of the card reaches under its victory point tab (CardVictoryPoints.vue). */
export function contentUnderVictoryPoints(card: Element): boolean {
  const points = card.querySelector('.card-points');
  if (points === null) {
    return false;
  }
  const tab = points.getBoundingClientRect();
  if (tab.width === 0) {
    return false;
  }
  const overlaps = (box: DOMRect) => box.height > 0 && box.bottom > tab.top + 2 && box.right > tab.left + 2 && box.left < tab.right - 2;
  // A centred description spans the whole width, but its lines are shorter: the lines count, not the box
  const descriptionLines = Array.from(card.querySelectorAll('.card-content .card-description')).flatMap((description) => {
    const range = document.createRange();
    range.selectNodeContents(description);
    return Array.from(range.getClientRects());
  });
  const rows = Array.from(card.querySelectorAll('.card-content .card-row')).map((row) => row.getBoundingClientRect());
  return [...descriptionLines, ...rows].some(overlaps);
}

/** Zoom of the icon rows on Dune cards (theme-extra.css --card-row-zoom) */
export const CARD_ROW_ZOOM = 1.2;

/**
 * The zoom at which the widest icon row of a Dune card still fits between its side frames: the full CARD_ROW_ZOOM
 * for most cards, less for rows with many icons or long words. Measured at the full zoom.
 */
export function fittingRowZoom(card: Element): number {
  const content = card.querySelector('.card-content');
  if (content === null) {
    return CARD_ROW_ZOOM;
  }
  const box = content.getBoundingClientRect();
  const style = getComputedStyle(content);
  const scale = box.width / ((content as HTMLElement).offsetWidth || box.width);
  const left = box.left + parseFloat(style.paddingLeft) * scale;
  const right = box.right - parseFloat(style.paddingRight) * scale;
  // Icons, numbers and words of the rows; texts wrap on their own and do not count
  const parts = Array.from(content.querySelectorAll('.card-rows *'))
    .filter((part) => part.closest('.card-description') === null)
    .map((part) => part.getBoundingClientRect())
    .filter((part) => part.width > 0);
  if (parts.length === 0) {
    return CARD_ROW_ZOOM;
  }
  const used = Math.max(...parts.map((part) => part.right)) - Math.min(...parts.map((part) => part.left));
  const available = right - left;
  if (used <= available) {
    return CARD_ROW_ZOOM;
  }
  // Never below the size of the Mars cards: rows that did not fit even there keep that size
  return Math.max(1, Math.floor(CARD_ROW_ZOOM * available / used * 100) / 100);
}

/** Room kept free under the content of a Dune card that scrolls, in card pixels */
export type CardScrollSpace = {
  /** Height of the scrolling content: from its top down to the frame */
  contentHeight: number,
  /** Empty space after the last line, so it can be scrolled above the scene strip or the victory point tab */
  bottomSpace: number,
};

// Gap kept between the last line and the scene strip or tab once scrolled to the end
const SCROLL_GAP = 6;

/**
 * The scroll area of a Dune card whose content does not fit above its scene strip (Jens: full size everywhere, the
 * full cards scroll instead of shrinking), or undefined when it fits. In card pixels, so a zoomed card measures right.
 */
export function cardScrollSpace(card: HTMLElement): CardScrollSpace | undefined {
  if (!contentRunsIntoFooter(card) && !contentUnderVictoryPoints(card)) {
    return undefined;
  }
  const box = card.getBoundingClientRect();
  const content = card.querySelector('.card-content');
  if (content === null || card.offsetHeight === 0) {
    return undefined;
  }
  // Screen pixels per card pixel (setup columns, the log and small cards zoom or scale the card)
  const scale = box.height / card.offsetHeight;
  const frame = card.clientTop;
  const contentHeight = (box.bottom - content.getBoundingClientRect().top) / scale - frame;
  const scene = card.querySelector('.card-scene')?.getBoundingClientRect();
  const points = card.querySelector('.card-points')?.getBoundingClientRect();
  const footerTop = Math.min(
    scene !== undefined && scene.height > 0 ? scene.top : box.bottom,
    points !== undefined && points.height > 0 ? points.top : box.bottom);
  const bottomSpace = (box.bottom - footerTop) / scale - frame + SCROLL_GAP;
  return {contentHeight: Math.round(contentHeight), bottomSpace: Math.round(bottomSpace)};
}
