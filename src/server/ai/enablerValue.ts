import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {isIProjectCard} from '../cards/IProjectCard';
import {CardName} from '../../common/cards/CardName';

// A card that brings the tags a strong hand card still needs (e.g. the third science tag for a
// card that requires three) is worth part of that card's value – the group calls this a
// "Bedingungsgehilfe". Completing a requirement counts fully, a partial step proportionally.

const PARTIAL_SHARE = 0.4;

export function enablerBonus(card: ICard, player: IPlayer, handValues: ReadonlyMap<CardName, number>): number {
  let bonus = 0;
  for (const target of player.cardsInHand) {
    if (target.name === card.name || !isIProjectCard(target)) {
      continue;
    }
    const value = handValues.get(target.name) ?? 0;
    if (value <= 0) {
      continue;
    }
    for (const descriptor of target.requirements) {
      const tag = descriptor.tag;
      if (tag === undefined || descriptor.max === true) {
        continue;
      }
      const needed = (descriptor.count ?? 1) - player.tags.count(tag);
      const brought = card.tags.filter((cardTag) => cardTag === tag).length;
      if (needed <= 0 || brought === 0) {
        continue;
      }
      bonus += brought >= needed ? value : value * PARTIAL_SHARE * brought / needed;
    }
  }
  return bonus;
}
