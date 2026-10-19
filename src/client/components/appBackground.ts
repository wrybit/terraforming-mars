import {BACKGROUND_FORMATS, BACKGROUND_PATHS, BACKGROUND_WIDTHS} from '@/client/components/appBackgroundVariants';
import {Theme} from '@/common/theme/Theme';

export type BackgroundOrientation = keyof typeof BACKGROUND_WIDTHS;

export type BackgroundSource = {
  media: string | undefined,
  type: string,
  srcset: string,
  sizes: string,
};

// Rendered width of the image with object-fit: cover. The landscape image is 2:1, so on any window
// narrower than 2:1 the height decides (200vh); the portrait crop is 1:2, so 50vh there.
// The browser multiplies this by the pixel density and picks the smallest file that is big enough.
const SIZES: Record<BackgroundOrientation, string> = {
  landscape: 'max(100vw, 200vh)',
  portrait: 'max(100vw, 50vh)',
};

// Portrait first: the browser takes the first <source> whose media query matches
const MEDIA: Record<BackgroundOrientation, string | undefined> = {
  portrait: '(orientation: portrait)',
  landscape: undefined,
};

export type BackgroundCredit = {
  // Parts joined with " · "; a line break only ever falls between parts, never inside one ("S. | Brunier")
  parts: ReadonlyArray<string>,
  url: string,
};

// Credit required by the licence of the picture; the Dune picture is Jens' own and needs none
export const BACKGROUND_CREDITS: Record<Theme, BackgroundCredit | undefined> = {
  mars: {
    parts: ['Background photo: Milky Way', 'ESO', 'S. Brunier', 'CC BY 4.0'],
    url: 'https://www.eso.org/public/images/eso0932a/',
  },
  dune: undefined,
};

export function backgroundFile(theme: Theme, orientation: BackgroundOrientation, width: number, format: string): string {
  return `${BACKGROUND_PATHS[theme]}-${orientation}-${width}.${format}`;
}

// File extension -> MIME type of the <source>; JPEG last, so only browsers without AVIF/WebP take it
const MIME_TYPES: Record<string, string> = {avif: 'image/avif', webp: 'image/webp', jpg: 'image/jpeg'};

/** All <source> entries of the background <picture> of a theme, in the order the browser has to check them. */
export function backgroundSources(theme: Theme): Array<BackgroundSource> {
  const orientations: Array<BackgroundOrientation> = ['portrait', 'landscape'];
  return orientations.flatMap((orientation) => BACKGROUND_FORMATS.map((format) => ({
    media: MEDIA[orientation],
    type: MIME_TYPES[format],
    srcset: BACKGROUND_WIDTHS[orientation].map((width) => `${backgroundFile(theme, orientation, width, format)} ${width}w`).join(', '),
    sizes: SIZES[orientation],
  })));
}

/** For browsers without <picture> support: a medium landscape JPEG. */
export function backgroundFallback(theme: Theme): string {
  return backgroundFile(theme, 'landscape', 1920, 'jpg');
}
