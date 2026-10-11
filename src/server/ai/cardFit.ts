import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {CardName} from '../../common/cards/CardName';
import {CardType} from '../../common/cards/CardType';
import cardFitData from './data/bgaCardFit.json';

// How well a card fits the direction the own game has taken. Every game develops a flow – lots of
// terraforming, many cards, animals and plants, Jovian tags … – and many cards are good or bad only
// relative to it. Strong players see the direction already in the opening (corporation, preludes,
// the ten offered cards) and then keep it, adjusting only slightly with every card they get, so that
// an engine pulling one way builds up instead of changing course again and again.
//
// The fit is learned, not written down: in 1,556 games of the 25 best Board Game Arena players
// (RuneDK93 dataset, MIT) the log lift of every card pair says how much more often than expected the
// two end up in the same tableau (Io Mining Industries with Water Import From Europa +0.79, with
// Ecoline −1.08). A card's fit is the weighted mean lift to the cards that set the direction.

const FIT = (cardFitData as {fit: Record<string, Record<string, number>>}).fit;

/** How strongly a card sets the direction: the corporation most, then preludes, played cards, the hand. */
export const DIRECTION_WEIGHT = {corporation: 3, prelude: 1.5, played: 1, hand: 0.5} as const;
/** Weight of direction-setting cards at which the flow counts fully (an opening already reaches it). */
const CLEAR_FLOW_WEIGHT = 8;
const MAX_FIT = 0.6;

export type DirectionCard = {name: CardName, weight: number};

/** Weighted mean log lift of `card` to the direction cards, scaled by how clear the direction is (0 without data). */
export function fitTo(card: CardName, direction: ReadonlyArray<DirectionCard>): number {
  if (FIT[card] === undefined) {
    return 0;
  }
  let sum = 0;
  let weight = 0;
  for (const entry of direction) {
    if (entry.name === card || FIT[entry.name] === undefined) {
      continue;
    }
    sum += entry.weight * (FIT[entry.name][card] ?? 0);
    weight += entry.weight;
  }
  if (weight === 0) {
    return 0;
  }
  const clarity = Math.min(1, weight / CLEAR_FLOW_WEIGHT);
  return Math.max(-MAX_FIT, Math.min(MAX_FIT, sum / weight * clarity));
}

function weightOf(card: ICard): number {
  if (card.type === CardType.CORPORATION) {
    return DIRECTION_WEIGHT.corporation;
  }
  return card.type === CardType.PRELUDE ? DIRECTION_WEIGHT.prelude : DIRECTION_WEIGHT.played;
}

/** The direction of a player's game: played cards (corporation and preludes heavier) and the hand. */
export function directionOf(player: IPlayer): Array<DirectionCard> {
  return [
    ...Array.from(player.playedCards, (card) => ({name: card.name, weight: weightOf(card)})),
    ...player.cardsInHand.map((card) => ({name: card.name, weight: DIRECTION_WEIGHT.hand})),
  ];
}

/** Fit of `card` to the flow of the player's own game. */
export function flowFit(player: IPlayer, card: CardName): number {
  return fitTo(card, directionOf(player));
}

/**
 * Card values of one opening (corporation + preludes + the offered cards) with their fit to each other:
 * the opening already shows where the game is heading, so cards that pull the same way are worth more.
 * Only positive values are scaled; a card that is bad anyway stays bad.
 */
export function withOpeningFit(valueOf: (name: CardName) => number, weight: number,
  corporation: CardName, preludes: ReadonlyArray<CardName>, projects: ReadonlyArray<CardName>): (name: CardName) => number {
  const direction: Array<DirectionCard> = [
    {name: corporation, weight: DIRECTION_WEIGHT.corporation},
    ...preludes.map((name) => ({name, weight: DIRECTION_WEIGHT.prelude})),
    ...projects.map((name) => ({name, weight: DIRECTION_WEIGHT.hand})),
  ];
  const cache = new Map<CardName, number>();
  return (name) => {
    let value = cache.get(name);
    if (value === undefined) {
      const base = valueOf(name);
      value = base > 0 ? base * Math.max(0.5, 1 + weight * fitTo(name, direction)) : base;
      cache.set(name, value);
    }
    return value;
  };
}
