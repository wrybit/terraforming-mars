import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {IProjectCard} from '../cards/IProjectCard';

// Buying one or two cards more than their value suggests when that makes a milestone claimable
// (Planner: 16 cards in hand). Human feedback: the AI had 15 cards and would only have needed one more
// in the research phase; the human, first in turn order, claimed Planner instead. A human would buy
// the card however bad it is: 3 M€ for a chance at 5 VP.
//
// Checked generically on the player itself: the extra cards are put into the hand for the test and
// removed again, so every milestone that counts hand cards (or anything else cards in hand change)
// is covered.

/** At most this many extra cards are bought for a milestone. */
const MAXIMUM_EXTRA = 3;

function claimableMilestones(player: IPlayer): Set<string> {
  const game = player.game;
  return new Set(game.milestones
    .filter((milestone) => !game.milestoneClaimed(milestone) && milestone.canClaim(player))
    .map((milestone) => milestone.name));
}

/**
 * Extra cards (best first among `rest`) that make a new milestone claimable after paying for all
 * bought cards; empty when none does.
 */
export function cardsForMilestone(player: IPlayer, bought: ReadonlyArray<ICard>, rest: ReadonlyArray<ICard>, buyPrice: number): Array<ICard> {
  const game = player.game;
  if (game.allMilestonesClaimed() || rest.length === 0) {
    return [];
  }
  const hand = player.cardsInHand;
  const before = hand.length;
  try {
    hand.push(...bought as Array<IProjectCard>);
    const already = claimableMilestones(player);
    for (let extra = 1; extra <= Math.min(MAXIMUM_EXTRA, rest.length); extra++) {
      hand.push(rest[extra - 1] as IProjectCard);
      const moneyLeft = player.megaCredits - buyPrice * (bought.length + extra);
      if (moneyLeft < player.milestoneCost()) {
        return [];
      }
      const now = claimableMilestones(player);
      if ([...now].some((name) => !already.has(name))) {
        return rest.slice(0, extra) as Array<ICard>;
      }
    }
    return [];
  } finally {
    hand.splice(before);
  }
}
