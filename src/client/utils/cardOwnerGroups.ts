import {Color} from '@/common/Color';
import {CardModel} from '@/common/models/CardModel';
import {playersInTurnOrder} from '@/client/utils/playersInTurnOrder';

export type CardOwner = {
  name: string;
  color: Color;
};

export type CardOwnerGroup = {
  // undefined: cards without a known owner (or a list that doesn't show owners) – no heading
  owner: CardOwner | undefined;
  cards: Array<CardModel>;
};

/*
 * Cards of several players (e.g. "remove 1 microbe from any card") as one group per player, so the owner is a
 * heading above the group instead of a small label squeezed onto every card. Opponents first in turn order,
 * the own cards last (playersInTurnOrder.ts); the card order within a group stays as given.
 */
export function cardOwnerGroups(
  cards: ReadonlyArray<CardModel>,
  ownerOf: (card: CardModel) => CardOwner | undefined,
  players: ReadonlyArray<CardOwner>,
  ownColor: Color | undefined,
): Array<CardOwnerGroup> {
  const groups: Array<CardOwnerGroup> = playersInTurnOrder(players, ownColor).map((owner) => ({owner, cards: []}));
  const unknown: CardOwnerGroup = {owner: undefined, cards: []};
  for (const card of cards) {
    const color = ownerOf(card)?.color;
    (groups.find((group) => group.owner?.color === color) ?? unknown).cards.push(card);
  }
  return [...groups, unknown].filter((group) => group.cards.length > 0);
}
