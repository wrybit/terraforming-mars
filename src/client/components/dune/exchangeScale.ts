import {Resource} from '@/common/Resource';
import {ExchangeBoardModel, MAX_DEVIATION} from '@/common/dune/smugglingExchange';
import {TradeRate} from '@/common/models/PlayerInputModel';

// Rate scale under each resource tile of the smuggling trade (ExchangeScale.vue; Jens 22 Oct 2026, variant B of the
// mockup _outputs/dune-schmuggel-kurs/schmuggel-kurs.html): the five rates a good can have (normal −2 … +2), the normal
// one framed, the current one gold, better rates green and worse ones red, and in words how far the rate is from
// normal. Below the converter the deal is compared with the same deal at normal rates.

export type Mood = 'good' | 'bad' | 'normal';

/** Above normal is good when you give (more Solari for it), below normal when you get (cheaper) */
export function moodOf(rate: number, normal: number, higherIsGood: boolean): Mood {
  if (rate === normal) {
    return 'normal';
  }
  return (rate > normal) === higherIsGood ? 'good' : 'bad';
}

/** One possible rate; undefined below 1 (a rate never falls under 1 Solari) */
export type ScaleStep = {rate: number | undefined, mood: Mood, normal: boolean, current: boolean};

export type RateScale = {
  steps: ReadonlyArray<ScaleStep>,
  mood: Mood,
  /** Distance of the current rate from normal */
  deviation: number,
  /** Text for the distance (with ${0}), or the text for the normal rate */
  verdict: string,
  /** Words under the left and the right end of the scale */
  legend: readonly [string, string],
};

// Selling: the smugglers pay more or less than normal; buying: you pay less or more
const VERDICTS: Readonly<Record<'sell' | 'buy', Record<'good' | 'bad', string>>> = {
  sell: {good: '${0} above normal', bad: '${0} below normal'},
  buy: {good: '${0} cheaper than normal', bad: '${0} dearer than normal'},
};

export function rateScale(board: ExchangeBoardModel, resource: Resource, higherIsGood: boolean): RateScale {
  const normal = board.normal[resource];
  const current = board.history[board.history.length - 1][resource];
  const steps: Array<ScaleStep> = [];
  for (let offset = -MAX_DEVIATION; offset <= MAX_DEVIATION; offset++) {
    const rate = normal + offset;
    steps.push({rate: rate >= 1 ? rate : undefined, mood: moodOf(rate, normal, higherIsGood), normal: offset === 0, current: rate === current});
  }
  const mood = moodOf(current, normal, higherIsGood);
  return {
    steps,
    mood,
    deviation: Math.abs(current - normal),
    verdict: mood === 'normal' ? 'Normal rate' : VERDICTS[higherIsGood ? 'sell' : 'buy'][mood],
    legend: higherIsGood ? ['bad', 'good'] : ['good', 'bad'],
  };
}

export type NormalComparison = {
  /** The rate of the same pair at normal rates */
  normal: TradeRate,
  mood: Mood,
  /** How much less (good) or more (bad) is given than at normal rates; undefined when that is no whole number */
  difference: number | undefined,
};

/** The deal (given for received) against the same received amount at the normal rate */
export function compareWithNormal(normal: TradeRate, given: number, received: number): NormalComparison {
  const saved = received * normal.give / normal.get - given;
  const rounded = Math.round(saved);
  const whole = Math.abs(saved - rounded) < 1e-9;
  const mood: Mood = whole && rounded === 0 ? 'normal' : saved > 0 ? 'good' : 'bad';
  return {normal, mood, difference: whole ? Math.abs(rounded) : undefined};
}
