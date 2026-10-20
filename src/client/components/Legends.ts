import {BoardName} from '@/common/boards/BoardName';
import {ARRAKIS_91_LAYOUT, ARRAKIS_LAYOUT, ArrakisLayout} from '@/common/dune/arrakisLayout';
import {arrakisSpacePosition} from '@/common/dune/arrakisCoordinates';

export type Key = {
  position: [number, number],
  // Two rows, or one row for a name that changes its length with the language
  text: [string, string] | [string],
  line?: {from: [number, number], to: [number, number]},
  secondRowX?: number,
  // Alignment of one-row names that change their length with the language
  anchor?: 'start' | 'middle' | 'end',
  // The text is a translation key (Arrakis: the Dune theme names the places in every language)
  translated?: true,
};

// Arrakis: the volcanic spaces play like the Tharsis volcanoes, so they use the Tharsis keys (src/themes/dune/names/<lang>.json).
// Centred just below the space, between its bonus icons and those of the next row: the rings leave no margin for long
// names in every language, so no lines out to the rim. The legend layer sits 123 / 121 px off the space positions.
const LEGEND_OFFSET = {x: 123, y: 121};
function arrakisLegends(layout: ArrakisLayout): ReadonlyArray<Key> {
  return Object.entries(layout.placeNames).map(([spaceId, name]) => {
    const position = arrakisSpacePosition(layout, spaceId) ?? {x: 0, y: 0};
    return {text: [name], translated: true, anchor: 'middle', position: [position.x + LEGEND_OFFSET.x, position.y + LEGEND_OFFSET.y]};
  });
}

export const LEGENDS: Record<BoardName, ReadonlyArray<Key>> = {
  [BoardName.THARSIS]: [],
  [BoardName.HELLAS]: [],
  [BoardName.ELYSIUM]: [],
  [BoardName.ARABIA_TERRA]: [],
  [BoardName.UTOPIA_PLANITIA]: [],
  [BoardName.VASTITAS_BOREALIS_NOVA]: [],
  [BoardName.VASTITAS_BOREALIS]: [],
  [BoardName.AMAZONIS]: [],
  [BoardName.TERRA_CIMMERIA]: [],
  [BoardName.TERRA_CIMMERIA_NOVA]: [
    {text: ['Albor', 'Tholus'], position: [282, 83], line: {from: [28, 18], to: [42, 27]}},
    {text: ['MSL', 'Curiosity'], position: [120, 185], line: {from: [30, 0], to: [148, 10]}, secondRowX: -15},
    {text: ['Tyrrhenus', 'Mons'], position: [85, 225], line: {from: [40, 5], to: [65, 10]}},
    {text: ['Apollinaris', 'Mons'], position: [500, 205], line: {from: [-3, 6], to: [-50, 28]}},
    {text: ['Hadriacus', 'Mons'], position: [90, 365], line: {from: [48, -7], to: [63, -18]}},
  ],
  [BoardName.HOLLANDIA]: [],
  [BoardName.AMAZONIS_PLANITIA]: [],
  [BoardName.ARRAKIS_61]: arrakisLegends(ARRAKIS_LAYOUT),
  [BoardName.ARRAKIS_91]: arrakisLegends(ARRAKIS_91_LAYOUT),
};
