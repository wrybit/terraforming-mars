import collectorRateData from './data/collectorRates.json';

// How many resources a collector card (Birds, Pets, Decomposers …) really gains per generation once
// played, measured in AI self-play. The flat assumption of one per generation overvalued slow
// collectors (Tardigrades with its 4-per-VP rate looked as good as a card that triggers on every
// greenery) and undervalued trigger collectors like Herbivores.

const RATES: Readonly<Record<string, number>> = (collectorRateData as {rates: Record<string, number>}).rates;
const DEFAULT_RATE = 1;

/** Resources per generation for `cardName`; 1 for cards without a measurement. */
export function collectorRate(cardName: string): number {
  return RATES[cardName] ?? DEFAULT_RATE;
}
