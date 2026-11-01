import {IPlayer} from '../IPlayer';
import {tuningOf} from './aiTuning';

// plantHoardDecay switches "city first" off while no city is planned (a playable city card or 25 M€ now). In human
// games after that the AI placed only 8.5 % of its greeneries with more cities than greeneries (humans 52 %): mid-game
// it rarely holds 25 M€ at the moment it decides, so city first was off nearly always. With this variant the income
// of the next production phase counts as a plan too – as long as the plants are not piling up (the human game that
// led to plantHoardDecay had 61 plants).

const CITY_PROJECT_COST = 25;
/** Plants (in greeneries) up to which waiting for the next generation's city is still reasonable. */
const MAXIMUM_WAITING_GREENERIES = 2;

/** True when the money next generation pays for the city standard project and the plants are not piling up. */
export function incomeCityPlan(player: IPlayer): boolean {
  if (tuningOf(player).cityFirstWithIncome <= 0) {
    return false;
  }
  if (player.plants >= player.plantsNeededForGreenery * MAXIMUM_WAITING_GREENERIES) {
    return false;
  }
  const income = player.production.megacredits + player.terraformRating;
  return player.megaCredits + income >= CITY_PROJECT_COST;
}
