import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {isIProjectCard} from '../cards/IProjectCard';
import {CardName} from '../../common/cards/CardName';
import {energyPerAction} from './energySupply';

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
    bonus += energyEnablerShare(card, target, player) * value;
  }
  return bonus;
}

/**
 * Energy as an enabler: a card with energy production for a hand card that spends energy every generation
 * (Development Center) or takes energy production away when played (AI Central), as far as the energy is missing.
 */
function energyEnablerShare(card: ICard, target: ICard, player: IPlayer): number {
  const brought = card.behavior?.production?.energy;
  if (typeof brought !== 'number' || brought <= 0) {
    return 0;
  }
  const cost = target.behavior?.production?.energy;
  const need = energyPerAction(target) + (typeof cost === 'number' && cost < 0 ? -cost : 0);
  const missing = need - Math.max(0, player.production.energy);
  if (need === 0 || missing <= 0) {
    return 0;
  }
  return brought >= missing ? 1 : PARTIAL_SHARE * brought / missing;
}
