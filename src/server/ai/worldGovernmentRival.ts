import {IPlayer} from '../IPlayer';
import {Tag} from '../../common/cards/Tag';
import {tuningOf} from './aiTuning';

// World Government terraforming (Venus Next): the copy-based valuation sees what a step does to the board and
// to the effects already on the table, but not what it unlocks in the rivals' hands – their cards are hidden.
// A player rating caught the AI raising Venus while the opponent played Morning Star Inc. Venus requirements
// are the most common hidden benefit, and a rival's Venus tags show how much he builds on them. So a Venus
// step costs a share of a point per Venus tag of the strongest rival.

/** VP share per rival Venus tag that a free Venus step is assumed to unlock in the rival's hand. */
const VENUS_UNLOCK_SHARE = 0.25;

/** Penalty in the valuation's units (victoryPoint = value of one VP) for raising Venus for free. */
export function worldGovernmentRivalPenalty(player: IPlayer, raisesVenus: boolean, victoryPoint: number): number {
  const weight = tuningOf(player).worldGovernmentRival;
  if (weight <= 0 || !raisesVenus || player.opponents.length === 0) {
    return 0;
  }
  const rivalTags = Math.max(...player.opponents.map((opponent) => opponent.tags.count(Tag.VENUS, 'raw')));
  return weight * VENUS_UNLOCK_SHARE * rivalTags * victoryPoint;
}
