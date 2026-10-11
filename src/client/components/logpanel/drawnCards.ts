// Cards the viewing player just drew (board bonus, card, action): the log shows them by itself,
// as if hovering over the line (LogPanel.vue). Recognised by the server's draw lines
// (LogHelper.logDrawnCards): the private "You drew …" or the public line naming this player.
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {Color} from '@/common/Color';
import {logMessageCards} from '@/client/components/logpanel/logMessageContent';

const DREW = '${0} drew ${1}';

function drawnByViewer(message: LogMessage, color: Color): boolean {
  if (message.message !== DREW || logMessageCards(message).length === 0) {
    return false;
  }
  const drawer = message.data[0];
  if (drawer === undefined) {
    return false;
  }
  return (drawer.type === LogMessageDataType.STRING && drawer.value === 'You') ||
    (drawer.type === LogMessageDataType.PLAYER && drawer.value === color);
}

/** The newest draw line of the viewing player among the new log lines, if any. */
export function latestDrawnCards(newMessages: ReadonlyArray<LogMessage>, color: Color | undefined): LogMessage | undefined {
  if (color === undefined) {
    return undefined;
  }
  return [...newMessages].reverse().find((message) => drawnByViewer(message, color));
}
