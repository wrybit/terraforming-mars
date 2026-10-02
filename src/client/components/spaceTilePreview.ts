import {Message} from '@/common/logs/Message';

// Which tile a space selection places – as a semi-transparent preview on the selected space
// (SelectSpace.vue). The server provides no field for this, only the title (e.g. "Select space for city tile",
// "Convert ${0} plants into greenery"); unknown titles get no preview.
export type PreviewTile = 'greenery' | 'city' | 'ocean';

const TILE_PATTERNS: ReadonlyArray<[RegExp, PreviewTile]> = [
  [/greenery/i, 'greenery'],
  [/\bcity\b/i, 'city'],
  [/\bocean\b/i, 'ocean'],
];

export function previewTileForSpaceInput(title: string | Message): PreviewTile | undefined {
  const key = typeof title === 'string' ? title : title.message;
  return TILE_PATTERNS.find(([pattern]) => pattern.test(key))?.[1];
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
