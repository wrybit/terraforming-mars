import {BoardName} from '@/common/boards/BoardName';

export type Key = {
  position: [number, number],
  // Two rows, or one row for a name that changes its length with the language
  text: [string, string] | [string],
  line?: {from: [number, number], to: [number, number]},
  secondRowX?: number,
  // Long one-row names run away from the space towards the rim
  anchor?: 'start' | 'end',
  // The text is a translation key (Arrakis: the Dune theme names the places in every language)
  translated?: true,
};

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
  // The volcanic spaces play like the Tharsis volcanoes, so they use the Tharsis keys (src/themes/dune/names/<lang>.json)
  [BoardName.ARRAKIS]: [
    // Space 06, Observatory mountain
    {text: ['Tharsis Tholus'], translated: true, anchor: 'end', position: [300, 92], line: {from: [2, -3], to: [74, 34]}},
    // Space 12, Rim wall west
    {text: ['Pavonis Mons'], translated: true, anchor: 'start', position: [480, 136], line: {from: [-2, -3], to: [-81, 31]}},
    // Space 19, Arrakeen (reserved like Noctis City)
    {text: ['Noctis City'], translated: true, anchor: 'start', position: [500, 182], line: {from: [-2, -3], to: [-77, 26]}},
    // Space 23, Mount Idaho
    {text: ['Ascraeus Mons'], translated: true, anchor: 'end', position: [128, 214], line: {from: [2, -3], to: [124, 35]}},
    // Space 36, Shield wall
    {text: ['Arsia Mons'], translated: true, anchor: 'start', position: [524, 344], line: {from: [2, -8], to: [-52, -54]}},
  ],
};
