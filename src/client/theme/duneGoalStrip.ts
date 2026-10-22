// Symbol strip of the Dune goal cards as on the goals page of the mockup (tm.baiz.org/terraforming-dune/ziele.html):
// the symbols carry the amount the goal asks for ("35 Landsraad", "8 building") or repeat it ("3 sietches").
// Keyed by the game's milestone/award name; the pictures are the Mars assets, the Dune theme swaps them (themedAsset).
// The amounts are those of the game's rules (src/server/milestones, src/server/awards).

export type GoalStripItem =
  {asset: string, count?: number, repeat?: number, production?: boolean} |
  {plus: true};

export const DUNE_GOAL_STRIPS: Readonly<Record<string, ReadonlyArray<GoalStripItem>>> = {
  // Milestones of Arrakis
  'Mayor': [{asset: 'tiles/city', repeat: 3}],
  'Gardener': [{asset: 'tiles/greenery', repeat: 3}],
  'Terraformer': [{asset: 'resources/tr', count: 35}],
  'Builder': [{asset: 'tags/building', count: 8}],
  'Planner': [{asset: 'resources/card', count: 16}],
  // Awards of Arrakis
  'Landlord': [{asset: 'tiles/city'}, {asset: 'tiles/greenery'}, {asset: 'tiles/special'}],
  'Banker': [{asset: 'resources/megacredit', production: true}],
  'Scientist': [{asset: 'tags/science'}],
  'Thermalist': [{asset: 'resources/heat'}],
  'Miner': [{asset: 'resources/titanium'}, {plus: true}, {asset: 'resources/steel'}],
  // Goals module of the Dune expansion (common/dune/duneGoals.ts)
  'Energizer': [{asset: 'resources/power', count: 6, production: true}],
  'T. Spacefarer': [{asset: 'tags/space', count: 6}],
  'Spice Lord': [{asset: 'resources/titanium', count: 3, production: true}],
  'Legend': [{asset: 'tags/event', count: 5}],
  'Ecologist': [{asset: 'tags/plant'}, {asset: 'tags/microbe'}, {asset: 'tags/animal'}],
  'A. Zoologist': [{asset: 'resources/animal'}, {plus: true}, {asset: 'resources/microbe'}],
  'Investor': [{asset: 'tags/earth'}],
  'Windtrap Magnate': [{asset: 'resources/power', production: true}],
  'Benefactor': [{asset: 'resources/tr'}],
  'Industrialist': [{asset: 'resources/steel'}, {plus: true}, {asset: 'resources/power'}],
  'Excentric': [{asset: 'resources/wild'}],
  // One milestone per module
  'Bazaar Regular': [{asset: 'tiles/special_tile_icons/commercial_district', count: 3}],
  'Sandwalker': [{asset: 'tiles/special_tile_icons/natural_preserve', count: 2}],
  'Sardaukar Commander': [{asset: 'resources/fighter', count: 3}],
  'Schemer': [{asset: 'resources/director'}],
  'CHOAM Partner': [{asset: 'dune/choam', count: 2}],
  'Smuggler King': [{asset: 'dune/smuggler', count: 3}],
};

/** Strip of a goal; undefined for goals the mockup has no strip for (the card falls back to the table symbol). */
export function duneGoalStrip(name: string): ReadonlyArray<GoalStripItem> | undefined {
  return DUNE_GOAL_STRIPS[name];
}
