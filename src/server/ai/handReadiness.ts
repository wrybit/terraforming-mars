import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {isIProjectCard} from '../cards/IProjectCard';
import {CardName} from '../../common/cards/CardName';
import {energyPerAction, energySupplyRatio} from './energySupply';

// Unfulfilled synergies of the hand (player feedback: a card that needs two energy should make energy a goal, one that
// needs five science tags should make science tags more important). Readiness 0..1 says how far the own position already meets what a hand card
// needs: tag requirements, energy production the card takes away when played (AI Central) and energy its action
// spends every generation (Development Center). The move search values hand cards frozen at the root, so a move that
// brings the third science tag or the second energy production looked worth nothing for the cards it unlocks; the
// readiness gained in a copy now counts a share of those cards' value (stateValue.ts handValue).

/** How far the player meets the needs of a hand card, 0 (nothing) to 1 (ready). */
export function handReadiness(player: IPlayer, card: ICard, remaining: number): number {
  let readiness = 1;
  if (isIProjectCard(card)) {
    for (const descriptor of card.requirements) {
      const tag = descriptor.tag;
      if (tag === undefined || descriptor.max === true) {
        continue;
      }
      const needed = descriptor.count ?? 1;
      readiness *= Math.min(1, player.tags.count(tag) / needed);
    }
  }
  // Energy production the card takes away when played (AI Central −1): without it the card cannot be played.
  const energyCost = -(card.behavior?.production?.energy ?? 0);
  if (typeof energyCost === 'number' && energyCost > 0) {
    readiness *= Math.min(1, player.production.energy / energyCost);
  }
  // Energy the card's action spends each generation (Development Center, Physics Complex).
  if (energyPerAction(card) > 0) {
    readiness *= energySupplyRatio(player, card, Math.max(1, remaining));
  }
  return readiness;
}

/** Readiness of every hand card at decision time (the reference the copies are compared with). */
export function handReadinessMap(player: IPlayer, remaining: number): Map<CardName, number> {
  return new Map(player.cardsInHand.map((card) => [card.name, handReadiness(player, card, remaining)]));
}
