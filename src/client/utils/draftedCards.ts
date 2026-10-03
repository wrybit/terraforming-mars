import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';

// Draft cards already kept are shown inside the draft tab (WaitingForTabs.vue) as long as a card is
// to be chosen there; only while waiting for the others (no own input) do they stay a block of their own.
// The pick of the current round is left out: it still sits among the cards to choose from (currentDraftPicks).
export function draftedCardsInInput(playerView: PlayerViewModel): ReadonlyArray<CardModel> {
  const input = playerView.waitingFor;
  if (input?.type !== 'card') {
    return [];
  }
  const picks = currentDraftPicks(playerView, input);
  return playerView.draftedCards.filter((card) => !picks.has(card.name));
}

export function showsDraftedCardsBlock(playerView: PlayerViewModel): boolean {
  return playerView.draftedCards.length > 0 && playerView.waitingFor?.type !== 'card';
}

// While the others are still drafting the player may change the pick (optional input, server Draft.ts):
// the cards already picked this round are offered again together with the rest
export function currentDraftPicks(playerView: PlayerViewModel, input: PlayerInputModel): ReadonlySet<CardName> {
  if (input.type !== 'card' || input.optional !== true || playerView.draftedCards.length === 0) {
    return new Set();
  }
  const offered = new Set(input.cards.map((card) => card.name));
  return new Set(playerView.draftedCards.filter((card) => offered.has(card.name)).map((card) => card.name));
}

// Draft repick: the explanation ("You can change your selection …") goes small into the footer next to the button
export function isDraftRepick(playerView: PlayerViewModel, input: PlayerInputModel): boolean {
  return currentDraftPicks(playerView, input).size > 0;
}
