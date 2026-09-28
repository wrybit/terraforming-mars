// Nutzt freie Höhe in der rechten Spalte (Brett, Meilensteine, Log) stufenweise – nur so weit, wie sie ins Fenster passt.
// Stufen in fester Reihenfolge; jede wird nur behalten, wenn die Spalte danach noch passt, und bei der ersten,
// die nicht passt, wird abgebrochen (spätere Stufen nehmen keinen Platz, den eine frühere nicht bekam).
// Die Klassen wertet player_home_columns.less aus.

// Vertrag mit player_home_columns.less
export const MARS_WIDE_CLASS = 'player-home-columns__board--mars-wide';
export const MILESTONES_FULL_CLASS = 'player-home-columns__board--milestones-full';
export const LOG_FULL_CLASS = 'player-home-columns__board--log-full';
export const BOARD_WIDE_ZOOM_VARIABLE = '--board-wide-zoom';

const STEPS: ReadonlyArray<string> = [
  MARS_WIDE_CLASS, // 1) Mars so breit wie Meilensteine & Auszeichnungen
  MILESTONES_FULL_CLASS, // 2) Meilensteine & Auszeichnungen in voller Höhe
  LOG_FULL_CLASS, // 3) Log-Karte 100 % groß, Log entsprechend höher
];

function fit(column: HTMLElement): void {
  column.classList.remove(...STEPS);

  // Ohne Höhenbegrenzung (Ein-Spalten-Layout unter 1400px) gibt es nichts abzuwägen
  const available = parseFloat(getComputedStyle(column).maxHeight);
  if (Number.isNaN(available)) {
    return;
  }

  // Zoom, mit dem das Brett so breit wird wie der Meilenstein-Block (beide im selben Zoom-Raum gemessen)
  const board = column.querySelector('.board-cont');
  const milestones = column.querySelector('.player_home_block--milestones-and-awards');
  const widenZoom = board !== null && milestones !== null ?
    milestones.getBoundingClientRect().width / board.getBoundingClientRect().width :
    1;
  column.style.setProperty(BOARD_WIDE_ZOOM_VARIABLE, String(widenZoom));

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
  schedule();

  return () => {
    window.removeEventListener('resize', schedule);
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
    }
    column.classList.remove(...STEPS);
  };
}
