import {IPlayer} from '../IPlayer';
import {OrOptions} from '../inputs/OrOptions';
import {InputResponse} from '../../common/inputs/InputResponse';
import {tuningOf} from './aiTuning';
import {remainingProductionPhases} from './gameProgress';

// Money flow in two-player games against humans (moneyFlow.py): the AI spent 85 M€ per game on standard projects,
// humans 55, and played 35 project cards against 50. A standard project is always available; a hand card is
// not – so while a hand card can be played, a standard project waits (it is still there later in the generation).

/** True when the move is a standard project. */
export function isStandardProject(menu: OrOptions, response: InputResponse): boolean {
  const option = response.type === 'or' ? menu.options[response.index] : undefined;
  if (option === undefined) {
    return false;
  }
  const title = typeof option.title === 'string' ? option.title : option.title.message;
  return title === 'Standard projects';
}

/** M€ a standard project gives up while a hand card is playable (standardProjectRestraint); 0 = off or last generation. */
export function standardProjectPenalty(player: IPlayer, handCardPlayable: boolean): number {
  const penalty = tuningOf(player).standardProjectRestraint;
  if (penalty <= 0 || !handCardPlayable || remainingProductionPhases(player.game, player) <= 0) {
    return 0;
  }
  return penalty;
}
