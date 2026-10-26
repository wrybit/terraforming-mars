import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {isIProjectCard} from '../cards/IProjectCard';
import {energyPerAction} from './energySupply';
import {tuningOf} from './aiTuning';

// Energy-spending action cards without energy (human games: Physics Complex, Development Center, Bio Printing
// Facility, Hi-Tech Lab played with 0 energy production). energySupply (round 52) scaled only the flat action value;
// the draw value of draw actions (Development Center, Hi-Tech Lab: measured draw rates, drawPriority) still counted
// in full, and the play value kept a quarter even without any energy in sight. energyPlan (round 75, dropped) valued
// energy production by demand – the other side of the problem. energyOutlook scales the whole value of such a card
// by the energy it can expect: production now plus half of the energy production waiting in hand.

/** Share of energy production in hand that is expected to be played. */
const HAND_ENERGY_SHARE = 0.5;

function handEnergyProduction(player: IPlayer, card: ICard): number {
  let energy = 0;
  for (const handCard of player.cardsInHand) {
    if (handCard.name === card.name || !isIProjectCard(handCard)) {
      continue;
    }
    const produced = handCard.behavior?.production?.energy;
    if (typeof produced === 'number' && produced > 0) {
      energy += produced;
    }
  }
  return energy;
}

/** Share (0–1) of the action's energy the player can expect each generation, counting energy production in hand. */
export function expectedEnergyRatio(player: IPlayer, card: ICard, remaining: number): number {
  const need = energyPerAction(card);
  if (need === 0) {
    return 1;
  }
  let otherNeeds = 0;
  for (const played of player.playedCards) {
    if (played.name !== card.name) {
      otherNeeds += energyPerAction(played);
    }
  }
  const production = Math.max(0, player.production.energy + HAND_ENERGY_SHARE * handEnergyProduction(player, card) - otherNeeds);
  const supply = production + player.energy / Math.max(1, remaining);
  return Math.max(0, Math.min(1, supply / need));
}

/**
 * energyOutlook / energyDrawOutlook: the factor for the draw value of an energy-spending card (1 when both rules are
 * off or no energy is spent). energyDrawOutlook scales only this draw value – the part energySupply missed – and
 * leaves the play value as it was (energyOutlook lowered both and lost 0.5 VP in rounds 141 and 142).
 */
export function energyOutlookFactor(player: IPlayer, card: ICard, remaining: number): number {
  const tuning = tuningOf(player);
  if ((tuning.energyOutlook <= 0 && tuning.energyDrawOutlook <= 0) || energyPerAction(card) === 0) {
    return 1;
  }
  return expectedEnergyRatio(player, card, remaining);
}
