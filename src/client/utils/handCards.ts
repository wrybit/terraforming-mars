import {PlayerViewModel} from '@/common/models/PlayerModel';
import {CardModel} from '@/common/models/CardModel';

// Alle Handkarten in Anzeige-Reihenfolge: Präludien, CEOs, Projektkarten
// Fehlende Listen zählen als leer: Upstream-Testdaten füllen nicht jedes Feld, und Auswahl-Dialoge fragen die Hand immer ab
export function allCardsInHand(playerView: PlayerViewModel): Array<CardModel> {
  return [
    ...(playerView.preludeCardsInHand ?? []),
    ...(playerView.ceoCardsInHand ?? []),
    ...(playerView.cardsInHand ?? []),
  ];
}

// Steht die Hand als erster Tab über der aktuellen Eingabe? Das ist bei jeder anstehenden Eingabe so
// (Aktionsmenü: OrOptions, alles andere: WaitingForTabs). Dann entfällt der Handkarten-Block in PlayerHome.
export function isHandInInputTabs(playerView: PlayerViewModel): boolean {
  return playerView.waitingFor !== undefined;
}
