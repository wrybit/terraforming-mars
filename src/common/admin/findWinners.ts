// Same rule as on the results page (GameEnd.vue): most victory points, M€ break ties.
// Lives in common because the server (own games) and import (external games) need the same rule.

export type ScoreLine = {
  victoryPoints: number;
  megaCredits: number;
};

/** Returns the positions of all winners; several in case of a true tie. */
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
