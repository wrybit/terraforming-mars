import {IGame} from '../IGame';
import {GlobalParameter} from '../../common/GlobalParameter';

// Production phases left at the pace of the last generation. A human terraforming rush (TR rush,
// greenery spam) ended a game in generation 8 while the AI, which averages the pace over the whole
// game, still expected four more generations and kept buying engine cards.

/** Global steps raised in the last finished generation, undefined before two generation ends. */
export function stepsInLastGeneration(game: IGame): number | undefined {
  const history = game.globalsPerGeneration;
  if (!Array.isArray(history) || history.length < 2) {
    return undefined;
  }
  const before = history[history.length - 2];
  const after = history[history.length - 1];
  const delta = (parameter: GlobalParameter) => (after[parameter] ?? 0) - (before[parameter] ?? 0);
  return delta(GlobalParameter.TEMPERATURE) / 2 + delta(GlobalParameter.OXYGEN) + delta(GlobalParameter.OCEANS);
}

/** Production phases left if the table keeps raising as many steps as in the last generation. */
export function remainingAtRecentPace(game: IGame, stepsLeft: number): number | undefined {
  const recent = stepsInLastGeneration(game);
  if (recent === undefined || recent <= 0) {
    return undefined;
  }
  // The game ends after the generation in which the last step is raised.
  return Math.max(0, Math.ceil(stepsLeft / recent) - 1);
}
