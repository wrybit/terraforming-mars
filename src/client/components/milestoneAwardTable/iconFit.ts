// Symbole im Tabellenkopf schrumpfen, wenn ihre Spalte schmaler wird als das Symbol – nie größer als im Original.
// Jedes Symbol einzeln: ein gemeinsamer Faktor würde alle wegen eines breiten Doppel-Symbols winzig machen.
// Vertrag mit milestone_award_table.less.

export const ICON_ZOOM_VARIABLE = '--ma-table-icon-zoom';
const ICON_SELECTOR = '.ma-table-head .ma-table-icon';
// Luft zwischen zwei Symbolen, damit sie nicht aneinanderstoßen
const ICON_SPACING = 4;

// Faktor, mit dem das Symbol in seine Spalte passt (höchstens 1)
export function iconZoom(iconWidth: number, cellWidth: number): number {
  if (iconWidth <= 0) {
    return 1;
  }
  return Math.min(1, Math.max(0, cellWidth - ICON_SPACING) / iconWidth);
}

function fit(table: HTMLElement): void {
  const icons = [...table.querySelectorAll<HTMLElement>(ICON_SELECTOR)];
  // In Originalgröße messen; die Spaltenbreite hängt nicht von den Symbolen ab (minmax(0, 1fr))
  icons.forEach((icon) => icon.style.setProperty(ICON_ZOOM_VARIABLE, '1'));
  const zooms = icons.map((icon) => iconZoom(icon.getBoundingClientRect().width, icon.parentElement?.getBoundingClientRect().width ?? 0));
  icons.forEach((icon, index) => icon.style.setProperty(ICON_ZOOM_VARIABLE, String(zooms[index])));
}

// Beginnt mit der Anpassung und liefert eine Aufräumfunktion zurück
export function observeIconFit(table: HTMLElement): () => void {
  let frame: number | undefined;
  const schedule = () => {
    if (frame === undefined) {
      frame = requestAnimationFrame(() => {
        frame = undefined;
        fit(table);
      });
    }
  };
  // Tabellenbreite ändert sich mit Fenster und Ziehgriff; Bilder haben ihre Breite erst nach dem Laden
  const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule);
  resizeObserver?.observe(table);
  table.addEventListener('load', schedule, true);
  schedule();

  return () => {
    resizeObserver?.disconnect();
    table.removeEventListener('load', schedule, true);
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
    }
  };
}
