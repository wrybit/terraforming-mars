import {Message} from '@/common/logs/Message';
import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';
import {CardName} from '@/common/cards/CardName';
import {getCard} from '@/client/cards/ClientCardManifest';
import {isEndTab} from '@/client/components/orOptionsShortLabels';

// Einfache Entscheidung (z. B. Olympus-Konferenz: "Ressource hinzufügen" oder "entfernen"): nur reine Optionen
// ohne eigene Eingabe, dazu höchstens eine Spielerwahl (z. B. Komet für Venus: "Spieler wählen" oder "Entferne keine M€").
// Sie kommt in einen einzigen Tab (WaitingForTabs) mit Auswahl-Kacheln (OrOptions) – jeder Spieler und jede
// Option eine Kachel –, nicht als eigene Tab-Leiste wie das Aktionsmenü. Weitergeben/Beenden gehören immer zum Aktionsmenü.
export function isChoiceMenu(input: PlayerInputModel): input is OrOptionsModel {
  return input.type === 'or' &&
    input.options.length > 0 &&
    input.options.filter((option) => option.type === 'player').length <= 1 &&
    input.options.every((option) => (option.type === 'option' && !isEndTab(option.title)) || option.type === 'player');
}

// Eingabe, die eine Entscheidung nach außen vertritt (Frage, Tab-Beschriftung, Farbe in WaitingForTabs):
// die Spielerwahl, falls es eine gibt – deren Titel sagt, worum es geht –, sonst die Entscheidung selbst
export function choiceMenuLead(input: PlayerInputModel): PlayerInputModel {
  if (!isChoiceMenu(input)) {
    return input;
  }
  return input.options.find((option) => option.type === 'player') ?? input;
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
