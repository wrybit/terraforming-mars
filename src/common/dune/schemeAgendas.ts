// Module B – House schemes: the 24 secret agendas (source: mockup data/scheme-agendas.js).
// Each agenda has three levels: easy 3 VP, medium 5 VP, hard 8 VP; at game end only the highest level reached counts.
// Hard = Jens' targets; medium ≈ ¾ and easy ≈ ½ of them, never below the BGA median of 51 269 games.
// Only conditions of the base game: tiles, production, tags, TR, played cards.

export type SchemeMeasure =
  'tilesNextToOceans' | 'greeneries' | 'cities' | 'largestTileGroup' | 'specialTilesWithOwnNeighbour' | 'rowsWithOwnTile' |
  'titaniumProduction' | 'steelProduction' | 'steelAndTitaniumProduction' | 'plantProduction' | 'energyProduction' |
  'heatProduction' | 'megacreditProduction' | 'terraformRating' | 'spaceTags' | 'scienceTags' | 'buildingTags' |
  'earthTags' | 'jovianTags' | 'powerTags' | 'microbeAndAnimalTags' | 'tagKindsWithThree' | 'events' | 'projectCards';

export type SchemeAgenda = {
  /** English name, also the translation key */
  name: string,
  /** What is counted (English, translated on display) */
  goal: string,
  measure: SchemeMeasure,
  /** Targets of easy, medium, hard */
  targets: [number, number, number],
  /** Picture (assets/themes/dune/graphics) */
  icon: string,
};

export const SCHEME_LEVEL_POINTS: ReadonlyArray<number> = [3, 5, 8];

/** Names of the three levels (translation keys), as on the agenda cards */
export const SCHEME_LEVEL_LABELS = ['Easy', 'Medium', 'Hard'] as const;

/** A player reaching this TR makes everybody give up one of their two agendas */
export const SCHEME_REDUCTION_TR = 35;

export const SCHEME_AGENDAS: ReadonlyArray<SchemeAgenda> = [
  {name: 'Lord of the Reserves', goal: 'own tiles next to oceans', measure: 'tilesNextToOceans', targets: [5, 8, 10], icon: 'tile-spicefield'},
  {name: 'Green Dream', goal: 'own greeneries', measure: 'greeneries', targets: [9, 13, 18], icon: 'tile-planting'},
  {name: 'League of Sietches', goal: 'own cities', measure: 'cities', targets: [5, 7, 10], icon: 'tile-sietch'},
  {name: 'Desert Chain', goal: 'own tiles connected', measure: 'largestTileGroup', targets: [10, 15, 20], icon: 'tile-planting'},
  {name: 'Keeper of Wonders', goal: 'special tiles with an own neighbour', measure: 'specialTilesWithOwnNeighbour', targets: [3, 4, 5], icon: 'tile-special'},
  {name: 'Rim to Rim', goal: 'rows A–I with an own tile', measure: 'rowsWithOwnTile', targets: [5, 7, 9], icon: 'tile-sietch'},
  {name: 'Spice Baron', goal: 'titanium production', measure: 'titaniumProduction', targets: [5, 7, 10], icon: 'res-spice'},
  {name: 'Plasteel Magnate', goal: 'steel production', measure: 'steelProduction', targets: [6, 9, 12], icon: 'res-plasteel'},
  {name: 'Double Industry', goal: 'steel and titanium production', measure: 'steelAndTitaniumProduction', targets: [9, 13, 18], icon: 'special-mining-area'},
  {name: 'Botanist of Arrakis', goal: 'plant production', measure: 'plantProduction', targets: [12, 17, 23], icon: 'res-plant'},
  {name: 'Dew Gatherer', goal: 'energy production', measure: 'energyProduction', targets: [6, 9, 12], icon: 'res-moisture'},
  {name: 'Water Master', goal: 'heat production', measure: 'heatProduction', targets: [6, 9, 12], icon: 'res-water'},
  {name: 'Treasurer', goal: 'M€ production', measure: 'megacreditProduction', targets: [25, 35, 50], icon: 'coin'},
  {name: 'Imperial Favour', goal: 'TR', measure: 'terraformRating', targets: [48, 56, 64], icon: 'res-landsraad'},
  {name: 'Friend of the Guild', goal: 'space tags', measure: 'spaceTags', targets: [6, 9, 12], icon: 'tag-space'},
  {name: 'Ixian Inventor', goal: 'science tags', measure: 'scienceTags', targets: [8, 12, 16], icon: 'tag-science'},
  {name: 'Builder of Carthag', goal: 'building tags', measure: 'buildingTags', targets: [12, 18, 24], icon: 'tag-building'},
  {name: 'Envoy of the Empire', goal: 'Earth tags', measure: 'earthTags', targets: [5, 7, 10], icon: 'tag-earth'},
  {name: 'Offworld Trader', goal: 'Jovian tags', measure: 'jovianTags', targets: [4, 6, 8], icon: 'tag-jovian'},
  {name: 'Wind Catcher', goal: 'power tags', measure: 'powerTags', targets: [5, 7, 10], icon: 'tag-power'},
  {name: 'Life in the Sand', goal: 'microbe and animal tags', measure: 'microbeAndAnimalTags', targets: [5, 7, 10], icon: 'tag-microbe'},
  {name: 'Diversity of Houses', goal: 'kinds of tags with 3 each', measure: 'tagKindsWithThree', targets: [4, 6, 8], icon: 'tag-wild'},
  {name: 'Schemer', goal: 'played events', measure: 'events', targets: [8, 11, 15], icon: 'tag-event'},
  {name: 'Archivist', goal: 'played project cards', measure: 'projectCards', targets: [40, 52, 64], icon: 'res-card'},
];

const AGENDA_BY_NAME = new Map(SCHEME_AGENDAS.map((agenda) => [agenda.name, agenda]));

export function schemeAgenda(name: string): SchemeAgenda {
  const agenda = AGENDA_BY_NAME.get(name);
  if (agenda === undefined) {
    throw new Error(`Unknown scheme agenda ${name}`);
  }
  return agenda;
}

/** Highest level reached (0 none, 1 easy, 2 medium, 3 hard) */
export function schemeLevel(agenda: SchemeAgenda, value: number): number {
  return agenda.targets.filter((target) => value >= target).length;
}

export function schemePoints(level: number): number {
  return level === 0 ? 0 : SCHEME_LEVEL_POINTS[level - 1];
}
