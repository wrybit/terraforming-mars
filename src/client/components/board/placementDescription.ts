import {Message} from '@/common/logs/Message';
import {GameModel} from '@/common/models/GameModel';
import {Phase} from '@/common/Phase';
import {MAX_OCEAN_TILES, MAX_OXYGEN_LEVEL, MAXIMUM_HABITAT_RATE, MAXIMUM_LOGISTIC_RATE, MAXIMUM_MINING_RATE} from '@/common/constants';
import {previewTileForSpaceInput} from '@/client/components/spaceTilePreview';

// What the banner above the enlarged Mars/Moon says during a space selection (PlacementBanner.vue).
// The server only sends the title of the space selection; tile, gains and rules are derived from it here.

export type PlacementTile = 'greenery' | 'city' | 'ocean' | 'mine' | 'habitat' | 'road';

// required: hard rule · soft: "if possible" · bonus: something extra · card: special rule of the card being played
export type PlacementRuleKind = 'required' | 'soft' | 'bonus' | 'card';

export type PlacementRule = {
  kind: PlacementRuleKind,
  // Already a translation key (or the server's title message for card rules)
  text: string | Message,
};

export type PlacementGainIcon = 'oxygen' | 'tr' | 'mining-rate' | 'habitat-rate' | 'logistic-rate';

export type PlacementGain = {
  icon: PlacementGainIcon | undefined,
  // "+1" next to the icon; empty for pure text such as the ocean count
  value: string,
  label: string,
  // Parameters for the label (ocean count "3 → 4 of 9")
  labelParams?: ReadonlyArray<string>,
};

export type PlacementDescription = {
  tile: PlacementTile,
  title: string,
  gains: ReadonlyArray<PlacementGain>,
  rules: ReadonlyArray<PlacementRule>,
};

const MOON_TILE_PATTERNS: ReadonlyArray<[RegExp, PlacementTile]> = [
  [/\bmin(e|ing) tile\b/i, 'mine'],
  [/\bhabitat tile\b/i, 'habitat'],
  [/\broad tile\b/i, 'road'],
];

const TITLES: Readonly<Record<PlacementTile, string>> = {
  greenery: 'Place greenery',
  city: 'Place city',
  ocean: 'Place ocean',
  mine: 'Place mine',
  habitat: 'Place habitat',
  road: 'Place road',
};

// Titles of the ordinary placements: they get the general rules of the tile.
// Any other title comes from a card with its own rule – it is shown as that rule instead.
const STANDARD_TITLES: Readonly<Record<PlacementTile, ReadonlyArray<string>>> = {
  greenery: ['Select space for greenery tile', 'Convert ${0} plants into greenery'],
  city: ['Select space for city tile', 'Select space for city'],
  ocean: ['Select space for ocean tile', 'Select space for ocean from temperature increase', 'Select space for ocean from placement bonus',
    'Select space for first ocean', 'Select space for second ocean', 'Add an ocean'],
  mine: ['Select a space on The Moon for a mining tile.'],
  habitat: ['Select a space on The Moon for a habitat tile.'],
  road: ['Select a space on The Moon for a road tile.'],
};

const OCEAN_ADJACENCY: PlacementRule = {kind: 'bonus', text: '+2 M€ per adjacent ocean'};
const NOT_ON_OCEANS: PlacementRule = {kind: 'required', text: 'Not on ocean spaces'};
const NOT_ON_MINING_SPACES: PlacementRule = {kind: 'required', text: 'Not on mining spaces'};

const STANDARD_RULES: Readonly<Record<PlacementTile, ReadonlyArray<PlacementRule>>> = {
  greenery: [{kind: 'soft', text: 'Next to one of your tiles, if possible'}, NOT_ON_OCEANS, OCEAN_ADJACENCY],
  city: [{kind: 'required', text: 'Not next to another city'}, NOT_ON_OCEANS, OCEAN_ADJACENCY],
  ocean: [{kind: 'required', text: 'Only on ocean spaces'}, OCEAN_ADJACENCY],
  mine: [{kind: 'required', text: 'Only on mining spaces'}],
  habitat: [NOT_ON_MINING_SPACES],
  road: [NOT_ON_MINING_SPACES],
};

// Rules that always hold, also next to a card's own rule
const LASTING_RULES: Readonly<Record<PlacementTile, ReadonlyArray<PlacementRule>>> = {
  greenery: [OCEAN_ADJACENCY],
  city: [OCEAN_ADJACENCY],
  ocean: [OCEAN_ADJACENCY],
  mine: [],
  habitat: [],
  road: [],
};

export function placementTileOf(title: string | Message): PlacementTile | undefined {
  const key = typeof title === 'string' ? title : title.message;
  return MOON_TILE_PATTERNS.find(([pattern]) => pattern.test(key))?.[1] ?? previewTileForSpaceInput(title);
}

const TR: PlacementGain = {icon: 'tr', value: '+1', label: 'TR'};

function moonRateGain(rate: number | undefined, maximum: number, icon: PlacementGainIcon, label: string): Array<PlacementGain> {
  return rate !== undefined && rate < maximum ? [{icon, value: '+1', label}, TR] : [];
}

// What the tile itself brings (card effects have been applied before the placement)
function gainsOf(tile: PlacementTile, game: GameModel): Array<PlacementGain> {
  switch (tile) {
  case 'greenery':
    // Final greeneries after the last generation raise nothing any more
    return game.oxygenLevel < MAX_OXYGEN_LEVEL && game.phase !== Phase.PRODUCTION && game.phase !== Phase.END ?
      [{icon: 'oxygen', value: '+1', label: 'Oxygen'}, TR] : [];
  case 'ocean':
    if (game.oceans >= MAX_OCEAN_TILES) {
      return [];
    }
    return [TR, {icon: undefined, value: '', label: 'Oceans ${0} → ${1} of ${2}', labelParams: [String(game.oceans), String(game.oceans + 1), String(MAX_OCEAN_TILES)]}];
  case 'mine':
    return moonRateGain(game.moon?.miningRate, MAXIMUM_MINING_RATE, 'mining-rate', 'Mining rate');
  case 'habitat':
    return moonRateGain(game.moon?.habitatRate, MAXIMUM_HABITAT_RATE, 'habitat-rate', 'Habitat rate');
  case 'road':
    return moonRateGain(game.moon?.logisticRate, MAXIMUM_LOGISTIC_RATE, 'logistic-rate', 'Logistic rate');
  case 'city':
    return [];
  }
}

function rulesOf(tile: PlacementTile, title: string | Message): Array<PlacementRule> {
  const key = typeof title === 'string' ? title : title.message;
  if (STANDARD_TITLES[tile].includes(key)) {
    return [...STANDARD_RULES[tile]];
  }
  // The card's rule replaces the general ones (e.g. a city next to at least 2 cities)
  return [{kind: 'card', text: title}, ...LASTING_RULES[tile]];
}

export function describePlacement(title: string | Message, game: GameModel): PlacementDescription | undefined {
  const tile = placementTileOf(title);
  if (tile === undefined) {
    return undefined;
  }
  return {tile, title: TITLES[tile], gains: gainsOf(tile, game), rules: rulesOf(tile, title)};
}
