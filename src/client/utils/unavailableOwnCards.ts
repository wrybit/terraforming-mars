// Own cards that can't be played or used right now – greyed out wherever they show (HandCardsPanel.vue "All cards"),
// like in the "Play cards" and "Actions" tabs. Only known while the turn's action menu is pending.
import {CardName} from '@/common/cards/CardName';
import {OrOptionsModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {isChoiceMenu} from '@/client/components/choiceMenu';
import {isActionCardsOption, isCeoActionOption} from '@/client/utils/ceoActions';
import {inactiveActionCards} from '@/client/utils/inactiveActionCards';
import {unplayableHandCards} from '@/client/utils/playableCards';

// The turn's action menu (same distinction as WaitingFor.vue and MobilePlayerHome.vue)
function actionMenu(playerView: PlayerViewModel): OrOptionsModel | undefined {
  const input = playerView.waitingFor;
  return input !== undefined && !input.optional && input.type === 'or' && !isChoiceMenu(input) ? input : undefined;
}

/** Names of the own hand and action cards that can't be played or used now; undefined outside the action menu. */
export function unavailableOwnCards(playerView: PlayerViewModel): ReadonlySet<CardName> | undefined {
  const menu = actionMenu(playerView);
  if (menu === undefined) {
    return undefined;
  }
  const projectInput = menu.options.find((option) => option.type === 'projectCard');
  // No "Play project card" option: no hand card is playable
  const unplayable = projectInput === undefined ? (playerView.cardsInHand ?? []) : unplayableHandCards(playerView, projectInput);
  const actions = menu.options.find((option) => isActionCardsOption(option));
  const ceo = menu.options.find((option) => isCeoActionOption(option));
  const inactive = inactiveActionCards(
    playerView.thisPlayer,
    actions?.type === 'card' ? actions : undefined,
    isCeoActionOption(ceo) ? ceo : undefined);
  return new Set([...unplayable, ...inactive.used, ...inactive.unusable].map((card) => card.name));
}
