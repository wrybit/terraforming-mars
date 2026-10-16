// Digits 1 … 9 and 0 (the tenth) choose the selectable items (cards, option tiles, players, colonies …) of the active group.
// A group is an element marked with data-hotkey-group (the action box of OrOptions / WaitingForTabs, the columns
// of the initial selection); when several are visible
// (initial selection: corporation, preludes, cards side by side) the one with data-hotkey-group-active="true" wins.
// Items are labels with an enabled radio button or check box, in reading order.
import {PICK_DIGITS} from '@/client/hotkeys/hotkeyActions';

const GROUP_SELECTOR = '[data-hotkey-group]';
const ITEM_SELECTOR = 'label';
// Key cap with the digit, appended to the item by refreshItemNumbers (the items' ::before/::after already draw the
// selection highlight and check mark)
export const ITEM_NUMBER_CLASS = 'hotkey-item-number';
const MAX_ITEMS = PICK_DIGITS.length;

export function isVisible(element: Element): boolean {
  return element instanceof HTMLElement && element.getClientRects().length > 0 &&
    window.getComputedStyle(element).visibility !== 'hidden';
}

function containsCandidate(element: Element, candidates: ReadonlyArray<Element>): boolean {
  return candidates.some((other) => other !== element && element.contains(other));
}

export function activeHotkeyGroup(scope: Document | Element = document): Element | undefined {
  const groups = Array.from(scope.querySelectorAll(GROUP_SELECTOR)).filter(isVisible);
  const marked = groups.find((group) => group.getAttribute('data-hotkey-group-active') === 'true');
  if (marked !== undefined) {
    return marked;
  }
  // Without a marked group: the innermost one (a nested input's own group wins over the box around it)
  return groups.find((group) => !containsCandidate(group, groups)) ?? groups[0];
}

function selectableInput(label: Element): HTMLInputElement | undefined {
  const input = label.querySelector('input[type="radio"], input[type="checkbox"]');
  if (!(input instanceof HTMLInputElement) || input.disabled) {
    return undefined;
  }
  // Inputs of a nested label belong to that label
  return input.closest('label') === label ? input : undefined;
}

export function hotkeyItems(group: Element | undefined): Array<HTMLElement> {
  if (group === undefined) {
    return [];
  }
  return Array.from(group.querySelectorAll<HTMLElement>(ITEM_SELECTOR))
    .filter((label) => selectableInput(label) !== undefined && isVisible(label))
    .slice(0, MAX_ITEMS);
}

/** Gives the items of the active group a key cap with their digit and removes it from all others */
export function refreshItemNumbers(show: boolean): void {
  const items = show ? hotkeyItems(activeHotkeyGroup()) : [];
  for (const cap of Array.from(document.querySelectorAll(`.${ITEM_NUMBER_CLASS}`))) {
    if (!items.includes(cap.parentElement as HTMLElement)) {
      cap.remove();
    }
  }
  items.forEach((item, index) => {
    const number = PICK_DIGITS[index];
    let cap = Array.from(item.children).find((child) => child.classList.contains(ITEM_NUMBER_CLASS));
    if (cap === undefined) {
      cap = document.createElement('kbd');
      cap.className = ITEM_NUMBER_CLASS;
      cap.setAttribute('aria-hidden', 'true');
      item.appendChild(cap);
    }
    // Only touch the DOM on a real change: the MutationObserver would otherwise call this again and again
    if (cap.textContent !== number) {
      cap.textContent = number;
    }
  });
}
