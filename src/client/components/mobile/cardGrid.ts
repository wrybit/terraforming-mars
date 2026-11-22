/*
 * Card grid of the mobile task view ("play card", replay): the cards lie in two columns (phone) and scroll
 * vertically (mobile.less, mobileFit.ts); a tap selects a card like on desktop.
 */

const LIST_SELECTOR = '.payments_cont';
const ITEM_SELECTOR = ':scope > label.payments_cards';

/* Cards of the visible list under `root` (lists of other tabs are hidden). */
function visibleItems(root: HTMLElement): Array<HTMLElement> {
  const list = Array.from(root.querySelectorAll<HTMLElement>(LIST_SELECTOR)).find((element) => element.offsetWidth > 0);
  return Array.from(list?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);
}

/*
 * Scrolls the first card matching `matches` into the middle of the screen; with `select` it also gets selected
 * (only playable cards have a selection input). Returns whether a card was found.
 */
export function showCardInGrid(root: HTMLElement, matches: (item: HTMLElement) => boolean, select: boolean): boolean {
  const item = visibleItems(root).find(matches);
  if (item === undefined) {
    return false;
  }
  const input = item.querySelector<HTMLInputElement>('input[type="radio"]');
  if (select && input !== null && !input.checked) {
    input.click();
  }
  item.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'});
  return true;
}
