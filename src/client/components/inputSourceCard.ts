import {Message} from '@/common/logs/Message';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {CardName} from '@/common/cards/CardName';
import {getCard} from '@/client/cards/ClientCardManifest';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';

// Card named by the server in the title ("Select an option for Olympus Conference") – for effects
// that do not come from playing a card or a card action and therefore carry no sourceCard
const CARD_IN_TITLE = /^Select an option for (.+)$/;

// Generic questions that say nothing about the card; if the card is shown above, they are dropped
const GENERIC_TITLES: ReadonlySet<string> = new Set(['Select one option', 'Select an option']);

function titleKey(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

// Card whose effect triggers the input: from the server (DeferredActionsQueue → sourceCard) or from the title
export function inputSourceCard(input: PlayerInputModel): CardName | undefined {
  if (input.sourceCard !== undefined) {
    return input.sourceCard;
  }
  const match = CARD_IN_TITLE.exec(titleKey(input.title));
  if (match === null || getCard(match[1] as CardName) === undefined) {
    return undefined;
  }
  return match[1] as CardName;
}

// Card behind a content-free option of the action menu (e.g. "Take first action of ${0} corporation"):
// from the server or the first card named in the title, so the box can show what the button triggers
export function optionSourceCard(option: PlayerInputModel): CardName | undefined {
  if (option.sourceCard !== undefined) {
    return option.sourceCard;
  }
  if (typeof option.title === 'string') {
    return undefined;
  }
  const card = option.title.data.find((data) => data.type === LogMessageDataType.CARD);
  return card === undefined ? undefined : card.value as CardName;
}

// Short card text as explanation; undefined if the card only has it as icons
export function cardDescriptionText(name: CardName): string | undefined {
  const description = getCard(name)?.metadata.description;
  if (description === undefined) {
    return undefined;
  }
  return typeof description === 'string' ? description : description.text;
}

// Whether the question still says something next to the card ("Select a player …") or is just "Select an option"
export function isGenericTitle(title: string | Message): boolean {
  const key = titleKey(title);
  return GENERIC_TITLES.has(key) || CARD_IN_TITLE.test(key);
}
