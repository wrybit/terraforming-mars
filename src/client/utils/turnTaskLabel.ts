import {Phase} from '@/common/Phase';

// Kurzer Name der aktuellen Aufgabe für den Tab-Titel ("Kaufen", "Spielen" …).
// Die Phase reicht dafür aus und ist für jede Eingabe gleich verlässlich wie die Eingabe selbst.
// Rückgabe ist der englische Übersetzungsschlüssel; übersetzt wird beim Aufrufer.
export function turnTaskLabel(game: {phase: Phase, generation: number}): string {
  switch (game.phase) {
  case Phase.INITIALDRAFTING:
  case Phase.DRAFTING:
    return 'Draft';
  case Phase.RESEARCH:
    // In der ersten Generation wählt man Konzern, Präludien und Karten zugleich.
    return game.generation === 1 ? 'Opening' : 'Buying';
  case Phase.PRELUDES:
    return 'Prelude';
  case Phase.CEOS:
    return 'CEO';
  case Phase.ACTION:
    return 'Play';
  case Phase.PRODUCTION:
    return 'Production';
  case Phase.SOLAR:
    return 'Solar phase';
  default:
    return 'Your turn';
  }
}
