import {IPlayer} from '../IPlayer';
import {IProjectCard, isIProjectCard} from '../cards/IProjectCard';
import {Tag} from '../../common/cards/Tag';
import {InputResponse} from '../../common/inputs/InputResponse';
import {playGain} from './cardValue';
import {victoryPointValue} from './gameProgress';

// Last generation: which hand cards to keep and play, which to sell. Human feedback: the AI passed with
// 15 cards in hand; selling most of them would have paid for more points. Sometimes two or three small
// cards bring more than one big one, sometimes the other way round; money left after the sale can
// still buy a point (standard project, greenery). Goal: the most points from the whole move.
//
// Every subset of the cards whose requirements are met is tried: the kept cards must be payable from
// the money plus the sale of all other cards; score = points the kept cards bring (played on a game
// copy) + the money left, valued as standard projects buy points. The best few sales are offered to
// the search, which plays them out (sale first, then the cards and projects).

/** Cards considered for keeping (best gain first); 2^12 subsets at most. */
const MAXIMUM_CANDIDATES = 12;
/** Sales offered to the search. */
const OFFERED_SALES = 3;
/** M€ per VP that money left over still buys (asteroid 14 M€ for a TR, greenery 23 M€ for about 2 VP). */
const MONEY_PER_POINT = 11;

/** Requirements met, only the money is missing: checked with plenty of money for the test. */
function requirementsMet(player: IPlayer, card: IProjectCard): boolean {
  const money = player.megaCredits;
  try {
    player.megaCredits = money + 1000;
    return player.canPlay(card);
  } finally {
    player.megaCredits = money;
  }
}

type Candidate = {card: IProjectCard, gain: number, cost: number};

/** Money a set of kept cards can use: M€ (and heat), plus steel/titanium if a kept card takes them. */
function moneyFor(player: IPlayer, kept: ReadonlyArray<Candidate>, saleIncome: number): number {
  const building = kept.some((item) => item.card.tags.includes(Tag.BUILDING));
  const space = kept.some((item) => item.card.tags.includes(Tag.SPACE));
  return player.spendableMegacredits() + saleIncome +
    (building ? player.steel * player.getSteelValue() : 0) + (space ? player.titanium * player.getTitaniumValue() : 0);
}

/** The best sales: each sells every hand card except a set of cards that the money then pays for. */
export function lastGenerationSaleResponses(player: IPlayer): Array<InputResponse> {
  const hand = player.cardsInHand.filter(isIProjectCard);
  if (hand.length === 0) {
    return [];
  }
  const candidates: Array<Candidate> = [];
  for (const card of hand) {
    if (!requirementsMet(player, card)) {
      continue;
    }
    const gain = playGain(player, card);
    if (gain !== undefined && gain > 0) {
      candidates.push({card, gain, cost: player.getCardCost(card)});
    }
  }
  candidates.sort((a, b) => b.gain - a.gain);
  const considered = candidates.slice(0, MAXIMUM_CANDIDATES);
  const moneyValue = victoryPointValue(player.game, player) / MONEY_PER_POINT;

  const scored: Array<{kept: Set<IProjectCard>, score: number}> = [];
  for (let mask = 0; mask < 1 << considered.length; mask++) {
    const kept = considered.filter((_item, index) => (mask & (1 << index)) !== 0);
    const cost = kept.reduce((sum, item) => sum + item.cost, 0);
    const money = moneyFor(player, kept, hand.length - kept.length);
    if (cost > money) {
      continue;
    }
    const score = kept.reduce((sum, item) => sum + item.gain, 0) + (money - cost) * moneyValue;
    scored.push({kept: new Set(kept.map((item) => item.card)), score});
  }
  scored.sort((a, b) => b.score - a.score);

  const responses: Array<InputResponse> = [];
  for (const {kept} of scored) {
    const sold = hand.filter((card) => !kept.has(card));
    if (sold.length > 0) {
      responses.push({type: 'card', cards: sold.map((card) => card.name)});
    }
    if (responses.length >= OFFERED_SALES) {
      break;
    }
  }
  return responses;
}
