import {IPlayer} from '../IPlayer';
import {tuningOf} from './aiTuning';

// Human games: 53 % of human greeneries end between two or more own cities, AI 23 %. A greenery there scores for
// every adjacent own city and closes a gap that an opponent city could otherwise use (humans place 2.9 cities per
// game next to AI greeneries). The linear value per adjacent own city already exists in spaceValue.ts; this adds a
// bonus for the second and further own city, so filling the space between own cities beats extending outwards.

/** Extra VP for a greenery space that touches two or more own cities (0 = off). */
export function greeneryBetweenCitiesBonus(player: IPlayer, ownCitiesAdjacent: number): number {
  const weight = tuningOf(player).greeneryBetweenCities;
  if (weight <= 0 || ownCitiesAdjacent < 2) {
    return 0;
  }
  return weight * (ownCitiesAdjacent - 1);
}
