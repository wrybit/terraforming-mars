// Highlights search hits in the card list via the CSS Custom Highlight API (::highlight(card-list-search) in card_list.less).
// Advantage: the card components stay untouched – it simply marks the fully rendered, translated text.
// Browsers without the API show the hits without highlighting.

const HIGHLIGHT_NAME = 'card-list-search';

type HighlightRegistry = Map<string, unknown>;
type HighlightConstructor = new (...ranges: Array<Range>) => unknown;

function registry(): HighlightRegistry | undefined {
  const css = window.CSS as unknown as {highlights?: HighlightRegistry} | undefined;
  return css?.highlights;
}

function highlightConstructor(): HighlightConstructor | undefined {
  return (window as unknown as {Highlight?: HighlightConstructor}).Highlight;
}

// A leading "^" means "starts with" in the name search and is not part of the search text
export function searchTerm(filterText: string): string {
  return filterText.trim().replace(/^\^/, '').toLocaleLowerCase();
}

function rangesIn(node: Text, term: string): Array<Range> {
  const ranges: Array<Range> = [];
  const text = node.data.toLocaleLowerCase();
  let index = text.indexOf(term);
  while (index !== -1) {
    const range = document.createRange();
    range.setStart(node, index);
    range.setEnd(node, index + term.length);
    ranges.push(range);
    index = text.indexOf(term, index + term.length);
  }
  return ranges;
}

// containers: areas that are searched (for the name search only the titles)
export function highlightSearch(containers: Iterable<Element>, filterText: string): void {
  const highlights = registry();
  const Highlight = highlightConstructor();
  if (highlights === undefined || Highlight === undefined) {
    return;
  }
  highlights.delete(HIGHLIGHT_NAME);
  const term = searchTerm(filterText);
  if (term.length === 0) {
    return;
  }
  const ranges: Array<Range> = [];
  for (const container of containers) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      ranges.push(...rangesIn(node as Text, term));
    }
  }
  highlights.set(HIGHLIGHT_NAME, new Highlight(...ranges));
}

export function clearSearchHighlight(): void {
  registry()?.delete(HIGHLIGHT_NAME);
}
