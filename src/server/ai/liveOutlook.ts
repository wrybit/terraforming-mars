import {IPlayer} from '../IPlayer';
import {CardName} from '../../common/cards/CardName';
import {isIProjectCard} from '../cards/IProjectCard';
import {requirementOutlook} from './requirementOutlook';
import {tuningOf} from './aiTuning';

// Hand card values are computed once per decision and include the outlook of their requirements (requirementOutlook.ts):
// AI Central with no science tag counts 40 %. In the move search that value stayed frozen, so a move that brings the
// requirement closer (a science tag, energy production, a step of oxygen) did not raise the value of the hand card it
// unlocks – the AI never worked towards its own cards' requirements. Measured on a test hand: two science tags raise
// the hand value of AI Central, Quantum Extractor, Mass Converter and Gene Repair by about 130 M€.

// Below this outlook the value at decision time says too little about the card to scale it up.
const MINIMUM_OUTLOOK = 0.1;

/** Requirement outlook of the hand cards at decision time (only cards whose requirements are not yet certain). */
export function handOutlookMap(player: IPlayer): Map<CardName, number> | undefined {
  if (tuningOf(player).liveOutlook <= 0) {
    return undefined;
  }
  const outlooks = new Map<CardName, number>();
  for (const card of player.cardsInHand) {
    if (isIProjectCard(card)) {
      const outlook = requirementOutlook(card, player);
      if (outlook < 1) {
        outlooks.set(card.name, outlook);
      }
    }
  }
  return outlooks;
}

/**
 * liveOutlook: a hand card's value scaled by how much its requirement outlook changed since the decision
 * (value at decision × outlook now ÷ outlook then). 1 for cards whose requirements were certain or without the rule.
 */
export function outlookChange(player: IPlayer, name: CardName, reference: ReadonlyMap<CardName, number> | undefined): number {
  const before = reference?.get(name);
  if (before === undefined) {
    return 1;
  }
  const card = player.cardsInHand.find((next) => next.name === name);
  if (card === undefined || !isIProjectCard(card)) {
    return 1;
  }
  const weight = tuningOf(player).liveOutlook;
  const ratio = requirementOutlook(card, player) / Math.max(MINIMUM_OUTLOOK, before);
  return 1 + weight * (ratio - 1);
}
