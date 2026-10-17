import {CardName} from '../../common/cards/CardName';
import tierList from './data/tierListConsensus.json';

// How experienced players rank a project card: consensus of three community tier lists (S … F, all project cards incl.
// expansions), each list standardized, then averaged. Higher = better card in general, in standard deviations
// (about −2 … +2, 0 when unknown). Covers Venus, promo and Pathfinders cards that the BGA statistics miss.
const SCORES = tierList.cards as Record<string, number>;

export function tierListScore(name: CardName): number {
  return SCORES[name] ?? 0;
}
