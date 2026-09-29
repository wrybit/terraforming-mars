/*
 * Größenanpassung fester Spiel-Bausteine (Karten, Mars-Brett) an die Breite der Mobil-Ansicht.
 *
 * Kein CSS-`zoom` (Safari rechnet ihn in Rastern anders, Karten überlappen), sondern `transform: scale()`
 * am Element; negative Außenabstände ziehen die Layout-Box auf die sichtbare Größe zusammen. Es werden nur
 * Stile gesetzt, keine Knoten verschoben – sonst käme Vue beim Aktualisieren durcheinander.
 */

/* Sichtbarer Ausschnitt eines Elements in dessen eigenen px (vor der Skalierung). */
export type FitCrop = {left: number, top: number, width: number, height: number};

/* Regel: welche Elemente wie skaliert werden. */
type FitRule = {
  selector: string;
  // Innerhalb dieser Bereiche nicht anfassen
  exclude?: string;
  // Anzahl Elemente nebeneinander (je nach Listenbreite) oder volle Breite mit Ausschnitt
  columns?: (listWidth: number) => number;
  crop?: FitCrop;
};

// Abstand zwischen Elementen einer Liste (rechts und unten, als Teil des Außenabstands)
const GAP_PX = 6;
// Bezugsbreite: der Bildschirm, in dem das Element steht (Listen selbst sind oft nur so breit wie ihr Inhalt)
const CONTAINER_SELECTOR = '.mb-screen';
const FITTED_CLASS = 'mb-fit';

/* Spaltenzahl für eine Kartenliste der Breite `width` px: Handy 2, Tablet hoch 3, Tablet quer 4. */
export function cardColumns(width: number): number {
  if (width >= 900) {
    return 4;
  }
  return width >= 560 ? 3 : 2;
}

/* Maßstab, mit dem `columns` Elemente der Breite `itemWidth` samt Lücke (`GAP_PX`) in `listWidth` passen (höchstens 1). */
export function fitScale(listWidth: number, itemWidth: number, columns: number): number {
  if (itemWidth <= 0) {
    return 1;
  }
  const available = listWidth / columns - GAP_PX;
  return Math.max(0.3, Math.min(1, available / itemWidth));
}

// Mars ohne Skalen-Ring: Planet samt Kolonie-Feldern in den oberen Ecken (mobile.less)
// Höchstens dieser Anteil der Fensterhöhe für das Brett (Tablet quer: Balken bleiben sichtbar)
const BOARD_HEIGHT_SHARE = 0.62;
const MARS_CROP: FitCrop = {left: 42, top: 62, width: 550, height: 486};

const RULES: ReadonlyArray<FitRule> = [
  {selector: '.mb-screen--mars > .board-cont.board-without-venus', crop: MARS_CROP},
  {selector: '.mb-screen--mars > .board-cont'},
  // Tabellen (Spieler, Meilensteine & Auszeichnungen) über die volle Breite
  {selector: '.mb-screen--players .players-table, .mb-screen--mars .ma-table', columns: () => 1},
  {
    selector: '.card-container',
    // Log-Vorschau, Karten in Erklär-Kacheln und verschachtelte Karten behalten ihre Größe
    exclude: '.log-container, .mb-fit-off, .card-intro-block, .tab-intro-block, .mb-fit > .card-container .card-container',
    columns: cardColumns,
  },
];

function innerWidth(element: HTMLElement): number {
  const style = getComputedStyle(element);
  return element.clientWidth - parseFloat(style.paddingLeft || '0') - parseFloat(style.paddingRight || '0');
}

type StyleProperty = 'transform' | 'marginRight' | 'marginBottom' | 'clipPath' | 'transformOrigin';

function setStyles(element: HTMLElement, styles: Partial<Record<StyleProperty, string>>): void {
  for (const [property, value] of Object.entries(styles) as Array<[StyleProperty, string]>) {
    // Nur bei Änderung schreiben, sonst weckt jede Messung den MutationObserver erneut
    if (element.style[property] !== value) {
      element.style[property] = value;
    }
  }
}

function fit(element: HTMLElement, rule: FitRule): void {
  const list = element.closest<HTMLElement>(CONTAINER_SELECTOR);
  // offsetWidth/-Height ignorieren transform: das sind die natürlichen Maße
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  if (list === null || width === 0) {
    return; // unsichtbar (anderer Bildschirm): beim nächsten Sichtbarwerden messen
  }
  const listWidth = innerWidth(list);
  const crop = rule.crop ?? {left: 0, top: 0, width, height};
  const scale = rule.columns === undefined ? Math.min(listWidth / crop.width, window.innerHeight * BOARD_HEIGHT_SHARE / crop.height) : fitScale(listWidth, width, rule.columns(listWidth));
  const gap = rule.columns === undefined ? 0 : GAP_PX;
  element.classList.add(FITTED_CLASS);
  setStyles(element, {
    transformOrigin: '0 0',
    transform: `translate(${-crop.left * scale}px, ${-crop.top * scale}px) scale(${scale.toFixed(4)})`,
    // Layout-Box auf den sichtbaren Ausschnitt verkleinern; in Listen plus Lücke zum Nachbarn
    // (abgerundet, sonst passt die letzte Spalte wegen Rundung nicht mehr in die Reihe)
    marginRight: Math.floor(crop.width * scale + gap) - width + 'px',
    marginBottom: Math.floor(crop.height * scale + gap) - height + 'px',
    clipPath: rule.crop === undefined ? '' :
      `inset(${crop.top}px ${width - crop.left - crop.width}px ${height - crop.top - crop.height}px ${crop.left}px)`,
  });
}

function fitAll(root: HTMLElement): void {
  const done = new Set<Element>();
  for (const rule of RULES) {
    root.querySelectorAll<HTMLElement>(rule.selector).forEach((element) => {
      if (done.has(element) || (rule.exclude !== undefined && element.matches(`:is(${rule.exclude}) *, :is(${rule.exclude})`))) {
        return;
      }
      done.add(element);
      fit(element, rule);
    });
  }
}

/* Hält Karten und Brett unter `root` passend skaliert, bis die zurückgegebene Funktion aufgerufen wird. */
export function observeMobileFit(root: HTMLElement): () => void {
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => fitAll(root));
  };
  const mutations = new MutationObserver(schedule);
  // style/class: Bildschirmwechsel per v-show machen Elemente erst sichtbar
  mutations.observe(root, {childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class']});
  // Ohne ResizeObserver (Testumgebung) genügt das Fenster-Ereignis
  const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule);
  resize?.observe(root);
  window.addEventListener('resize', schedule);
  schedule();
  return () => {
    cancelAnimationFrame(frame);
    mutations.disconnect();
    resize?.disconnect();
    window.removeEventListener('resize', schedule);
  };
}
