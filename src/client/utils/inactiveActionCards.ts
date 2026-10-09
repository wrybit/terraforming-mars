// "Actions" tab of the action menu (OrOptions.vue): below the actions you can take, the own action cards that are
// already used this generation and those not usable right now, each as its own greyed-out section (CardListSection.vue).
// The server only offers the usable ones (Player.getPlayableActionCards), so the rest comes from the own tableau.
import {CardModel} from '@/common/models/CardModel';
import {CardType} from '@/common/cards/CardType';
import {SelectCardModel} from '@/common/models/PlayerInputModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {getCard} from '@/client/cards/ClientCardManifest';
import {ceoCardState} from '@/client/utils/ceoActions';
import {cardVisibility, CardVisibility, playedCardFilter, playedCardsSortOrder} from '@/client/utils/cardFilterState';
import {sortCards} from '@/client/utils/SortOrder';
import {sortActiveCards} from '@/client/utils/ActiveCardsSortingOrder';

export type InactiveActionCards = {
  used: ReadonlyArray<CardModel>;
  unusable: ReadonlyArray<CardModel>;
};

// Action cards in the chosen sorting of the played cards, otherwise the usual action order (SelectCard.vue too)
export function orderActionCards(cards: ReadonlyArray<CardModel>): ReadonlyArray<CardModel> {
  const sortOrder = playedCardsSortOrder.value;
  return sortOrder !== undefined ? sortCards(cards, sortOrder) : sortActiveCards(cards);
}

// The action cards follow the filter of the played cards (SelectCard.vue, no cost filter there)
export function actionCardVisibility(card: CardModel): CardVisibility {
  return cardVisibility(card, playedCardFilter, {withCost: false});
}

/**
 * Own cards with an action that the "Actions" tab doesn't offer right now.
 * CEOs count by their once-per-game action (ceoActions.ts): spent → used, not offered → not usable.
 */
export function inactiveActionCards(
  player: PublicPlayerModel,
  actionsOption: SelectCardModel | undefined,
  ceoOption: SelectCardModel | undefined,
): InactiveActionCards {
  const offered = new Set((actionsOption?.cards ?? []).filter((card) => card.isDisabled !== true).map((card) => card.name));
  const used: Array<CardModel> = [];
  const unusable: Array<CardModel> = [];
  for (const card of player.tableau) {
    const clientCard = getCard(card.name);
    if (clientCard === undefined) {
      continue;
    }
    if (clientCard.type === CardType.CEO) {
      const state = ceoCardState(card, ceoOption);
      if (state === 'used') {
        used.push(card);
      } else if (state === 'unavailable') {
        unusable.push(card);
      }
      continue;
    }
    if (!clientCard.hasAction || offered.has(card.name)) {
      continue;
    }
    if (player.actionsThisGeneration.includes(card.name)) {
      used.push(card);
    } else {
      unusable.push(card);
    }
  }
  return {used: orderActionCards(used), unusable: orderActionCards(unusable)};
}
