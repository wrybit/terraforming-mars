import {IGame} from '../IGame';
import {LogMessage} from '../../common/logs/LogMessage';
import {LogMessageType} from '../../common/logs/LogMessageType';
import {Phase} from '../../common/Phase';

// While the research phase runs, nobody may see how many cards the others already bought:
// the log then only says that players are still buying, and all counts appear together once everyone is done.
const COUNT_LINE = '${0} ${1} ${2} card(s)';
// Variant that names the bought cards publicly (ChooseCards with logBoughtCards)
const NAMED_LINES = new Set(['${0} bought ${1}', '${0} bought no cards']);

function isPublicPurchase(message: LogMessage): boolean {
  if (message.playerId !== undefined) {
    return false; // own private lines ("You bought …") stay with their reader
  }
  if (message.message === COUNT_LINE) {
    return message.data[1]?.value === 'bought';
  }
  return NAMED_LINES.has(message.message);
}

/** Purchase lines of the research phase still running; empty outside the research phase. */
export function openPurchaseLines(game: IGame): ReadonlySet<LogMessage> {
  const hidden = new Set<LogMessage>();
  if (game.phase !== Phase.RESEARCH) {
    return hidden;
  }
  // Only the current generation: the purchases of earlier generations are long complete
  for (let index = game.gameLog.length - 1; index >= 0; index--) {
    const message = game.gameLog[index];
    if (message.type === LogMessageType.NEW_GENERATION) {
      break;
    }
    if (isPublicPurchase(message)) {
      hidden.add(message);
    }
  }
  return hidden;
}
