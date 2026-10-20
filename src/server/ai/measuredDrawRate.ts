import measuredDrawRateData from './data/measuredDrawRates.json';

// Cards that human players drew per generation from a card in play, measured in two-player games against the AI
// (only rates of at least 0.5 per generation are kept). The rule-based reading of card behaviour misses several draw
// engines whose drawing runs through resources or energy (Aerial Mappers, Hi-Tech Lab, Spire, Mars Nomads …) and
// undervalues Olympus Conference (0.2 per generation read from the card, 0.9 measured).

const RATES: Readonly<Record<string, number>> = measuredDrawRateData;

/** Measured cards drawn per generation in play for `cardName`; 0 for cards without a measurement. */
export function measuredDrawRate(cardName: string): number {
  return RATES[cardName] ?? 0;
}
