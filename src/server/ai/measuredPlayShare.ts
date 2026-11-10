import {CardName} from '../../common/cards/CardName';
import measuredPlayShareData from './data/measuredPlayShares.json';

// Share of a project card the AI ended up playing once it held it, measured in AI test batches
// (lab script measurePlayShares.py; cards with at least 40 observations, rounds 191–193). Some cards are
// bought again and again but rarely played: Stratospheric Birds 0.01, Extractor Balloons 0.16, Soil Enrichment 0.19.
// At the end of a game the AI held 6.5 cards on average, humans about 1.

const SHARES: Readonly<Record<string, number>> = measuredPlayShareData;

/** Measured share of `cardName` that got played; 1 for cards without a measurement. */
export function measuredPlayShare(cardName: string): number {
  return SHARES[cardName] ?? 1;
}

/**
 * Buying value scaled toward how often the card really gets played: `weight` 1 takes the full measured share,
 * 0.5 half of the gap to 1, 0 leaves the value as it is.
 */
export function withPlayShare(valueOf: (name: CardName) => number, weight: number): (name: CardName) => number {
  if (weight <= 0) {
    return valueOf;
  }
  return (name) => valueOf(name) * (1 - weight * (1 - measuredPlayShare(name)));
}
