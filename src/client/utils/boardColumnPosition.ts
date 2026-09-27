// Stellt die linke Kante der rechten Spalte (Brett + Log) als CSS-Variable bereit.
// Das Gegner-Modal (player_home_columns.less) überdeckt damit genau diese Spalte, auch wenn deren
// Breite je nach Inhalt (Meilensteine, Turmoil, Zoom) schwankt – feste Werte im CSS wären zu fragil.

export const BOARD_COLUMN_LEFT_VARIABLE = '--board-column-left';

// Beginnt mit der Beobachtung und liefert eine Aufräumfunktion zurück
export function observeBoardColumn(column: HTMLElement): () => void {
  const update = () => {
    document.documentElement.style.setProperty(
      BOARD_COLUMN_LEFT_VARIABLE,
      column.getBoundingClientRect().left + 'px',
    );
  };
  // Spaltenbreite ändert sich mit dem Inhalt, die Position mit der Fensterbreite
  const resizeObserver = new ResizeObserver(update);
  resizeObserver.observe(column);
  window.addEventListener('resize', update);
  update();

  return () => {
    resizeObserver.disconnect();
    window.removeEventListener('resize', update);
    document.documentElement.style.removeProperty(BOARD_COLUMN_LEFT_VARIABLE);
  };
}
