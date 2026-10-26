import {PlayerInput} from '../PlayerInput';
import {InputResponse} from '../../common/inputs/InputResponse';
import {SelectOption} from '../inputs/SelectOption';
import {SelectStandardProjectToPlay} from '../inputs/SelectStandardProjectToPlay';
import {Warning} from '../../common/cards/Warning';

// Moves that do nothing but spend own resources: converting heat at maximum temperature, the asteroid, aquifer or
// air scrapping standard project once its parameter is maxed. The game still offers them (with a "max" warning).
// Statically they are worth less than doing nothing, but the lookahead plays a pass on to the end of the
// generation (the opponent's remaining moves) and other moves not, so in a human game the AI converted 8 heat 13
// times at +8 °C instead of passing. They are dropped before the lookahead: a direct check, no simulation.

/** Warnings that mean the move's only effect – one step of a global parameter – no longer happens. */
const NO_EFFECT_WARNINGS: ReadonlyArray<Warning> = ['maxtemp', 'maxoceans', 'maxvenus'];

function hasNoEffectWarning(warnings: Iterable<Warning> | undefined): boolean {
  if (warnings === undefined) {
    return false;
  }
  for (const warning of warnings) {
    if (NO_EFFECT_WARNINGS.includes(warning)) {
      return true;
    }
  }
  return false;
}

/** True for a move of the action menu that only spends resources (see above). */
export function isUselessMove(option: PlayerInput, response: InputResponse): boolean {
  // Standard actions (convert heat): the warning sits on the option itself.
  if (option instanceof SelectOption) {
    return hasNoEffectWarning(option.warnings);
  }
  // Standard projects whose whole effect is the maxed parameter (the greenery project keeps its tile and VP:
  // its oxygen warning is not in the list).
  if (option instanceof SelectStandardProjectToPlay && response.type === 'projectCard') {
    const card = option.cards.find((candidate) => candidate.name === response.card);
    return card !== undefined && hasNoEffectWarning(card.warnings);
  }
  return false;
}
