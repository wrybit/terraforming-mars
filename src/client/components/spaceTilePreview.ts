import {Message} from '@/common/logs/Message';
import {SelectSpaceTile} from '@/common/models/PlayerInputModel';
import {TileType, tileTypeToString} from '@/common/TileType';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';

// Which tile a space selection places – as a semi-transparent preview on the selected space
// (SelectSpace.vue), for the tab color, the button and the banner above the enlarged board.
// Special tiles of cards come with the input (SelectSpaceModel.tile); otherwise only the title tells
// (e.g. "Select space for city tile", "Convert ${0} plants into greenery"); unknown titles get no preview.
export type PreviewTile = 'greenery' | 'city' | 'ocean';

// A space selection or just its title (tab buttons only know their label)
export type SpaceInput = {title: string | Message, tile?: SelectSpaceTile};
type SpaceInputOrTitle = SpaceInput | string | Message;

const TILE_PATTERNS: ReadonlyArray<[RegExp, PreviewTile]> = [
  [/greenery/i, 'greenery'],
  [/\bcity\b/i, 'city'],
  [/\bocean\b/i, 'ocean'],
];

// Tiles sent by the server that are ordinary ones; every other tile type is a card's special tile
const PLAIN_TILES: Readonly<Partial<Record<TileType, PreviewTile>>> = {
  [TileType.CITY]: 'city',
  [TileType.CAPITAL]: 'city',
  [TileType.GREENERY]: 'greenery',
  [TileType.OCEAN]: 'ocean',
};

function isSpaceInput(input: SpaceInputOrTitle): input is SpaceInput {
  return typeof input !== 'string' && 'title' in input;
}

function titleKey(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

export function previewTileForSpaceInput(input: SpaceInputOrTitle): PreviewTile | undefined {
  if (isSpaceInput(input)) {
    // A known tile wins over the title: "adjacent to a city tile" places an Industrial Center, not a city
    if (input.tile !== undefined) {
      return PLAIN_TILES[input.tile.type];
    }
    return previewTileForSpaceInput(input.title);
  }
  const key = titleKey(input);
  return TILE_PATTERNS.find(([pattern]) => pattern.test(key))?.[1];
}

// The card's special tile this selection places (brown like the special tiles), if any
export function specialTileForSpaceInput(input: SpaceInputOrTitle): SelectSpaceTile | undefined {
  if (!isSpaceInput(input) || input.tile === undefined) {
    return undefined;
  }
  return PLAIN_TILES[input.tile.type] === undefined ? input.tile : undefined;
}

// Same class as a placed tile on the board (board.less: .board-space-tile--<tile>),
// so that image crop and size match exactly
export function previewTileClass(tile: PreviewTile): string {
  return 'board-space-tile--' + tile;
}

// Action heading for the "Show Mars enlarged" button (SelectSpace.vue): says what is about to be placed
const PLACEMENT_LABELS: Readonly<Record<PreviewTile, string>> = {
  greenery: 'Place greenery',
  city: 'Place city',
  ocean: 'Place ocean',
};

export function placementLabel(tile: PreviewTile): string {
  return PLACEMENT_LABELS[tile];
}

// "Place Industrial Center": named after the card, otherwise after the tile
export function specialPlacementLabel(tile: SelectSpaceTile): string {
  return translateTextWithParams('Place ${0}', [translateText(tile.card ?? tileTypeToString[tile.type])]);
}

// Translated action for buttons: special tile, ordinary tile, or undefined when the tile is unknown
export function placementActionLabel(input: SpaceInputOrTitle): string | undefined {
  const special = specialTileForSpaceInput(input);
  if (special !== undefined) {
    return specialPlacementLabel(special);
  }
  const tile = previewTileForSpaceInput(input);
  return tile === undefined ? undefined : translateText(placementLabel(tile));
}
