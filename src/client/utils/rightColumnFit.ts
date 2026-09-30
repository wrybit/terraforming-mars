// Nutzt freie Höhe in der rechten Spalte (Brett, Meilensteine, Log) stufenweise – nur so weit, wie sie ins Fenster passt.
// Stufen in fester Reihenfolge; jede wird nur behalten, wenn die Spalte danach noch passt, und bei der ersten,
// die nicht passt, wird abgebrochen (spätere Stufen nehmen keinen Platz, den eine frühere nicht bekam).
// Die Klassen wertet player_home_columns.less aus.

// Vertrag mit player_home_columns.less
export const MARS_WIDE_CLASS = 'player-home-columns__board--mars-wide';
export const LOG_FULL_CLASS = 'player-home-columns__board--log-full';
export const BOARD_WIDE_ZOOM_VARIABLE = '--board-wide-zoom';
// Grundzoom: Brett nie breiter als die Spalte (die Spaltenbreite stellt der Nutzer per Ziehgriff ein, columnResize.ts)
export const BOARD_FIT_ZOOM_VARIABLE = '--board-fit-zoom';

const STEPS: ReadonlyArray<string> = [
  MARS_WIDE_CLASS, // 1) Mars so breit wie Meilensteine & Auszeichnungen (ohne diese: wie die Spalte)
  LOG_FULL_CLASS, // 2) Log-Karte 100 % groß, Log entsprechend höher
];

const horizontalCenter = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return rect.left + rect.width / 2;
};

// Mitte der Planetenscheibe = Mitte der Hex-Felder auf dem Mars. Der Kasten .board selbst ist breiter als die Scheibe
// (rechts Platz für Skalen), seine Mitte liegt deshalb rechts neben dem Planeten.
const GLOBE_SPACES_SELECTOR = '.board .board-space';
function globeCenter(board: HTMLElement): number | undefined {
  const spaces = [...board.querySelectorAll(GLOBE_SPACES_SELECTOR)].map((space) => space.getBoundingClientRect());
  if (spaces.length === 0) {
    return undefined;
  }
  const left = Math.min(...spaces.map((rect) => rect.left));
  const right = Math.max(...spaces.map((rect) => rect.right));
  return (left + right) / 2;
}

// Mars (die Kugel, nicht der ganze Brett-Kasten mit Skalen und Außenfeldern) mittig über die Referenz schieben.
// translate verändert das Layout nicht; die Verschiebung wird einmal gemessen, weil Zoom-Ebenen sie skalieren.
function centerMars(board: HTMLElement, reference: Element): void {
  board.style.translate = '';
  const before = globeCenter(board);
  if (before === undefined) {
    return;
  }
  const probe = 100;
  board.style.translate = `${probe}px 0`;
  const scale = ((globeCenter(board) ?? before) - before) / probe;
  board.style.translate = scale > 0 ? `${(horizontalCenter(reference) - before) / scale}px 0` : '';
}

// Breite, auf die der Mars wächst und über der er mittig steht: der Meilenstein-Block. Ohne ihn (Solospiel,
// oder per Einstellung ausgeblendet) der Brett-Block selbst – sonst bliebe der Mars klein und links, bzw.
// ein ausgeblendeter Block mit Breite 0 würde den Mars auf Zoom 0 schrumpfen.
const MILESTONES_SELECTOR = '.player_home_block--milestones-and-awards';
const MARS_BLOCK_SELECTOR = '.player-home-columns__mars';
function widthReference(column: HTMLElement): Element | undefined {
  const milestones = column.querySelector(MILESTONES_SELECTOR);
  if (milestones !== null && milestones.getBoundingClientRect().width > 0) {
    return milestones;
  }
  return column.querySelector(MARS_BLOCK_SELECTOR) ?? undefined;
}

// Außenfelder links vom Planeten (Kolonie, Raumhafen) samt Beschriftung: Steht ein großer Mars mittig über einer breiten
// Referenz, ragen sie links aus der Spalte, und deren overflow schneidet sie ab. Liefert den Faktor, um den der Zoom
// sinken muss, damit alles ab der linken Spaltenkante sichtbar bleibt (1 = passt).
function leftOverflowScale(column: HTMLElement, board: HTMLElement): number {
  const center = globeCenter(board);
  if (center === undefined) {
    return 1;
  }
  const columnLeft = column.getBoundingClientRect().left;
  const lefts = [...board.querySelectorAll('*')]
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .map((rect) => rect.left);
  const leftmost = Math.min(...lefts);
  if (leftmost >= columnLeft || center <= columnLeft) {
    return 1;
  }
  return (center - columnLeft) / (center - leftmost);
}

function fit(column: HTMLElement): void {
  column.classList.remove(...STEPS);
  column.style.setProperty(BOARD_FIT_ZOOM_VARIABLE, '1');

  // Ohne Höhenbegrenzung (Ein-Spalten-Layout unter 1400px) gibt es nichts abzuwägen
  const available = parseFloat(getComputedStyle(column).maxHeight);
  if (Number.isNaN(available)) {
    return;
  }

  // Zoom, mit dem das Brett so breit wird wie die Referenz (beide im selben Zoom-Raum gemessen)
  const board = column.querySelector<HTMLElement>('.board-cont');
  const reference = widthReference(column);
  const widenZoom = board !== null && reference !== undefined ?
    reference.getBoundingClientRect().width / board.getBoundingClientRect().width :
    1;
  column.style.setProperty(BOARD_WIDE_ZOOM_VARIABLE, String(widenZoom));
  // Schmale Spalte: Brett immer verkleinern, damit es nicht über den Rand ragt
  column.style.setProperty(BOARD_FIT_ZOOM_VARIABLE, String(Math.min(1, widenZoom)));

  for (const step of STEPS) {
    // Mars nur vergrößern, nicht verkleinern
    if (step === MARS_WIDE_CLASS && widenZoom <= 1) {
      continue;
    }
    column.classList.add(step);
    if (column.scrollHeight > available) {
      column.classList.remove(step);
      break;
    }
  }

  if (board !== null && reference !== undefined) {
    centerMars(board, reference);
    const scale = leftOverflowScale(column, board);
    if (scale < 1) {
      // Wirksam ist der Zoom der höchsten erreichten Stufe
      const variable = column.classList.contains(MARS_WIDE_CLASS) ? BOARD_WIDE_ZOOM_VARIABLE : BOARD_FIT_ZOOM_VARIABLE;
      const current = parseFloat(column.style.getPropertyValue(variable)) || 1;
      column.style.setProperty(variable, String(current * scale));
      centerMars(board, reference);
    }
  }
}

// Beginnt mit der Anpassung und liefert eine Aufräumfunktion zurück
export function observeRightColumnFit(column: HTMLElement): () => void {
  let frame: number | undefined;
  // Pro Frame höchstens einmal neu berechnen (Resize feuert in schneller Folge)
  const schedule = () => {
    if (frame === undefined) {
      frame = requestAnimationFrame(() => {
        frame = undefined;
        fit(column);
      });
    }
  };
  window.addEventListener('resize', schedule);
  // Breite ändert sich auch ohne Fenster-Resize (Ziehgriff zwischen den Spalten); Höhe ignorieren,
  // die ändert fit() selbst. Ohne ResizeObserver (Testumgebung) nur das Fenster beobachten
  let lastWidth = column.getBoundingClientRect().width;
  const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => {
    const width = column.getBoundingClientRect().width;
    if (width !== lastWidth) {
      lastWidth = width;
      schedule();
    }
  });
  resizeObserver?.observe(column);
  schedule();

  return () => {
    window.removeEventListener('resize', schedule);
    resizeObserver?.disconnect();
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
    }
    column.classList.remove(...STEPS);
  };
}
