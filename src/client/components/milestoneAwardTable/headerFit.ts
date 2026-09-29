// Kopf der Meilenstein-Tabelle an schmale Spalten anpassen (Vertrag mit milestone_award_table.less):
// - Symbole schrumpfen, wenn ihre Spalte schmaler wird als das Symbol – nie größer als im Original.
//   Jedes Symbol einzeln: ein gemeinsamer Faktor würde alle wegen eines breiten Doppel-Symbols winzig machen.
// - Besitzer (Würfel + Name): passt beides nicht, entfällt der Würfel; den Namen kürzt danach das CSS.

export const ICON_ZOOM_VARIABLE = '--ma-table-icon-zoom';
const ICON_SELECTOR = '.ma-table-head .ma-table-icon';
const OWNER_SELECTOR = '.ma-table-owner';
const OWNER_NAME_SELECTOR = '.ma-table-owner-name';
export const OWNER_WITHOUT_CUBE_CLASS = 'ma-table-owner--no-cube';
// Luft zwischen zwei Symbolen, damit sie nicht aneinanderstoßen
const ICON_SPACING = 4;

// Faktor, mit dem das Symbol in seine Spalte passt (höchstens 1)
export function iconZoom(iconWidth: number, cellWidth: number): number {
  if (iconWidth <= 0) {
    return 1;
  }
  return Math.min(1, Math.max(0, cellWidth - ICON_SPACING) / iconWidth);
}

function fitOwners(table: HTMLElement): void {
  const owners = [...table.querySelectorAll<HTMLElement>(OWNER_SELECTOR)];
  // Erst alle mit Würfel messen, dann nur die zu breiten umschalten (kein Hin und Her pro Element)
  owners.forEach((owner) => owner.classList.remove(OWNER_WITHOUT_CUBE_CLASS));
  // Der Name schrumpft (Auslassungspunkte), statt überzulaufen – gekürzter Name heißt: zu wenig Platz
  const tooWide = owners.filter((owner) => {
    const name = owner.querySelector<HTMLElement>(OWNER_NAME_SELECTOR);
    return name !== null && name.scrollWidth > name.clientWidth;
  });
  tooWide.forEach((owner) => owner.classList.add(OWNER_WITHOUT_CUBE_CLASS));
}

function fitIcons(table: HTMLElement): void {
  const icons = [...table.querySelectorAll<HTMLElement>(ICON_SELECTOR)];
  // In Originalgröße messen; die Spaltenbreite hängt nicht von den Symbolen ab (minmax(0, 1fr))
  icons.forEach((icon) => icon.style.setProperty(ICON_ZOOM_VARIABLE, '1'));
  const zooms = icons.map((icon) => iconZoom(icon.getBoundingClientRect().width, icon.parentElement?.getBoundingClientRect().width ?? 0));
  icons.forEach((icon, index) => icon.style.setProperty(ICON_ZOOM_VARIABLE, String(zooms[index])));
}

function fit(table: HTMLElement): void {
  fitIcons(table);
  fitOwners(table);
}

// Beginnt mit der Anpassung und liefert eine Aufräumfunktion zurück
export function observeHeaderFit(table: HTMLElement): () => void {
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
