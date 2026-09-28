import {Message} from '@/common/logs/Message';
import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';
import {CardName} from '@/common/cards/CardName';
import {getCard} from '@/client/cards/ClientCardManifest';
import {isEndTab} from '@/client/components/orOptionsShortLabels';

// Einfache Entscheidung (z. B. Olympus-Konferenz: "Ressource hinzufügen" oder "entfernen"): nur reine Optionen
// ohne eigene Eingabe. Sie kommt in einen einzigen Tab (WaitingForTabs) mit Auswahl-Kacheln (OrOptions),
// nicht als eigene Tab-Leiste wie das Aktionsmenü. Weitergeben/Beenden gehören immer zum Aktionsmenü.
export function isChoiceMenu(input: PlayerInputModel): input is OrOptionsModel {
  return input.type === 'or' &&
    input.options.length > 0 &&
    input.options.every((option) => option.type === 'option' && !isEndTab(option.title));
}

// Karte, zu der die Entscheidung gehört: der Server nennt sie im Titel ("Select an option for Olympus Conference")
const CARD_IN_TITLE = /^Select an option for (.+)$/;

function titleKey(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

// Kurzer Kartentext als Erklärung in der Box; undefined, wenn keine Karte erkennbar ist
export function choiceCardDescription(title: string | Message): string | undefined {
  const match = CARD_IN_TITLE.exec(titleKey(title));
  if (match === null) {
    return undefined;
  }
  const description = getCard(match[1] as CardName)?.metadata.description;
  if (description === undefined) {
    return undefined;
  }
  return typeof description === 'string' ? description : description.text;
}
