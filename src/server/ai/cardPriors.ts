import {CardName} from '../../common/cards/CardName';
import statistics from './data/bgaCardStatistics.json';
import draftStatistics from './data/bgaTwoPlayerDraft.json';

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

const CORPORATIONS = (draftStatistics as {corporations?: Record<string, number>}).corporations ?? {};

/** Wins above the Elo expectation of a corporation in two-player BGA games, in % points (UNMI −6.6, Ecoline +2.7). */
export function corporationPrior(name: CardName): number {
  return CORPORATIONS[name] ?? 0;
}

type DraftStrength = {early?: number, middle?: number, late?: number};
const DRAFT = draftStatistics.cards as Record<string, DraftStrength>;

/**
 * How strongly two-player BGA players prefer a card in the draft at this point of the game, in
 * standard deviations (about −3 … +3, 0 when unknown). Picks show what players want, not what
 * winners could afford: Research Outpost +2.5 early, Security Fleet −2.
 */
export function draftPrior(name: CardName, generation: number): number {
  const strength = DRAFT[name];
  if (strength === undefined) {
    return 0;
  }
  const value = generation <= 3 ? strength.early : generation <= 6 ? strength.middle : strength.late;
  return Math.max(-3, Math.min(3, value ?? 0));
}

/**
 * Multiplier for a card's estimated value: 1 + weight × WAP (weight 3: ≈ 0.4 … 1.5; aiTuning.ts
 * cardPriorWeight) + draftWeight × 0.1 × draft preference (aiTuning.ts draftPriorWeight).
 */
export function cardPriorFactor(name: CardName, weight = 3, draftWeight = 0, generation = 1): number {
  const draft = draftWeight > 0 ? draftWeight * 0.1 * draftPrior(name, generation) : 0;
  return Math.max(0.2, 1 + weight * cardPrior(name) + draft);
}
