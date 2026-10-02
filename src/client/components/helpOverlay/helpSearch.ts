/*
 * Suche im aktuellen Hilfe-Tab (Fork): blendet nicht passende Einträge aus, danach leere Gruppen.
 * Ausgeblendet wird per Attribut statt per Klasse, damit Vue beim Neuzeichnen nichts überschreibt.
 */

export const HELP_HIDDEN_ATTRIBUTE = 'data-help-hidden';

// Wo im Tab gesucht wird – jeweils aus dem gerenderten Inhalt des Tabs gelesen
export type HelpSearchConfig = {
  // Einzelne Einträge (Symbolzeile, Karte, Listenpunkt …)
  items: (root: HTMLElement) => Array<Element>;
  // Behälter, die ausgeblendet werden, wenn kein Eintrag darin passt
  scopes?: (root: HTMLElement) => Array<Element>;
  // Überschriften, deren Gruppe aus den folgenden Geschwistern bis zur nächsten Überschrift besteht
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

// Gibt die Zahl der passenden Einträge zurück; leere Suche zeigt alles
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
      // Fließtext ohne eigene Einträge (z. B. Einleitungen) gehört mit zur Gruppe
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
