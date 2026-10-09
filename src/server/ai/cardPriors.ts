import {CardName} from '../../common/cards/CardName';
import statistics from './data/bgaCardStatistics.json';

// Prior card strength from Board Game Arena top players (RuneDK93 dataset, see
// docs/ai/bot-heuristics.md §2). WAP is the placement score above the Elo expectation.

type CardStatistic = {kind: string, plays: number, winRate: number, wap: number};
const CARDS = statistics.cards as Record<string, CardStatistic>;
// Below this many plays a statistic is mostly noise.
const MINIMUM_PLAYS = 150;

/** Shrunk WAP of a card, 0 when unknown (cards of expansions not in the dataset). */
export function cardPrior(name: CardName): number {
  const statistic = CARDS[name];
  if (statistic === undefined) {
    return 0;
  }
  const reliability = Math.min(1, statistic.plays / MINIMUM_PLAYS);
  return statistic.wap * reliability;
}

/** Multiplier for a card's estimated value: 1 + weight × WAP (weight 3: ≈ 0.4 … 1.5; aiTuning.ts cardPriorWeight). */
export function cardPriorFactor(name: CardName, weight = 3): number {
  return Math.max(0.2, 1 + weight * cardPrior(name));
}
