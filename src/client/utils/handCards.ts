import {PlayerViewModel} from '@/common/models/PlayerModel';
import {CardModel} from '@/common/models/CardModel';

// All hand cards in display order: preludes, CEOs, project cards
// Missing lists count as empty: upstream test data doesn't fill every field, and selection dialogs always query the hand
export function allCardsInHand(playerView: PlayerViewModel): Array<CardModel> {
  return [
    ...(playerView.preludeCardsInHand ?? []),
    ...(playerView.ceoCardsInHand ?? []),
    ...(playerView.cardsInHand ?? []),
  ];
}

// Is the hand shown as the first tab above the current input? That is the case for every pending input
// (action menu: OrOptions, everything else: WaitingForTabs). Then the hand cards block in PlayerHome is dropped.
export function isHandInInputTabs(playerView: PlayerViewModel): boolean {
  return playerView.waitingFor !== undefined;
}
