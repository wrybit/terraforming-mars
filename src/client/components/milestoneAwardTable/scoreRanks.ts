import {Color} from '@/common/Color';

type Score = {color: Color; score: number};

// Rang je Spalte, damit Platz 1 im Vordergrund stehen kann: gleiche Werte teilen sich den Rang
// (wie bei der Wertung der Auszeichnungen), 0 bekommt keinen Rang
export function scoreRanks(scores: ReadonlyArray<Score>): Map<Color, number> {
  const distinct = [...new Set(scores.map((entry) => entry.score).filter((score) => score > 0))].sort((a, b) => b - a);
  return new Map(scores.map((entry) => [entry.color, entry.score > 0 ? distinct.indexOf(entry.score) + 1 : 0]));
}
