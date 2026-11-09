import {Theme} from './Theme';

// Addresses with a world in front open the pages in that theme: /dune/lobby, /dune/stats, /mars/cards, /dune/.
// The world is a transparent folder: the server serves everything below it like the address without it
// (requestProcessor.ts), so every relative address of the page (scripts, api/..., menu links) stays in the world.
// Without a world in the address the pages show Mars.

// "dune/…" or "mars/…" at the start of a path (without the leading slash)
const THEME_SEGMENT = /^(mars|dune)(\/|$)/;

/** The world of a path relative to the app root (e.g. "dune/lobby" → dune), undefined without one */
export function themeOfPath(path: string): Theme | undefined {
  const match = THEME_SEGMENT.exec(path);
  return match === null ? undefined : match[1] as Theme;
}

/** The path without its world ("dune/lobby" → "lobby", "dune" → ""); paths without a world stay as they are */
export function withoutTheme(path: string): string {
  return path.replace(THEME_SEGMENT, '');
}
