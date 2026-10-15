// Favicons the admin can choose (settings FAVICON_ICON and FAVICON_COLOR): every icon in every color.
// The list lives in favicons.json, which scripts/make-favicons.py also reads to build
// assets/favicon/<icon>-<color>.png, so the admin page, the server and the generated files
// always know the same icons and colors.
import favicons from './favicons.json';

export type FaviconOption = {
  id: string,
  /** Name shown on the admin page (translated) */
  label: string,
};

const option = ({id, label}: FaviconOption): FaviconOption => ({id, label});

export const FAVICON_ICONS: ReadonlyArray<FaviconOption> = favicons.icons.map(option);
export const FAVICON_COLORS: ReadonlyArray<FaviconOption> = favicons.colors.map(option);

/** Mars in orange: the original favicon, chosen when a setting is empty or unknown */
export const DEFAULT_FAVICON_ICON = FAVICON_ICONS[0].id;
export const DEFAULT_FAVICON_COLOR = FAVICON_COLORS[0].id;

// A typo in the .env falls back to the default instead of a missing picture
function known(options: ReadonlyArray<FaviconOption>, value: string | undefined, fallback: string): string {
  const id = value?.trim() ?? '';
  return options.some((entry) => entry.id === id) ? id : fallback;
}

/** Generated picture of an icon in a color, also the preview on the admin page */
export function faviconImage(icon: string | undefined, color: string | undefined): string {
  return `assets/favicon/${known(FAVICON_ICONS, icon, DEFAULT_FAVICON_ICON)}-${known(FAVICON_COLORS, color, DEFAULT_FAVICON_COLOR)}.png`;
}

/** File served as favicon.ico: the original file for the default, the generated picture otherwise */
export function faviconFile(icon: string | undefined, color: string | undefined): string {
  const file = faviconImage(icon, color);
  return file === faviconImage(DEFAULT_FAVICON_ICON, DEFAULT_FAVICON_COLOR) ? 'assets/favicon.ico' : file;
}
