// Gleiche Regel wie auf der Ergebnisseite (GameEnd.vue): meiste Siegpunkte, bei Gleichstand entscheiden die M€.
// Liegt in common, weil Server (eigene Spiele) und Import (fremde Spiele) dieselbe Regel brauchen.

export type ScoreLine = {
  victoryPoints: number;
  megaCredits: number;
};

/** Liefert die Positionen aller Sieger; bei echtem Gleichstand mehrere. */
export function findWinnerIndexes(scores: ReadonlyArray<ScoreLine>): Array<number> {
  if (scores.length === 0) {
    return [];
  }
  const best = scores.reduce((leader, score) => isBetter(score, leader) ? score : leader);
  return scores
    .map((score, index) => ({score, index}))
    .filter(({score}) => score.victoryPoints === best.victoryPoints && score.megaCredits === best.megaCredits)
    .map(({index}) => index);
}

function isBetter(candidate: ScoreLine, leader: ScoreLine): boolean {
  if (candidate.victoryPoints !== leader.victoryPoints) {
    return candidate.victoryPoints > leader.victoryPoints;
  }
  return candidate.megaCredits > leader.megaCredits;
}
