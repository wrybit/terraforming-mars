/* Start page preloader: everything the menu and intro need (fonts, background, planet images, icons)
   is loaded before the intro – otherwise the page visibly builds up during the animation. */

const IMAGES = [
  'assets/background.jpg',
  'assets/buttons-homepage/planets.jpg',
  'assets/buttons-homepage/planet-stripes.jpg',
  'assets/sidebar/preferences_settings.svg',
  'assets/misc/github.png',
];

// Fonts with sample text, so exactly the needed character sets (unicode-range) are loaded
const FONTS = ['26px Prototype', '14px Ubuntu'];
const FONT_SAMPLE = 'TERRAFORMING MARS';

// Continue at the latest by then, even if something hangs – better incomplete than not at all
export const PRELOAD_TIMEOUT = 5000;

function loadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    // Errors count as loaded: a missing image must not block the start page
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = url;
  });
}

function loadFont(font: string): Promise<void> {
  if (typeof document.fonts?.load !== 'function') {
    return Promise.resolve();
  }
  return document.fonts.load(font, FONT_SAMPLE).then(() => undefined, () => undefined);
}

/** Loads all parts; onProgress receives the fraction (0–1) after each finished part. */
export function preloadStartAssets(onProgress: (share: number) => void): Promise<void> {
  const tasks = [...IMAGES.map(loadImage), ...FONTS.map(loadFont)];
  let done = 0;
  const tracked = tasks.map((task) => task.then(() => onProgress(++done / tasks.length)));
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, PRELOAD_TIMEOUT));
  return Promise.race([Promise.all(tracked).then(() => undefined), timeout]);
}
