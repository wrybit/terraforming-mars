import {PlayerViewModel} from '@/common/models/PlayerModel';
import {CardModel} from '@/common/models/CardModel';

// Alle Handkarten in Anzeige-Reihenfolge: Präludien, CEOs, Projektkarten
export function allCardsInHand(playerView: PlayerViewModel): Array<CardModel> {
  return playerView.preludeCardsInHand
    .concat(playerView.ceoCardsInHand)
    .concat(playerView.cardsInHand);
}

// Steht die Hand als erster Tab im Aktionsmenü? Das ist so, wenn das oberste Eingabeelement ein OrOptions ist
// (nur dieses wird als Tab-Leiste dargestellt, siehe orOptionsLayout.ts). Dann entfällt der Handkarten-Block in PlayerHome.
export function isHandInActionTabs(playerView: PlayerViewModel): boolean {
  return playerView.waitingFor?.type === 'or';
}
