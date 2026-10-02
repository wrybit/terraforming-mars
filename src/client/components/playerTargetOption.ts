import {Color} from '@/common/Color';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';

// Attacks the server sends as one option per target player instead of as a player choice
// (Sabotage, Hired Raiders, RemoveAnyPlants, StealResources, Reckless Detonation, Corporate Theft …):
// "Remove ${0} ${1} from ${2}", "Steal ${0} M€ from ${1}" etc. Only these verbs, so that options
// that merely name a player (e.g. "Pay ${0} 10 M€") don't appear as an attack on them.
const ATTACK_TITLE = /^(Remove|Steal)\b/;

// Target player of such an option; undefined for all other options
export function optionTargetPlayer(option: PlayerInputModel): Color | undefined {
  if (option.type !== 'option' || typeof option.title === 'string' || !ATTACK_TITLE.test(option.title.message)) {
    return undefined;
  }
  for (const datum of option.title.data) {
    if (datum.type === LogMessageDataType.PLAYER) {
      return datum.value;
    }
  }
  return undefined;
}
