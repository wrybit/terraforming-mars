import {BACKGROUND_FORMATS, BACKGROUND_PATH, BACKGROUND_WIDTHS} from '@/client/components/appBackgroundVariants';

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

export const BACKGROUND_CREDIT = {
  text: 'ESO/S. Brunier · CC BY 4.0',
  url: 'https://www.eso.org/public/images/eso0932a/',
};

export function backgroundFile(orientation: BackgroundOrientation, width: number, format: string): string {
  return `${BACKGROUND_PATH}-${orientation}-${width}.${format}`;
}

/** All <source> entries of the background <picture>, in the order the browser has to check them. */
export function backgroundSources(): Array<BackgroundSource> {
  const orientations: Array<BackgroundOrientation> = ['portrait', 'landscape'];
  return orientations.flatMap((orientation) => BACKGROUND_FORMATS.map((format) => ({
    media: MEDIA[orientation],
    type: `image/${format}`,
    srcset: BACKGROUND_WIDTHS[orientation].map((width) => `${backgroundFile(orientation, width, format)} ${width}w`).join(', '),
    sizes: SIZES[orientation],
  })));
}

/** For browsers without <picture>: a medium landscape file in the most widely supported format. */
export function backgroundFallback(): string {
  const formats: ReadonlyArray<string> = BACKGROUND_FORMATS;
  return backgroundFile('landscape', 1920, formats[formats.length - 1]);
}
