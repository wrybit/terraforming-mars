import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {energyPerAction} from './energySupply';

// Energy production only pays as energy while something uses it: actions that spend energy
// (Ironworks, Tycho Magnetics, Teslaract …) or cards in hand that lower energy production
// (cities such as Noctis City or Underground City). Surplus energy just turns into heat.
// Rated human games showed the AI building energy it could not use (Fueled Generators without
// a consumer, a power plant standard project every generation) and spending the energy one
// action needed on another card.

/** Hand cards are not certain to be played: their energy need counts half. */
const HAND_DEMAND_SHARE = 0.5;

function productionDecrease(card: ICard, player: IPlayer): number {
  // Cards state their production either as behavior or as a production box (cities like Noctis City).
  let energy: unknown = (card.behavior?.production as {energy?: unknown} | undefined)?.energy;
  if (energy === undefined && card.productionBox !== undefined) {
    try {
      energy = card.productionBox(player).energy;
    } catch {
      energy = undefined;
    }
  }
  return typeof energy === 'number' && energy < 0 ? -energy : 0;
}

/** Energy per generation the player's actions in play and likely hand plays use. */
export function energyDemand(player: IPlayer): number {
  let demand = 0;
  for (const card of player.playedCards) {
    demand += energyPerAction(card);
  }
  for (const card of player.cardsInHand) {
    demand += HAND_DEMAND_SHARE * (energyPerAction(card) + productionDecrease(card, player));
  }
  return demand;
}

/** Energy production split into the part that is used and the surplus that only becomes heat. */
export function energyUse(player: IPlayer): {used: number, surplus: number} {
  const production = Math.max(0, player.production.energy);
  const used = Math.min(production, energyDemand(player));
  return {used, surplus: production - used};
}
