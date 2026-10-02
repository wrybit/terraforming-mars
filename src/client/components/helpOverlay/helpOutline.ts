/*
 * Section tree of the help overlay (fork).
 *
 * The content of the help tabs comes from the upstream components under components/help. So that
 * upstream changes can be taken over without conflicts, these stay unchanged; instead the
 * page tree is read from their headings after rendering (helpOverlayTabs.ts).
 */

// An entry as the tab configuration reads it from the rendered content
export type HelpOutlineEntry = {
  element: HTMLElement;
  label: string;
  children?: ReadonlyArray<HelpOutlineEntry>;
};

// A node of the page tree as the navigation shows it
export type HelpOutlineNode = {
  id: string;
  label: string;
  children: ReadonlyArray<HelpOutlineNode>;
};

const ANCHOR_PREFIX = 'help-outline-';
let anchorCounter = 0;

// Visible text without line breaks and double spaces; parentheses without inner padding
export function plainText(element: Element | null | undefined): string {
  return (element?.textContent ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();
}

// Gives each section an id as a jump target and returns the tree for the navigation
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

// All ids of the tree in document order (for scroll observation)
export function outlineIds(nodes: ReadonlyArray<HelpOutlineNode>): Array<string> {
  return nodes.flatMap((node) => [node.id, ...outlineIds(node.children)]);
}
