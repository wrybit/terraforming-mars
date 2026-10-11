import {IPlayer} from '../IPlayer';
import {CardName} from '../../common/cards/CardName';
import {InputResponse} from '../../common/inputs/InputResponse';

// Selling a few hand cards to afford a milestone or an award this turn. Human feedback: with 1–2 M€
// missing, selling cards for the 5 VP of a milestone is often the better move. Before, the AI only
// sold cards in the last generation; in saved human games it lost 3 milestones to the opponent
// that it could have claimed this way (Mayor with 1 M€ missing and 12 cards in hand), the humans none.
//
// Offered: the cheapest cards (by their value kept for later) that just close the gap. Whether
// selling pays off is left to the search: the sale is the first action, the claim the second.

/** The money a claimable milestone or a fundable award would cost; empty when none is open. */
function claimCosts(player: IPlayer): Array<number> {
  const game = player.game;
  const costs: Array<number> = [];
  if (!game.allMilestonesClaimed() && player.milestoneCost() > 0 &&
    game.milestones.some((milestone) => !game.milestoneClaimed(milestone) && milestone.canClaim(player))) {
    costs.push(player.milestoneCost());
  }
  if (!game.allAwardsFunded() && game.getAwardFundingCost() > 0) {
    costs.push(game.getAwardFundingCost());
  }
  return costs;
}

/** Sales of the least valuable hand cards that close the gap to a milestone or award. */
export function sellToAffordResponses(player: IPlayer, handValues: ReadonlyMap<CardName, number>): Array<InputResponse> {
  const money = player.spendableMegacredits();
  const cheapest = [...player.cardsInHand].sort((a, b) => (handValues.get(a.name) ?? 0) - (handValues.get(b.name) ?? 0));
  const responses: Array<InputResponse> = [];
  const counts = new Set<number>();
  for (const cost of claimCosts(player)) {
    const missing = cost - money;
    if (missing <= 0 || missing > cheapest.length || counts.has(missing)) {
      continue;
    }
    counts.add(missing);
    responses.push({type: 'card', cards: cheapest.slice(0, missing).map((card) => card.name)});
  }
  return responses;
}
