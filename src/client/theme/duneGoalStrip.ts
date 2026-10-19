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
};

/** Strip of a goal; undefined for goals the mockup has no strip for (the card falls back to the table symbol). */
export function duneGoalStrip(name: string): ReadonlyArray<GoalStripItem> | undefined {
  return DUNE_GOAL_STRIPS[name];
}
