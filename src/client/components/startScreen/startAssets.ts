/* Preloader der Startseite: alles, was Menü und Intro brauchen (Schriften, Hintergrund, Planeten-Bilder, Symbole),
   wird vor dem Intro geladen – sonst baut sich die Seite während der Animation sichtbar nach. */

const IMAGES = [
  'assets/background.jpg',
  'assets/buttons-homepage/planets.jpg',
  'assets/buttons-homepage/planet-stripes.jpg',
  'assets/flags_responsive.png',
  'assets/sidebar/preferences_settings.png',
  'assets/misc/github.png',
];

// Schriften mit Beispieltext, damit genau die benötigten Zeichensätze (unicode-range) geladen werden
const FONTS = ['26px Prototype', '14px Ubuntu'];
const FONT_SAMPLE = 'TERRAFORMING MARS';

// Spätestens dann geht es weiter, auch wenn etwas hängt – lieber unvollständig als gar nicht
export const PRELOAD_TIMEOUT = 5000;

function loadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    // Fehler zählen wie geladen: ein fehlendes Bild soll die Startseite nicht blockieren
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

/** Lädt alle Bausteine; onProgress bekommt den Anteil (0–1) nach jedem fertigen Teil. */
export function preloadStartAssets(onProgress: (share: number) => void): Promise<void> {
  const tasks = [...IMAGES.map(loadImage), ...FONTS.map(loadFont)];
  let done = 0;
  const tracked = tasks.map((task) => task.then(() => onProgress(++done / tasks.length)));
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, PRELOAD_TIMEOUT));
  return Promise.race([Promise.all(tracked).then(() => undefined), timeout]);
}
