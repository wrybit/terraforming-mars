import {BoardName} from '../boards/BoardName';
import {SpaceId} from '../Types';
import {ARRAKIS_ZONES, ArrakisZone, BEHIND_WORM_BORDER} from './arrakisTerrain';
import {WORM_START_SPACES} from './wormStartSpaces';
import {ARRAKIS_LARGE_BEHIND_WORM_BORDER, ARRAKIS_LARGE_PLACE_NAMES, ARRAKIS_LARGE_WORM_START_SPACES, ARRAKIS_LARGE_ZONES} from './arrakisLargeTerrain';

/**
 * Shape and terrain of one Arrakis board. The Dune theme has two: the standard one (five spaces a side, 61 spaces like
 * Tharsis) and the large one (six a side, 91 spaces like Amazonis Planitia, scripts/make-arrakis-large.ts). Everything
 * that knows Arrakis spaces – coordinates, the worm, the war field, the mini maps – asks the layout of its game's board.
 */
export type ArrakisLayout = {
  board: BoardName,
  /** Spaces per row from the top; space ids start at 03 and run row by row */
  rowLengths: ReadonlyArray<number>,
  zones: Readonly<Record<string, ArrakisZone>>,
  /** Spaces behind the worm border (polar sink): the worm never enters them */
  behindWormBorder: ReadonlyArray<string>,
  /** Where the worm may start, chosen at random */
  wormStartSpaces: ReadonlyArray<SpaceId>,
  /** Spaces with a place name on the board (translation keys of the Dune theme) */
  placeNames: Readonly<Record<string, string>>,
};

export const ARRAKIS_LAYOUT: ArrakisLayout = {
  board: BoardName.ARRAKIS,
  rowLengths: [5, 6, 7, 8, 9, 8, 7, 6, 5],
  zones: ARRAKIS_ZONES,
  behindWormBorder: BEHIND_WORM_BORDER,
  wormStartSpaces: WORM_START_SPACES,
  placeNames: {
    '05': 'Tharsis Tholus',
    '12': 'Pavonis Mons',
    '19': 'Noctis City',
    '23': 'Ascraeus Mons',
    '36': 'Arsia Mons',
  },
};

export const ARRAKIS_LARGE_LAYOUT: ArrakisLayout = {
  board: BoardName.ARRAKIS_LARGE,
  rowLengths: [6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6],
  zones: ARRAKIS_LARGE_ZONES,
  behindWormBorder: ARRAKIS_LARGE_BEHIND_WORM_BORDER,
  wormStartSpaces: ARRAKIS_LARGE_WORM_START_SPACES as ReadonlyArray<SpaceId>,
  placeNames: ARRAKIS_LARGE_PLACE_NAMES,
};

/** The boards of the Dune theme, the standard one first */
export const ARRAKIS_BOARDS: ReadonlyArray<BoardName> = [BoardName.ARRAKIS, BoardName.ARRAKIS_LARGE];

export function isArrakisBoard(board: string | undefined): boolean {
  return (ARRAKIS_BOARDS as ReadonlyArray<string>).includes(board ?? '');
}

/** Layout of an Arrakis board; the standard one for any other board (games saved before the large board) */
export function arrakisLayout(board: string | undefined): ArrakisLayout {
  return board === BoardName.ARRAKIS_LARGE ? ARRAKIS_LARGE_LAYOUT : ARRAKIS_LAYOUT;
}
