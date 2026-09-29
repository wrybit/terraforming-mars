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
  MARS_WIDE_CLASS, // 1) Mars so breit wie Meilensteine & Auszeichnungen
  LOG_FULL_CLASS, // 2) Log-Karte 100 % groß, Log entsprechend höher
];

const horizontalCenter = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return rect.left + rect.width / 2;
};

// Mars (die Kugel, nicht der ganze Brett-Kasten mit Skalen und Außenfeldern) mittig über die Meilenstein-Tabelle schieben.
// translate verändert das Layout nicht; die Verschiebung wird einmal gemessen, weil Zoom-Ebenen sie skalieren.
function centerMars(board: HTMLElement, globe: Element, reference: Element): void {
  board.style.translate = '';
  const before = horizontalCenter(globe);
  const probe = 100;
  board.style.translate = `${probe}px 0`;
  const scale = (horizontalCenter(globe) - before) / probe;
  board.style.translate = scale > 0 ? `${(horizontalCenter(reference) - before) / scale}px 0` : '';
}

function fit(column: HTMLElement): void {
  column.classList.remove(...STEPS);
  column.style.setProperty(BOARD_FIT_ZOOM_VARIABLE, '1');

  // Ohne Höhenbegrenzung (Ein-Spalten-Layout unter 1400px) gibt es nichts abzuwägen
  const available = parseFloat(getComputedStyle(column).maxHeight);
  if (Number.isNaN(available)) {
    return;
  }

  // Zoom, mit dem das Brett so breit wird wie der Meilenstein-Block (beide im selben Zoom-Raum gemessen)
  const board = column.querySelector<HTMLElement>('.board-cont');
  const milestones = column.querySelector('.player_home_block--milestones-and-awards');
  const widenZoom = board !== null && milestones !== null ?
    milestones.getBoundingClientRect().width / board.getBoundingClientRect().width :
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

  const globe = board?.querySelector('.board');
  if (board !== null && globe !== null && globe !== undefined && milestones !== null) {
    centerMars(board, globe, milestones);
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
