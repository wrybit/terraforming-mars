// Measures whether the content of a card runs out of it. Used by CardDescription.vue (smaller text when a rule note
// makes a card too full) and by Card.vue (the Dune cards show larger icons; a row too wide for the card gets a smaller
// zoom). Measured instead of guessed, because it depends on the card, the language and the theme.

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

/** Zoom of the icon rows on Dune project cards (theme-extra.css --card-row-zoom); house cards keep 1 */
export const CARD_ROW_ZOOM = 1.2;

/**
 * The zoom at which the widest icon row of a Dune card still fits into its content box: `full` for most cards, less
 * for rows with many icons or long words (Jens: icons never reach past the card or into its frame, they get smaller
 * instead). Measured at the `full` zoom.
 */
export function fittingRowZoom(card: Element, full: number = CARD_ROW_ZOOM): number {
  const content = card.querySelector('.card-content');
  if (content === null) {
    return full;
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
    return full;
  }
  const used = Math.max(...parts.map((part) => part.right)) - Math.min(...parts.map((part) => part.left));
  const available = right - left;
  if (used <= available) {
    return full;
  }
  return Math.floor(full * available / used * 100) / 100;
}
