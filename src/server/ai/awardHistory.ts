import {IGame} from '../IGame';

// Award scores per generation, as a human watches them grow: Daniel's Banker score stayed at 3 for
// eight generations and then rose by 8 every two generations. The average pace since the start
// (stateValue.ts projectedAwardScore) missed that; the AI funded Banker with 19 : 7 and lost 22 : 33.
// Kept in memory only (public information; after a restart the history starts again).

const MAXIMUM_GAMES = 200;

// game id → "award|player id" → score at the first decision of each generation
const historyByGame = new Map<string, Map<string, Map<number, number>>>();

/** Records the current scores of all funded awards (call on the real game, not on copies). */
export function recordAwardScores(game: IGame): void {
  if (game.fundedAwards.length === 0) {
    return;
  }
  let history = historyByGame.get(game.id);
  if (history === undefined) {
    if (historyByGame.size >= MAXIMUM_GAMES) {
      const oldest = historyByGame.keys().next().value;
      if (oldest !== undefined) {
        historyByGame.delete(oldest);
      }
    }
    history = new Map();
    historyByGame.set(game.id, history);
  }
  for (const {award} of game.fundedAwards) {
    for (const player of game.players) {
      const key = `${award.name}|${player.id}`;
      const scores = history.get(key) ?? new Map<number, number>();
      if (!scores.has(game.generation)) {
        scores.set(game.generation, award.getScore(player));
      }
      history.set(key, scores);
    }
  }
}

/** Score growth per generation over the last (up to) two recorded generations, undefined without history. */
export function recentAwardGrowth(gameId: string, awardName: string, playerId: string, generation: number, score: number): number | undefined {
  const scores = historyByGame.get(gameId)?.get(`${awardName}|${playerId}`);
  if (scores === undefined) {
    return undefined;
  }
  for (const back of [2, 1]) {
    const past = scores.get(generation - back);
    if (past !== undefined) {
      return (score - past) / back;
    }
  }
  return undefined;
}
