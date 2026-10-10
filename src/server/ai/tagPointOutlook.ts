import {IPlayer} from '../IPlayer';
import {Tag} from '../../common/cards/Tag';

// Cards that score per tag (Water Import From Europa, Ganymede Colony, Io Mining Industries: 1 VP per
// Jovian tag) were valued with today's tags. A human player stacked Jovian tags on purpose and scored
// 7–8 VP with each of them (two test games, 2026-10-10: card VP 60 : 19 and 81 : 12). The tags still
// to come count too: those in hand and the own pace of the past generations.

/** Share of the tagged cards in hand that typically get played. */
const HAND_PLAY_SHARE = 0.5;

function tagScoring(card: {victoryPoints?: unknown}): {tag: Tag, each: number, per: number} | undefined {
  const points = card.victoryPoints;
  if (typeof points !== 'object' || points === null || !('tag' in points)) {
    return undefined;
  }
  const {tag, each = 1, per = 1} = points as {tag: Tag, each?: number, per?: number};
  return {tag, each, per};
}

/** Tags of this kind the player will probably still get before the game ends. */
function futureTags(player: IPlayer, tag: Tag, remaining: number): number {
  const inHand = player.cardsInHand.filter((card) => card.tags.includes(tag)).length;
  const pace = player.tags.count(tag, 'raw') / Math.max(1, player.game.generation - 1);
  return inHand * HAND_PLAY_SHARE + pace * remaining;
}

/** VP the played per-tag cards will still gain from tags to come. */
export function futureTagPoints(player: IPlayer, remaining: number): number {
  let points = 0;
  for (const card of player.playedCards) {
    const scoring = tagScoring(card);
    if (scoring !== undefined) {
      points += futureTags(player, scoring.tag, remaining) * scoring.each / scoring.per;
    }
  }
  return points;
}
