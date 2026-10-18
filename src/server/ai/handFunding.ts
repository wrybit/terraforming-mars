import {IPlayer} from '../IPlayer';
import {IProjectCard} from '../cards/IProjectCard';
import {tuningOf} from './aiTuning';

// Hand cards count with their value played now – as if the money to play them were always there. Spending 25 M€ on
// a standard project city then cost nothing but the 25 M€, even with a hand of cards that now cannot be paid for.
// Human games: from generation 9 the AI bought standard project cities while 20 hand cards waited (140–200 M€ per
// game into standard projects). Here a hand card keeps its value only while the money to play it is in sight:
// money now plus the next income. Cards beyond that count like an unknown card.

/** Money the player can spend on hand cards soon: M€, steel and titanium now plus the next income (steel and
 * titanium pay only for some cards – a deliberate simplification). */
export function handBudget(player: IPlayer): number {
  const income = Math.max(0, player.production.megacredits + player.terraformRating);
  return player.megaCredits + player.steel * player.getSteelValue() + player.titanium * player.getTitaniumValue() +
    income * tuningOf(player).handFundingGenerations;
}

/**
 * Hand value with funding: the best cards (by value) are paid from the budget first; once it runs out the rest count
 * `unfundedValue` each (at most their own value). `handFunding` mixes between the old sum (0) and this one (1).
 */
export function fundedHandValue(player: IPlayer, values: ReadonlyArray<{card: IProjectCard, value: number}>, unfundedValue: number): number {
  const full = values.reduce((sum, entry) => sum + entry.value, 0);
  const share = tuningOf(player).handFunding;
  if (share <= 0 || values.length === 0) {
    return full;
  }
  let budget = handBudget(player);
  let funded = 0;
  for (const entry of [...values].sort((a, b) => b.value - a.value)) {
    const cost = player.getCardCost(entry.card);
    if (entry.value > unfundedValue && cost <= budget) {
      budget -= cost;
      funded += entry.value;
    } else {
      funded += Math.min(entry.value, unfundedValue);
    }
  }
  return (1 - share) * full + share * funded;
}
