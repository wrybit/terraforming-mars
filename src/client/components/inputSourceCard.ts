import {Message} from '@/common/logs/Message';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {CardName} from '@/common/cards/CardName';
import {getCard} from '@/client/cards/ClientCardManifest';

// Karte, die der Server im Titel nennt ("Select an option for Olympus Conference") – für Wirkungen,
// die nicht aus dem Ausspielen oder einer Kartenaktion kommen und deshalb kein sourceCard tragen
const CARD_IN_TITLE = /^Select an option for (.+)$/;

// Allgemeine Fragen, die nichts über die Karte sagen; steht die Karte darüber, entfallen sie
const GENERIC_TITLES: ReadonlySet<string> = new Set(['Select one option', 'Select an option']);

function titleKey(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

// Karte, deren Wirkung die Eingabe auslöst: vom Server (DeferredActionsQueue → sourceCard) oder aus dem Titel
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

// Kurzer Kartentext als Erklärung; undefined, wenn die Karte ihn nur als Symbole hat
export function cardDescriptionText(name: CardName): string | undefined {
  const description = getCard(name)?.metadata.description;
  if (description === undefined) {
    return undefined;
  }
  return typeof description === 'string' ? description : description.text;
}

// Ob die Frage neben der Karte noch etwas sagt ("Wähle einen Spieler …") oder nur "Wähle eine Option" ist
export function isGenericTitle(title: string | Message): boolean {
  const key = titleKey(title);
  return GENERIC_TITLES.has(key) || CARD_IN_TITLE.test(key);
}
