export type TileView = 'show' | 'hide' | 'coords';

const nextView: Record<TileView, TileView> = {
  'show': 'hide',
  'hide': 'coords',
  'coords': 'show',
} as const;

// Tiles and cubes stay visible in the coordinates view: it only adds the labels, so you can still talk about the board
export function showsTiles(tileView: TileView): boolean {
  return tileView !== 'hide';
}

export function nextTileView(tileView: TileView): TileView {
  return nextView[tileView];
}
