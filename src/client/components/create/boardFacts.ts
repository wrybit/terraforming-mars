import {BoardName} from '@/common/boards/BoardName';
import {getGlobalParameterMaximums} from '@/common/boards/GlobalParameterMaximums';
import {MIN_OXYGEN_LEVEL, MIN_TEMPERATURE} from '@/common/constants';
import {translateText} from '@/client/directives/i18n';
import {duneGraphic} from '@/client/components/dune/duneGraphic';

// One step of the vegetation track is 1 %, one of the water storage (the temperature track) 2
const OXYGEN_STEP = 1;
const TEMPERATURE_STEP = 2;

// What tells the boards apart, as the detail line of their chips on "Create game" (Jens, 21 Oct 2026): oceans
// (Dune: spice fields) and the steps of the oxygen and temperature tracks (Dune: vegetation, water storage). Read
// from the maximums the game uses, so the line never drifts from the board.

export type BoardFacts = {oceans: number, oxygen: number, temperature: number};

export function boardFacts(boardName: BoardName): BoardFacts {
  const maximums = getGlobalParameterMaximums(boardName);
  return {
    oceans: maximums.oceans,
    oxygen: (maximums.oxygen - MIN_OXYGEN_LEVEL) / OXYGEN_STEP,
    temperature: (maximums.temperature - MIN_TEMPERATURE) / TEMPERATURE_STEP,
  };
}

export type BoardFact = {picture: string, value: number, label: string};

// Pictures of the three facts in each theme
const PICTURES: Record<'mars' | 'dune', {oceans: string, oxygen: string, temperature: string}> = {
  mars: {oceans: 'assets/tiles/ocean.png', oxygen: 'assets/global-parameters/oxygen.png', temperature: 'assets/global-parameters/temperature.png'},
  dune: {oceans: duneGraphic('tile-small-spicefield'), oxygen: duneGraphic('par-vegetation'), temperature: duneGraphic('par-water-storage')},
};

/** Short enough for the chip (Jens, 21 Oct 2026): a small picture and a number each, the words (in the theme's terms) as tooltip */
export function boardFactItems(boardName: BoardName, theme: 'mars' | 'dune'): Array<BoardFact> {
  const facts = boardFacts(boardName);
  const pictures = PICTURES[theme];
  return [
    {picture: pictures.oceans, value: facts.oceans, label: translateText('Oceans')},
    {picture: pictures.oxygen, value: facts.oxygen, label: translateText('Oxygen')},
    {picture: pictures.temperature, value: facts.temperature, label: translateText('Temperature')},
  ];
}
