import {IPlayer} from '../IPlayer';
import {CardName} from '../../common/cards/CardName';
import {CardResource} from '../../common/CardResource';

// Strategy guides: convert plants promptly, opponents' take-that cards remove what is left lying
// around, and protection (Protected Habitats) is worth paying for. The AI valued plants and animals
// as if nobody could touch them.

/** Share of the plants held at generation end that asteroid and comet cards take on average. */
const PLANT_RISK = 0.2;
const PLANT_VALUE = 1.5;
/** Opponent cards whose action removes a resource from any player, by resource type. */
const REMOVERS: ReadonlyArray<{card: CardName, resource: CardResource}> = [
  {card: CardName.PREDATORS, resource: CardResource.ANIMAL},
  {card: CardName.ANTS, resource: CardResource.MICROBE},
];
/** Animals that cannot be removed. */
const PROTECTED_CARDS: ReadonlySet<CardName> = new Set([CardName.PETS]);

function pointsPerResource(card: {victoryPoints?: unknown}): number {
  const points = card.victoryPoints;
  if (typeof points !== 'object' || points === null || !('resourcesHere' in points)) {
    return 0;
  }
  const {each = 1, per = 1} = points as {each?: number, per?: number};
  return each / per;
}

/**
 * Expected M€ that `player` loses to attacks for the rest of the game: a share of the plants he
 * holds, and the VP of resources on his collector cards that an opponent's remover takes (one per
 * generation, shared between the targets).
 */
export function expectedAttackLoss(player: IPlayer, remaining: number, victoryPoint: number): number {
  if (remaining <= 0) {
    return 0;
  }
  let loss = player.plantsAreProtected() ? 0 : player.plants * PLANT_VALUE * PLANT_RISK;
  // Protected Habitats also protects animals and microbes.
  if (player.playedCards.has(CardName.PROTECTED_HABITATS)) {
    return loss;
  }
  for (const {card: remover, resource} of REMOVERS) {
    const attackers = player.opponents.filter((opponent) => opponent.playedCards.some((card) => card.name === remover)).length;
    if (attackers === 0) {
      continue;
    }
    const targets = player.playedCards.filter((card) => card.resourceType === resource && card.resourceCount > 0 && !PROTECTED_CARDS.has(card.name));
    for (const card of targets) {
      const taken = Math.min(card.resourceCount, attackers * remaining / targets.length);
      loss += taken * pointsPerResource(card) * victoryPoint;
    }
  }
  return loss;
}
