import {CardModel} from '@/common/models/CardModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';

// Draft cards already kept are shown inside the draft tab (WaitingForTabs.vue) as long as a card is
// to be chosen there; only while waiting for the others (no own input) do they stay a block of their own
export function draftedCardsInInput(playerView: PlayerViewModel): ReadonlyArray<CardModel> {
  return playerView.waitingFor?.type === 'card' ? playerView.draftedCards : [];
}

export function showsDraftedCardsBlock(playerView: PlayerViewModel): boolean {
  return playerView.draftedCards.length > 0 && draftedCardsInInput(playerView).length === 0;
}
