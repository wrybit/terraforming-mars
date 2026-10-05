// CEO once-per-game action as part of the action menu's "Actions" tab (OrOptions.vue, CeoActionSection.vue)
// instead of its own tab: the CEO cards of the own tableau sit there as a sub-section below the action cards.
import {CardType} from '@/common/cards/CardType';
import {CardModel} from '@/common/models/CardModel';
import {PlayerInputModel, SelectCardModel} from '@/common/models/PlayerInputModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {getCard} from '@/client/cards/ClientCardManifest';
import {titleKey} from '@/client/components/orOptionsShortLabels';

// Title keys from the server (Player.ts)
export const ACTION_CARDS_TITLE = 'Perform an action from a played card';
export const CEO_ACTION_TITLE = 'Use CEO once per game action';

export type CeoCardState = 'available' | 'unavailable' | 'used';

export function ownCeoCards(player: PublicPlayerModel): Array<CardModel> {
  return player.tableau.filter((card) => getCard(card.name)?.type === CardType.CEO);
}

export function isCeoActionOption(option: PlayerInputModel | undefined): option is SelectCardModel {
  return option?.type === 'card' && titleKey(option.title) === CEO_ACTION_TITLE;
}

export function isActionCardsOption(option: PlayerInputModel | undefined): boolean {
  return option !== undefined && titleKey(option.title) === ACTION_CARDS_TITLE;
}

// used: the once-per-game action is spent (server marks the card disabled); available: offered right now;
// unavailable: not usable at the moment (e.g. condition not met)
export function ceoCardState(card: CardModel, option: SelectCardModel | undefined): CeoCardState {
  if (card.isDisabled === true) {
    return 'used';
  }
  const offered = option?.cards.some((candidate) => candidate.name === card.name && candidate.isDisabled !== true) ?? false;
  return offered ? 'available' : 'unavailable';
}
