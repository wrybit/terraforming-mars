import {IPlayer} from '../IPlayer';
import {IAward} from '../awards/IAward';
import {Tag} from '../../common/cards/Tag';
import {CardType} from '../../common/cards/CardType';

// Award outlook from the own hand: tag awards (Scientist, Venuphile …) count tags in play, but a player who holds
// many science cards will reach a lead the board does not show yet. Human players fund Scientist early for that
// reason ("ten science tags in hand – I fund it even while behind"). Only the deciding player's own hand counts
// (no peeking at the opponent's cards); only tags are added, so every other award keeps its plain score.

/** Tags of the cards in hand that will be in play once played (events do not keep their tags). */
function handTags(player: IPlayer): Map<Tag, number> {
  const tags = new Map<Tag, number>();
  for (const card of player.cardsInHand) {
    if (card.type === CardType.EVENT) {
      continue;
    }
    for (const tag of card.tags) {
      tags.set(tag, (tags.get(tag) ?? 0) + 1);
    }
  }
  return tags;
}

/**
 * Award score of `player` if `share` of the hand's tags were in play: the award is asked about a stand-in player
 * whose tag count includes them; everything else is the real player.
 */
export function awardScoreWithHand(award: IAward, player: IPlayer, share: number): number {
  const extra = handTags(player);
  if (extra.size === 0 || share <= 0) {
    return award.getScore(player);
  }
  const realTags = player.tags;
  const tags = new Proxy(realTags, {
    get(target, property, receiver) {
      if (property === 'count') {
        return (tag: Tag, mode?: Parameters<typeof realTags.count>[1]) => target.count(tag, mode) + share * (extra.get(tag) ?? 0);
      }
      const value = Reflect.get(target, property, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  const standIn = new Proxy(player, {get: (target, property) => property === 'tags' ? tags : Reflect.get(target, property)});
  return award.getScore(standIn);
}
