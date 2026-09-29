// Symbole im Tabellenkopf schrumpfen, wenn die Spalten schmaler werden als die Symbole – nie größer als im Original.
// Alle Symbole bekommen denselben Faktor, damit sie gleich hoch bleiben. Vertrag mit milestone_award_table.less.

export const ICON_ZOOM_VARIABLE = '--ma-table-icon-zoom';
const ICON_SELECTOR = '.ma-table-head .ma-table-icon';
// Luft zwischen zwei Symbolen, damit sie nicht aneinanderstoßen
const ICON_SPACING = 4;

// Kleinster Faktor, mit dem jedes Symbol in seine Spalte passt (höchstens 1)
export function iconZoom(widths: ReadonlyArray<{icon: number; cell: number}>): number {
  let zoom = 1;
  for (const {icon, cell} of widths) {
    if (icon > 0) {
      zoom = Math.min(zoom, Math.max(0, cell - ICON_SPACING) / icon);
    }
  }
  return zoom;
}

function fit(table: HTMLElement): void {
  // In Originalgröße messen; die Spaltenbreite hängt nicht von den Symbolen ab (minmax(0, 1fr))
  table.style.setProperty(ICON_ZOOM_VARIABLE, '1');
  const widths = [...table.querySelectorAll<HTMLElement>(ICON_SELECTOR)].map((icon) => ({
    icon: icon.getBoundingClientRect().width,
    cell: icon.parentElement?.getBoundingClientRect().width ?? 0,
  }));
  table.style.setProperty(ICON_ZOOM_VARIABLE, String(iconZoom(widths)));
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
