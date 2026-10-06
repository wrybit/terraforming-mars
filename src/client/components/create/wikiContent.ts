import MarkdownIt from 'markdown-it';
import {WIKI} from '@/client/utils/WikiLinks';

// Wiki pages of the original project as content of the "Create game" info boxes. GitHub forbids showing its pages in an
// iframe (X-Frame-Options: deny), so the page is fetched as markdown (raw.githubusercontent.com allows that from any
// origin) and rendered here: a short excerpt in the info box, the whole page in the overlay.

const RAW_WIKI = 'https://raw.githubusercontent.com/wiki/terraforming-mars/terraforming-mars';
const EXCERPT_MAX_LENGTH = 320;

export type WikiTarget = {page: string, anchor: string | undefined};

/** Page and anchor of a wiki link; undefined for links outside the wiki (they keep opening in a new tab). */
export function parseWikiUrl(url: string): WikiTarget | undefined {
  if (!url.startsWith(WIKI + '/')) {
    return undefined;
  }
  const [page, anchor] = url.slice(WIKI.length + 1).split('#');
  return page === '' ? undefined : {page, anchor: anchor || undefined};
}

/** Anchor of a heading as GitHub builds it. */
export function headingSlug(text: string): string {
  return text.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
}

// Every page only once per visit
const pages = new Map<string, Promise<string>>();

export function fetchWikiPage(page: string): Promise<string> {
  let request = pages.get(page);
  if (request === undefined) {
    request = fetch(`${RAW_WIKI}/${encodeURIComponent(page)}.md`).then((response) => {
      if (!response.ok) {
        throw new Error(`wiki page ${page}: ${response.status}`);
      }
      return response.text();
    });
    // A failed request may be tried again next time
    request.catch(() => pages.delete(page));
    pages.set(page, request);
  }
  return request;
}

// Level of a markdown heading line (number of #), 0 for other lines
function headingLevel(line: string): number {
  return /^(#{1,6})\s/.exec(line)?.[1].length ?? 0;
}

type Section = {title: string | undefined, lines: Array<string>};

/** Lines of the section an anchor points to (up to the next heading of the same or a higher level); without anchor the page. */
export function wikiSection(markdown: string, anchor: string | undefined): Section {
  const lines = markdown.split(/\r?\n/);
  if (anchor !== undefined) {
    const wanted = anchor.toLowerCase();
    const start = lines.findIndex((line) => {
      const heading = /^(#{1,6})\s+(.*)$/.exec(line);
      return heading !== null && headingSlug(heading[2]) === wanted;
    });
    if (start !== -1) {
      const level = headingLevel(lines[start]);
      const end = lines.findIndex((line, index) => index > start && headingLevel(line) > 0 && headingLevel(line) <= level);
      return {title: lines[start].replace(/^#+\s+/, '').trim(), lines: lines.slice(start + 1, end === -1 ? undefined : end)};
    }
  }
  const title = /^#\s+(.*)$/.exec(lines.find((line) => line.trim() !== '') ?? '')?.[1];
  return {title, lines: title === undefined ? lines : lines.slice(lines.findIndex((line) => line.trim() !== '') + 1)};
}

/** Plain text without markdown syntax (links keep their text). */
function plainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>]/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Lines of only links ("Rules | Tutorial Video | BGG source") or raw HTML are no explanation
const MIN_PROSE_LENGTH = 25;

function isProse(paragraph: string): boolean {
  if (paragraph.trim().startsWith('<')) {
    return false;
  }
  const withoutLinks = paragraph.replace(/!?\[[^\]]*\]\([^)]*\)/g, '').replace(/[|\s]/g, '');
  return withoutLinks.length >= MIN_PROSE_LENGTH;
}

/** Short text for the info box: the first paragraph of the section, shortened at a word boundary. */
export function wikiExcerpt(section: Section): string {
  const paragraphs: Array<string> = [];
  let current: Array<string> = [];
  for (const line of section.lines) {
    if (/^#{1,6}\s/.test(line) || line.trim() === '') {
      if (current.length > 0) {
        paragraphs.push(current.join(' '));
        current = [];
      }
      continue;
    }
    current.push(line);
  }
  if (current.length > 0) {
    paragraphs.push(current.join(' '));
  }
  const text = plainText(paragraphs.find(isProse) ?? '');
  if (text.length <= EXCERPT_MAX_LENGTH) {
    return text;
  }
  const cut = text.slice(0, EXCERPT_MAX_LENGTH);
  return cut.slice(0, cut.lastIndexOf(' ')) + ' …';
}

// The wiki contains raw HTML (tables with images). It is written by third parties, so only a short list of harmless
// elements and attributes survives; everything else is removed (dangerous elements) or unwrapped (unknown ones).
const markdownRenderer = new MarkdownIt({html: true, linkify: true, breaks: false});
const ALLOWED_ELEMENTS = new Set(['A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DEL', 'DETAILS', 'DIV', 'EM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'HR', 'I', 'IMG', 'LI', 'OL', 'P', 'PRE', 'S', 'SPAN', 'STRONG', 'SUB', 'SUMMARY', 'SUP', 'TABLE', 'TBODY', 'TD', 'TH', 'THEAD', 'TR', 'U', 'UL']);
const REMOVED_ELEMENTS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'LINK', 'META', 'SVG', 'MATH']);
const ALLOWED_ATTRIBUTES = new Set(['href', 'src', 'alt', 'title', 'width', 'height', 'colspan', 'rowspan', 'align', 'valign', 'open']);

function sanitize(root: DocumentFragment): void {
  for (const element of Array.from(root.querySelectorAll('*'))) {
    if (REMOVED_ELEMENTS.has(element.tagName)) {
      element.remove();
      continue;
    }
    if (!ALLOWED_ELEMENTS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }
    for (const attribute of Array.from(element.attributes)) {
      const unsafeUrl = (attribute.name === 'href' || attribute.name === 'src') && !/^(https?:|#|\/|[^:]*$)/i.test(attribute.value.trim());
      if (!ALLOWED_ATTRIBUTES.has(attribute.name) || unsafeUrl) {
        element.removeAttribute(attribute.name);
      }
    }
  }
}

export type RenderedWikiPage = {title: string | undefined, html: string};

/**
 * Whole page as HTML for the overlay: the page title moves into the dialog header, headings get GitHub's anchors,
 * links and images point at GitHub.
 */
export function renderWikiPage(markdown: string): RenderedWikiPage {
  const template = document.createElement('template');
  template.innerHTML = markdownRenderer.render(markdown);
  const root = template.content;
  sanitize(root);
  const firstHeading = root.firstElementChild;
  let title: string | undefined;
  if (firstHeading?.tagName === 'H1') {
    title = firstHeading.textContent?.trim();
    firstHeading.remove();
  }
  for (const heading of Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6'))) {
    heading.id = 'wiki-' + headingSlug(heading.textContent ?? '');
  }
  for (const link of Array.from(root.querySelectorAll('a'))) {
    const href = link.getAttribute('href') ?? '';
    if (href.startsWith('#')) {
      link.setAttribute('href', '#wiki-' + href.slice(1).toLowerCase());
      continue;
    }
    link.setAttribute('href', new URL(href, WIKI + '/').href);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  }
  for (const image of Array.from(root.querySelectorAll('img'))) {
    image.setAttribute('src', new URL(image.getAttribute('src') ?? '', WIKI + '/').href);
    image.setAttribute('loading', 'lazy');
  }
  const container = document.createElement('div');
  container.append(root);
  return {title, html: container.innerHTML};
}
