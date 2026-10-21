import {BoardName} from '@/common/boards/BoardName';
import {getGlobalParameterMaximums} from '@/common/boards/GlobalParameterMaximums';
import {MIN_OXYGEN_LEVEL, MIN_TEMPERATURE} from '@/common/constants';
import {translateText} from '@/client/directives/i18n';
import {duneGraphic} from '@/client/components/dune/duneGraphic';

// One step of the vegetation track is 1 %, one of the water storage (the temperature track) 2
const OXYGEN_STEP = 1;
const TEMPERATURE_STEP = 2;

// What tells the two Arrakis boards apart, as the detail line of their chips on "Create game" (Jens, 21 Oct 2026):
// spice fields and the steps of the vegetation and water storage tracks. Read from the same layout and
// maximums the game uses, so the line never drifts from the board.

export type DuneBoardFacts = {spiceFields: number, vegetation: number, waterStorage: number};

export function duneBoardFacts(boardName: BoardName): DuneBoardFacts {
  const maximums = getGlobalParameterMaximums(boardName);
  return {
    spiceFields: maximums.oceans,
    vegetation: (maximums.oxygen - MIN_OXYGEN_LEVEL) / OXYGEN_STEP,
    waterStorage: (maximums.temperature - MIN_TEMPERATURE) / TEMPERATURE_STEP,
  };
}

export type DuneBoardFact = {picture: string, value: number, label: string};

/** Short enough for the chip (Jens, 21 Oct 2026): a small picture and a number each, the words as tooltip */
export function duneBoardFactItems(boardName: BoardName): Array<DuneBoardFact> {
  const facts = duneBoardFacts(boardName);
  return [
    {picture: duneGraphic('tile-small-spicefield'), value: facts.spiceFields, label: translateText('Oceans')},
    {picture: duneGraphic('par-vegetation'), value: facts.vegetation, label: translateText('Oxygen')},
    {picture: duneGraphic('par-water-storage'), value: facts.waterStorage, label: translateText('Temperature')},
  ];
}
