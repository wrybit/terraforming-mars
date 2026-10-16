import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {isIProjectCard} from '../cards/IProjectCard';
import {maximumExceeded} from './requirementOutlook';

// Which hand cards go first when cards must be discarded (Jens' order, 2026-10-16):
// 1. cards whose maximum requirement is exceeded (can never be played again)
// 2. cards with negative VP that bring little
// 3. cards with little impact
// 4. attack cards whose targets do not meet the condition (they bring little now)
// 5. cards without VP
// 6. cards with VP – kept longest
// Within a group the lower card value goes first.

// Below this value (M€) a card has "little impact".
const LOW_VALUE = 3;

/** Behaviour that acts on another player (remove plants, lower production, steal resources). */
function attacksOpponents(card: ICard): boolean {
  return /"(decreaseAnyProduction|removeAnyPlants|stealResource|removeAnyResource)"/.test(JSON.stringify(card.behavior ?? {}));
}

function victoryPointsOf(card: ICard): number | undefined {
  return typeof card.victoryPoints === 'number' ? card.victoryPoints : card.victoryPoints === undefined ? undefined : 1;
}

/** Discard group 1–6 (lower goes first). */
export function discardGroup(card: ICard, player: IPlayer, value: number): number {
  const points = victoryPointsOf(card);
  if (isIProjectCard(card) && maximumExceeded(card, player)) {
    return 1;
  }
  if (points !== undefined && points < 0 && value < LOW_VALUE) {
    return 2;
  }
  if (value < LOW_VALUE && !attacksOpponents(card) && (points === undefined || points <= 0)) {
    return 3;
  }
  if (attacksOpponents(card) && value < LOW_VALUE) {
    return 4;
  }
  return points === undefined || points <= 0 ? 5 : 6;
}

/** Hand cards in discard order: group, then value. */
export function discardOrder<T extends ICard>(cards: ReadonlyArray<T>, player: IPlayer, valueOf: (card: T) => number): Array<T> {
  const keyed = cards.map((card) => ({card, value: valueOf(card), group: discardGroup(card, player, valueOf(card))}));
  return keyed.sort((a, b) => a.group - b.group || a.value - b.value).map((entry) => entry.card);
}
