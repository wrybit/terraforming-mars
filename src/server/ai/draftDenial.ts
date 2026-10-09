import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {SelectCard} from '../inputs/SelectCard';
import {CardName} from '../../common/cards/CardName';
import {estimateCardValues} from './cardValue';
import {playerView, withCopy} from './gameCopy';

// Drafting: the cards not kept go to the next player. A card that is strong for them is worth
// taking away ("hate draft"), above all when the own choice is close anyway.

/** The player who receives the rest, named in the draft title ("… pass the rest to ${0}"). */
export function draftReceiver(input: SelectCard<ICard>, player: IPlayer): IPlayer | undefined {
  const title = input.title;
  if (typeof title === 'string') {
    return undefined;
  }
  for (const datum of title.data ?? []) {
    const receiver = player.game.players.find((candidate) => candidate.color === String(datum.value));
    if (receiver !== undefined && receiver !== player) {
      return receiver;
    }
  }
  return undefined;
}

/** Value of each card for the receiving player (0 when unknown). */
export function receiverValues(input: SelectCard<ICard>, player: IPlayer, cards: ReadonlyArray<ICard>): Map<CardName, number> {
  const receiver = draftReceiver(input, player);
  if (receiver === undefined) {
    return new Map();
  }
  // Valued on a copy as the drafting player sees it: the receiver's real hand is unknown to them.
  return withCopy(playerView(player), (copy) => estimateCardValues(copy.getPlayerById(receiver.id), cards));
}
