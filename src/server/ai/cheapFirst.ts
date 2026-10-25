import {IPlayer} from '../IPlayer';
import {CardName} from '../../common/cards/CardName';
import {tuningOf} from './aiTuning';
import {remainingProductionPhases} from './gameProgress';

// Humans play the cheap cards of a generation first and the expensive ones later (Oracle two-player games,
// cardPlayProfile.py): the chosen card's cost rank among the playable cards is 0.18–0.32 for humans (0 = cheapest,
// 1 = most expensive), 0.46–0.53 for the AI, which took the most expensive playable card in 25–33 % of its card
// plays (humans 1–6 %). An expensive card first leaves no money for the others; cheap ones first keep options open.

/**
 * cheapFirst: M€ a card play gives up per M€ it costs more than the cheapest playable hand card; 0 when the rule is
 * off, in the last generation (everything left is played anyway) or for the cheapest card itself.
 */
export function cheapFirstPenalty(player: IPlayer, card: CardName, playable: ReadonlySet<CardName>): number {
  const weight = tuningOf(player).cheapFirst;
  if (weight <= 0 || playable.size < 2 || remainingProductionPhases(player.game, player) <= 0) {
    return 0;
  }
  const costOf = (name: CardName) => {
    const handCard = player.cardsInHand.find((candidate) => candidate.name === name);
    return handCard === undefined ? undefined : player.getCardCost(handCard);
  };
  const cost = costOf(card);
  const costs = [...playable].map(costOf).filter((value): value is number => value !== undefined);
  if (cost === undefined || costs.length < 2) {
    return 0;
  }
  return weight * Math.max(0, cost - Math.min(...costs));
}
