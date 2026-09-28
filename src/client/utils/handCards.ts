import {PlayerViewModel} from '@/common/models/PlayerModel';
import {CardModel} from '@/common/models/CardModel';

// Alle Handkarten in Anzeige-Reihenfolge: Präludien, CEOs, Projektkarten
export function allCardsInHand(playerView: PlayerViewModel): Array<CardModel> {
  return playerView.preludeCardsInHand
    .concat(playerView.ceoCardsInHand)
    .concat(playerView.cardsInHand);
}

// Steht die Hand als erster Tab über der aktuellen Eingabe? Das ist bei jeder anstehenden Eingabe so
// (Aktionsmenü: OrOptions, alles andere: WaitingForTabs). Dann entfällt der Handkarten-Block in PlayerHome.
export function isHandInInputTabs(playerView: PlayerViewModel): boolean {
  return playerView.waitingFor !== undefined;
}
