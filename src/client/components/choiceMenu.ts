import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';
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
