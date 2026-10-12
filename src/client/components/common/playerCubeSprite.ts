// Pre-rendered player cubes: contract between the generator (src/tools/make_player_cube_sprite.ts) and
// PlayerCube.vue. Small cubes in CSS 3D cost a lot of GPU time (about 20 layers with blur filters each; with
// 30+ cubes on Mars the log stutters while scrolling), so up to SPRITE_MAX_SIZE they are shown as one image
// from a sprite sheet instead. Rows: colors; columns: the top view in SPRITE_TOP_FRAMES turns, then the slight view.
import {Color} from '@/common/Color';

export const PLAYER_CUBE_SPRITE_URL = 'assets/player-cube/sprite.webp';
/** Written by the generator: hash of everything the picture depends on (see playerCubeSprite.spec.ts). */
export const PLAYER_CUBE_SPRITE_MANIFEST = 'assets/player-cube/sprite.json';

// Neutral markers share the bronze look (player_cube.less), so they share its row
export const SPRITE_ROWS: ReadonlyArray<Color> = ['red', 'green', 'yellow', 'blue', 'black', 'purple', 'orange', 'pink', 'bronze'];

/** The lighting is recalculated per turn and a cube looks the same every 90°: 0…80° in steps of 10° covers all
 (finer steps are not visible at this size, but would make the sheet much larger). */
export const SPRITE_TOP_TURN_STEP = 10;
export const SPRITE_TOP_FRAMES = 90 / SPRITE_TOP_TURN_STEP;
export const SPRITE_SLIGHT_COLUMN = SPRITE_TOP_FRAMES;
export const SPRITE_COLUMNS = SPRITE_TOP_FRAMES + 1;

/** Reflections are toned down by size and reach their minimum at this edge length: one bake fits all smaller sizes. */
export const SPRITE_MAX_SIZE = 24;
/** Edge length the sheet is rendered at, and its pixel density (sharp on 2x screens up to SPRITE_MAX_SIZE). */
export const SPRITE_RENDER_SIZE = SPRITE_MAX_SIZE;
export const SPRITE_PIXEL_RATIO = 2;
/** A cell is larger than the cube's box (1.5 × edge): the soft shadows reach beyond it. */
export const SPRITE_CELL_FACTOR = 2.5;

/** Strength of the reflections (0.2 … 1) by edge length: hard 1px lines and sharp highlights are too strong on small cubes. */
export function detailForSize(size: number): number {
  return Math.min(1, Math.max(0.2, (size - 14) / 50));
}

export type SpriteCell = {row: number, column: number};

/** Cell of a cube in the sheet, or undefined when it has to be drawn live (large, iso, own turn in slight view). */
export function spriteCellOf(color: Color, view: 'iso' | 'slight' | 'top', size: number, spin: number | undefined): SpriteCell | undefined {
  if (size > SPRITE_MAX_SIZE) {
    return undefined;
  }
  const row = SPRITE_ROWS.indexOf(color === 'neutral' ? 'bronze' : color);
  if (row < 0) {
    return undefined;
  }
  if (view === 'top') {
    const turn = (((spin ?? 0) % 90) + 90) % 90;
    return {row, column: Math.round(turn / SPRITE_TOP_TURN_STEP) % SPRITE_TOP_FRAMES};
  }
  if (view === 'slight' && spin === undefined) {
    return {row, column: SPRITE_SLIGHT_COLUMN};
  }
  return undefined;
}
