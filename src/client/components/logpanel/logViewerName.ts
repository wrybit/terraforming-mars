import {Color} from '@/common/Color';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageData} from '@/common/logs/LogMessageData';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';

// The log names every player, also in the own private lines ("Jens drew …", never "You drew …").
// The server logs it that way; lines saved earlier still say "You" – they get the viewer's name here.

// Earlier own forms -> named form (one placeholder more: the player in front)
const OWN_TO_NAMED: Record<string, string> = {
  'You kept ${0}': '${0} kept ${1}',
  'You bought ${0}': '${0} bought ${1}',
  'You bought no cards': '${0} bought no cards',
  'You discarded ${0}': '${0} discarded ${1}',
  'You drafted ${0}': '${0} drafted ${1}',
  'You drafted ${0}, passing ${1} to ${2}': '${0} drafted ${1}, passing ${2} to ${3}',
  'You drew and discarded ${0}': '${0} drew and discarded ${1}',
};

function isYou(datum: LogMessageData | undefined): boolean {
  return datum?.type === LogMessageDataType.STRING && datum.value === 'You';
}

/** The line with the viewer's name instead of "You"; unchanged when there is nothing to replace (or no viewer). */
export function withViewerNamed(message: LogMessage, viewer: Color | undefined): LogMessage {
  if (viewer === undefined) {
    return message;
  }
  const viewerDatum: LogMessageData = {type: LogMessageDataType.PLAYER, value: viewer};
  const named = OWN_TO_NAMED[message.message];
  if (named !== undefined) {
    return {...message, message: named, data: [viewerDatum, ...message.data]};
  }
  if (isYou(message.data[0])) {
    return {...message, data: [viewerDatum, ...message.data.slice(1)]};
  }
  return message;
}
