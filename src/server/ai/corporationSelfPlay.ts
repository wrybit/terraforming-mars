import {CardName} from '../../common/cards/CardName';
import statistics from './data/corporationSelfPlay.json';

// Correction of the corporation choice learned from AI-only test batches.
// The value of a corporation is measured by playing it on a game copy: starting money and
// resources show up in full, effects that pay off over many generations (Tharsis Republic,
// Saturn Systems) hardly. In 300 test games the AI took Interplanetary Cinematics 105 times and
// won 22 (40 expected), Tharsis Republic won 57 of 69 (29 expected).

type CorporationStatistic = {plays: number, wins: number, expectedWins: number};
const CORPORATIONS = statistics.corporations as Record<string, CorporationStatistic>;
// Few games say little: the edge is shrunk towards 0 as if this many neutral games were added.
const SHRINK_GAMES = 30;
// M€ per unit of edge (wins above expectation per game).
const MEGACREDITS_PER_EDGE = 60;

/** M€ to add to a corporation's estimated value (negative for corporations the AI plays badly). */
export function corporationSelfPlayBonus(name: CardName): number {
  const statistic = CORPORATIONS[name];
  if (statistic === undefined || statistic.plays === 0) {
    return 0;
  }
  const edge = (statistic.wins - statistic.expectedWins) / statistic.plays;
  return MEGACREDITS_PER_EDGE * edge * statistic.plays / (statistic.plays + SHRINK_GAMES);
}
