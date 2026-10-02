/*
 * Search in the current help tab (fork): hides non-matching entries, then empty groups.
 * Hiding is done via an attribute instead of a class so Vue overwrites nothing when re-rendering.
 */

export const HELP_HIDDEN_ATTRIBUTE = 'data-help-hidden';

// Where in the tab to search – each read from the tab's rendered content
export type HelpSearchConfig = {
  // Individual entries (icon row, card, list item …)
  items: (root: HTMLElement) => Array<Element>;
  // Containers that are hidden when no entry inside matches
  scopes?: (root: HTMLElement) => Array<Element>;
  // Headings whose group consists of the following siblings up to the next heading
  headings?: (root: HTMLElement) => Array<Element>;
};

function setHidden(element: Element, hidden: boolean): void {
  if (hidden) {
    element.setAttribute(HELP_HIDDEN_ATTRIBUTE, '');
  } else {
    element.removeAttribute(HELP_HIDDEN_ATTRIBUTE);
  }
}

function isVisible(element: Element): boolean {
  return !element.hasAttribute(HELP_HIDDEN_ATTRIBUTE);
}

// Returns the number of matching entries; an empty search shows everything
export function applyHelpSearch(root: HTMLElement, config: HelpSearchConfig, query: string): number {
  const needle = query.trim().toLocaleLowerCase();
  const items = config.items(root);
  let matches = 0;
  for (const item of items) {
    const hit = needle === '' || (item.textContent ?? '').toLocaleLowerCase().includes(needle);
    setHidden(item, !hit);
    if (hit) {
      matches++;
    }
  }

  if (config.headings !== undefined) {
    const headings = config.headings(root);
    for (const heading of headings) {
      const group: Array<Element> = [];
      for (let sibling = heading.nextElementSibling; sibling !== null && !headings.includes(sibling); sibling = sibling.nextElementSibling) {
        group.push(sibling);
      }
      const contains = (element: Element) => items.some((item) => element === item || element.contains(item));
      const empty = needle !== '' && !items.some((item) => isVisible(item) && group.some((element) => element === item || element.contains(item)));
      setHidden(heading, empty);
      // Body text without own entries (e.g. introductions) belongs to the group
      group.filter((element) => !contains(element)).forEach((element) => setHidden(element, empty));
    }
  }

  if (config.scopes !== undefined) {
    for (const scope of config.scopes(root)) {
      const empty = needle !== '' && !items.some((item) => isVisible(item) && scope.contains(item));
      setHidden(scope, empty);
    }
  }
  return matches;
}
