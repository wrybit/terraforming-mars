import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {CardName} from '@/common/cards/CardName';
import {ColonyName} from '@/common/colonies/ColonyName';
import {GlobalEventName} from '@/common/turmoil/globalEvents/GlobalEventName';

// The cards, global events and colonies a log line contains (CardPanel, LogPanel)

export function logMessageCards(message: LogMessage): ReadonlyArray<CardName> {
  return message.data
    .filter((datum) => datum.type === LogMessageDataType.CARD || datum.type === LogMessageDataType.CARDS)
    .flatMap((datum) => datum.type === LogMessageDataType.CARD ? [datum.value] : datum.value);
}

export function logMessageGlobalEvents(message: LogMessage): Array<GlobalEventName> {
  return message.data.filter((datum) => datum.type === LogMessageDataType.GLOBAL_EVENT).map((datum) => datum.value);
}

export function logMessageColonies(message: LogMessage): Array<ColonyName> {
  return message.data.filter((datum) => datum.type === LogMessageDataType.COLONY).map((datum) => datum.value);
}

export function logMessageItemCount(message: LogMessage): number {
  return logMessageCards(message).length + logMessageGlobalEvents(message).length + logMessageColonies(message).length;
}

// More does not fit over the log as a hover preview (e.g. "29 cards were discarded");
// such lines open a scrollable modal over the right column on click
const MAX_HOVER_PREVIEW_ITEMS = 3;

export function needsModalPreview(message: LogMessage): boolean {
  return logMessageItemCount(message) > MAX_HOVER_PREVIEW_ITEMS;
}
