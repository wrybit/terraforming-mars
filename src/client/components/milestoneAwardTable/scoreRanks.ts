import {Color} from '@/common/Color';

type Score = {color: Color; score: number};

// Rank per column so first place can stand out: equal values share the rank
// (as in award scoring), 0 gets no rank
export function scoreRanks(scores: ReadonlyArray<Score>): Map<Color, number> {
  const distinct = [...new Set(scores.map((entry) => entry.score).filter((score) => score > 0))].sort((a, b) => b - a);
  return new Map(scores.map((entry) => [entry.color, entry.score > 0 ? distinct.indexOf(entry.score) + 1 : 0]));
}
