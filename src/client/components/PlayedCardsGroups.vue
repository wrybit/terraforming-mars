<template>
  <div class="other-player-cards">
    <!-- Played cards of one player, grouped like on the table: corporation, CEO, active (blue) cards,
         automated cards and preludes as one stack, events as another stack.
         Used by the players' card view (OtherPlayer.vue) and the "All cards" tab (HandCardsPanel.vue);
         the latter shows the active cards in their own section above and leaves them out here. -->
    <div v-for="card in cardsOf([CardType.CORPORATION])" :key="card.name" class="cardbox" :class="visibilityClass(card)">
      <Card :card="card" :actionUsed="isCardActivated(card, player)" :cubeColor="player.color"/>
    </div>
    <div v-for="card in cardsOf([CardType.CEO])" :key="card.name" class="cardbox" :class="visibilityClass(card)">
      <Card :card="card" :actionUsed="isCardActivated(card, player)" :cubeColor="player.color"/>
    </div>
    <template v-if="!withoutActiveCards">
      <div v-for="card in cardsOf([CardType.ACTIVE])" :key="card.name" class="cardbox" :class="visibilityClass(card)">
        <Card :card="card" :actionUsed="isCardActivated(card, player)" :cubeColor="player.color"/>
      </div>
    </template>
    <StackedCards v-if="automatedCards.length > 0" :cards="automatedCards" :visibility="visibility"/>
    <StackedCards v-if="eventCards.length > 0" :cards="eventCards" :visibility="visibility"/>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import Card from '@/client/components/card/Card.vue';
import StackedCards from '@/client/components/StackedCards.vue';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {CardModel} from '@/common/models/CardModel';
import {CardType} from '@/common/cards/CardType';
import {getCardsByType, isCardActivated} from '@/client/utils/CardUtils';
import {sortActiveCards} from '@/client/utils/ActiveCardsSortingOrder';
import {CardVisibility, playedCardsSortOrder} from '@/client/utils/cardFilterState';
import {sortCards} from '@/client/utils/SortOrder';

const props = withDefaults(defineProps<{
  player: PublicPlayerModel;
  // Card filter of the played cards; without it every card is shown
  visibility?: (card: CardModel) => CardVisibility;
  // The "All cards" tab already shows the active cards in their own section
  withoutActiveCards?: boolean;
}>(), {
  visibility: (): CardVisibility => 'shown',
  withoutActiveCards: false,
});

// Cards of the given types in their group: sorted when a sorting is chosen, otherwise as before
// (active cards in action order, the rest in playing order)
function cardsOf(types: Array<CardType>): ReadonlyArray<CardModel> {
  const cards = getCardsByType(props.player.tableau, types);
  if (playedCardsSortOrder.value !== undefined) {
    return sortCards(cards, playedCardsSortOrder.value);
  }
  return types.includes(CardType.ACTIVE) ? sortActiveCards(cards) : cards;
}

const automatedCards = computed(() => cardsOf([CardType.AUTOMATED, CardType.PRELUDE]));
const eventCards = computed(() => cardsOf([CardType.EVENT]));

function visibilityClass(card: CardModel): string | undefined {
  const visibility = props.visibility(card);
  return visibility === 'shown' ? undefined : 'card-filter-' + visibility;
}
</script>
