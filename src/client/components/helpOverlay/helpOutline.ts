/*
 * Abschnittsbaum des Hilfe-Overlays (Fork).
 *
 * Die Inhalte der Hilfe-Tabs stammen aus den Upstream-Komponenten unter components/help. Damit
 * Upstream-Änderungen ohne Konflikte übernommen werden können, bleiben diese unverändert; der
 * Seitenbaum wird stattdessen nach dem Rendern aus ihren Überschriften gelesen (helpOverlayTabs.ts).
 */

// Ein Eintrag, wie ihn die Tab-Konfiguration aus dem gerenderten Inhalt liest
export type HelpOutlineEntry = {
  element: HTMLElement;
  label: string;
  children?: ReadonlyArray<HelpOutlineEntry>;
};

// Ein Knoten des Seitenbaums, wie ihn die Navigation anzeigt
export type HelpOutlineNode = {
  id: string;
  label: string;
  children: ReadonlyArray<HelpOutlineNode>;
};

const ANCHOR_PREFIX = 'help-outline-';
let anchorCounter = 0;

// Sichtbarer Text ohne Zeilenumbrüche und doppelte Leerzeichen; Klammern ohne Innenabstand
export function plainText(element: Element | null | undefined): string {
  return (element?.textContent ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();
}

// Gibt jedem Abschnitt eine id als Sprungziel und liefert den Baum für die Navigation
export function toOutlineNodes(entries: ReadonlyArray<HelpOutlineEntry>): Array<HelpOutlineNode> {
  return entries
    .filter((entry) => entry.label !== '')
    .map((entry) => {
      if (!entry.element.id) {
        entry.element.id = ANCHOR_PREFIX + (++anchorCounter);
      }
      return {id: entry.element.id, label: entry.label, children: toOutlineNodes(entry.children ?? [])};
    });
}

// Alle ids des Baums in Dokumentreihenfolge (für die Scroll-Beobachtung)
export function outlineIds(nodes: ReadonlyArray<HelpOutlineNode>): Array<string> {
  return nodes.flatMap((node) => [node.id, ...outlineIds(node.children)]);
}
