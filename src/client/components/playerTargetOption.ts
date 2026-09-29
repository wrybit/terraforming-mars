import {Color} from '@/common/Color';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';

// Angriffe, die der Server als eine Option je Zielspieler schickt statt als Spielerwahl
// (Sabotage, Hired Raiders, RemoveAnyPlants, StealResources, Reckless Detonation, Corporate Theft …):
// "Remove ${0} ${1} from ${2}", "Steal ${0} M€ from ${1}" usw. Nur diese Verben, damit Optionen,
// die einen Spieler bloß nennen (z. B. "Pay ${0} 10 M€"), nicht als Angriff auf ihn erscheinen.
const ATTACK_TITLE = /^(Remove|Steal)\b/;

// Zielspieler einer solchen Option; undefined für alle anderen Optionen
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
