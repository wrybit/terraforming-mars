import {Message} from '@/common/logs/Message';

// Welches Plättchen eine Feldauswahl platziert – als halbtransparente Vorschau auf dem gewählten Feld
// (SelectSpace.vue). Der Server liefert dafür kein eigenes Feld, nur den Titel (z. B. "Select space for city tile",
// "Convert ${0} plants into greenery"); unbekannte Titel bekommen keine Vorschau.
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

// Gleiche Klasse wie ein gelegtes Plättchen auf dem Brett (board.less: .board-space-tile--<tile>),
// damit Bildausschnitt und Größe exakt übereinstimmen
export function previewTileClass(tile: PreviewTile): string {
  return 'board-space-tile--' + tile;
}
