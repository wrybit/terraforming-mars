import {observeMobileFit} from '@/client/utils/mobileFit';
import {transposedCopy} from '@/client/utils/transposeTable';

/*
 * Anpassungen der Mobil-Ansicht, die über die Spieleransicht hinaus gelten (Ergebnisseite, Modals):
 * Skalierung per mobileFit.ts und gedrehte Ergebnistabelle.
 */

// Breite Tabellen, die auf dem Handy gedreht erscheinen; das Original wird per CSS ausgeblendet (mobile.less)
const TRANSPOSE_SELECTOR = '.game_end_table:not(.mb-transposed)';
const SOURCE_CLASS = 'mb-transposed-source';

function transposeTables(root: HTMLElement): void {
  root.querySelectorAll<HTMLTableElement>(TRANSPOSE_SELECTOR).forEach((table) => {
    const next = table.nextElementSibling;
    if (next?.classList.contains('mb-transposed')) {
      return;
    }
    const copy = transposedCopy(table);
    table.classList.add(SOURCE_CLASS);
    table.after(copy);
  });
}

/* Startet die Anpassungen für `root` und liefert die Funktion, die sie wieder beendet. */
export function startMobileDocument(root: HTMLElement): () => void {
  const stopFit = observeMobileFit(root);
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => transposeTables(root));
  };
  const mutations = new MutationObserver(schedule);
  mutations.observe(root, {childList: true, subtree: true});
  schedule();
  return () => {
    stopFit();
    cancelAnimationFrame(frame);
    mutations.disconnect();
    // Gedrehte Kopien entfernen, das Original wieder zeigen (Wechsel zur Desktop-Ansicht)
    root.querySelectorAll('.mb-transposed').forEach((copy) => copy.remove());
    root.querySelectorAll('.' + SOURCE_CLASS).forEach((table) => table.classList.remove(SOURCE_CLASS));
  };
}
