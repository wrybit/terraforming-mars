/*
 * Größenanpassung fester Spiel-Bausteine (Karten, Mars-Brett) an die Breite der Mobil-Ansicht.
 *
 * Kein CSS-`zoom` (Safari rechnet ihn in Rastern anders, Karten überlappen), sondern `transform: scale()`
 * am Element; negative Außenabstände ziehen die Layout-Box auf die sichtbare Größe zusammen. Es werden nur
 * Stile gesetzt, keine Knoten verschoben – sonst käme Vue beim Aktualisieren durcheinander.
 */

import {MARS_CROP} from '@/client/components/mobile/mobileBoardZoom';

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
  // Auswahl-Raster: Lücken in px statt GAP_PX; die Liste ragt rechts um die Spaltenlücke über (mobile.less),
  // damit die Spalten die volle Breite füllen und nur zwischen den Kacheln Luft bleibt
  choiceGap?: {column: number, row: number};
};

// Abstand zwischen Elementen einer Liste (rechts und unten, als Teil des Außenabstands)
const GAP_PX = 6;
// Lücken zwischen Auswahl-Kacheln (Standardprojekte), vgl. @mb-choice-gap/@mb-choice-row-gap in mobile.less;
// zwischen den Zeilen sitzt das Häkchen-Fähnchen
const CHOICE_GAP = {column: 14, row: 36};
// Bezugsbreite: die nächste Box bzw. der Bildschirm, in dem das Element steht (Listen selbst sind oft nur so breit wie ihr Inhalt)
// Gespielte Karten (mobile_played_cards.less) reichen breiter als der Bildschirm-Innenabstand
const CONTAINER_SELECTOR = '.setup-column-body, .or-tab-panel, .other_player_cont, .mb-screen, .game-end-box';
const FITTED_CLASS = 'mb-fit';
// Mars ohne Skalen-Ring (mobile.less: Planet-Bild, Kolonie-Felder in die Ecken)
const CROPPED_CLASS = 'mb-mars-cropped';

/* Spaltenzahl für eine Kartenliste der Breite `width` px: Handy 2, Tablet hoch 3, Tablet quer 4. */
export function cardColumns(width: number): number {
  if (width >= 900) {
    return 4;
  }
  return width >= 560 ? 3 : 2;
}

/* Maßstab, mit dem `columns` Elemente der Breite `itemWidth` samt Lücke `gap` in `listWidth` passen (höchstens 1). */
export function fitScale(listWidth: number, itemWidth: number, columns: number, gap: number = GAP_PX): number {
  if (itemWidth <= 0) {
    return 1;
  }
  const available = listWidth / columns - gap;
  return Math.max(0.3, Math.min(1, available / itemWidth));
}

// Mars ohne Skalen-Ring: Planet samt Kolonie-Feldern in den oberen Ecken (mobile.less)
// Hochformat: höchstens dieser Anteil der Fensterhöhe für das Brett, darunter bleiben die Balken sichtbar
const BOARD_HEIGHT_SHARE = 0.62;
// Tablet quer (mobile.less, @mb-landscape: Mars links, Rest rechts; Spieler-Tabellen waagerecht): ab dieser Breite im Querformat
export const LANDSCAPE_MIN_WIDTH = 900;
const BARS_HEIGHT = 180;

/* Höchste Brett-Höhe in px für das aktuelle Fenster. */
export function boardMaxHeight(width: number, height: number): number {
  const landscape = width >= LANDSCAPE_MIN_WIDTH && width > height;
  return landscape ? height - BARS_HEIGHT : height * BOARD_HEIGHT_SHARE;
}

const RULES: ReadonlyArray<FitRule> = [
  {selector: '.mb-screen--mars > .board-cont.board-without-venus, #game-end .board-cont.board-without-venus', crop: MARS_CROP},
  {selector: '.mb-screen--mars > .board-cont, #game-end .board-cont'},
  // Gedrehte Ergebnistabelle über die volle Breite
  {selector: '#game-end .game_end_table.mb-transposed', columns: () => 1},
  // Meilensteine & Auszeichnungen als Tabelle über die volle Breite
  {selector: '.mb-screen .ma-table', columns: () => 1},
  // Standardprojekte: alle auf einen Blick im Raster wie die übrigen Kartenlisten, kein Karussell (vgl. cardCarousel.ts)
  // Lücken wie bei den Meilenstein-/Auszeichnungs-Kacheln (mobile.less)
  {selector: '.mb-screen--turn .payments_cont .card-container.card-standard-project', columns: cardColumns, choiceGap: CHOICE_GAP},
  // Karten-Karussell (Karte spielen): eine Karte groß in der Mitte
  {selector: '.mb-screen--turn .payments_cont .card-container', columns: () => 1},
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
  const gap = rule.columns === undefined ? 0 : rule.choiceGap?.column ?? GAP_PX;
  const rowGap = rule.columns === undefined ? 0 : rule.choiceGap?.row ?? GAP_PX;
  const fitWidth = listWidth + (rule.choiceGap?.column ?? 0);
  const scale = rule.columns === undefined ? Math.min(listWidth / crop.width, boardMaxHeight(window.innerWidth, window.innerHeight) / crop.height) : fitScale(fitWidth, width, rule.columns(listWidth), gap);
  element.classList.add(FITTED_CLASS);
  element.classList.toggle(CROPPED_CLASS, rule.crop !== undefined);
  setStyles(element, {
    transformOrigin: '0 0',
    transform: `translate(${-crop.left * scale}px, ${-crop.top * scale}px) scale(${scale.toFixed(4)})`,
    // Layout-Box auf den sichtbaren Ausschnitt verkleinern; in Listen plus Lücke zum Nachbarn
    // (abgerundet, sonst passt die letzte Spalte wegen Rundung nicht mehr in die Reihe)
    marginRight: Math.floor(crop.width * scale + gap) - width + 'px',
    marginBottom: Math.floor(crop.height * scale + rowGap) - height + 'px',
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
