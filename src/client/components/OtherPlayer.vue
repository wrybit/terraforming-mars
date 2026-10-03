<template>
  <div v-show="isVisible()" class="other_player_panel">
    <div :class="'player_translucent_bg_color_' + player.color" class="other_player_header">
      <div class="player_name">{{ player.name }} <span v-i18n>played cards</span></div>
      <AppButton size="big" type="close" @click="hideMe" :disableOnServerBusy="false" align="right" />
    </div>
    <div class="other_player_cont menu">
        <div v-if="player.tableau.length > 0" class="player_home_block">
            <!-- Own filter and sorting for played cards (cardFilterState.ts), no cost filter -->
            <CardFilterBar v-if="player.tableau.length > 1" :cards="player.tableau" :filter="playedCardFilter" :context="filterContext" class="other-player-filter">
              <template #sort="{compact}">
                <CardSortMenu :modelValue="playedCardsSortOrder" :compact="compact" @update:modelValue="setPlayedSortOrder"/>
              </template>
            </CardFilterBar>
            <CardFilterEmptyHint v-if="nothingShown" @reset="resetCardFilter(playedCardFilter)"/>
            <div class="other-player-cards">
                <div v-for="card in cardsOf([CardType.CORPORATION])" :key="card.name" class="cardbox" :class="visibilityClass(card)">
                    <Card :card="card" :actionUsed="isCardActivated(card, player)" :cubeColor="player.color"/>
                </div>
                <div v-for="card in cardsOf([CardType.CEO])" :key="card.name" class="cardbox" :class="visibilityClass(card)">
                    <Card :card="card" :actionUsed="isCardActivated(card, player)" :cubeColor="player.color"/>
                </div>

                <div v-for="card in cardsOf([CardType.ACTIVE])" :key="card.name" class="cardbox" :class="visibilityClass(card)">
                    <Card :card="card" :actionUsed="isCardActivated(card, player)" :cubeColor="player.color"/>
                </div>
                <StackedCards v-if="cardsOf([CardType.AUTOMATED, CardType.PRELUDE]).length > 0" :cards="cardsOf([CardType.AUTOMATED, CardType.PRELUDE])" :visibility="visibilityOf" :player="player"/>
                <StackedCards v-if="cardsOf([CardType.EVENT]).length > 0" :cards="cardsOf([CardType.EVENT])" :visibility="visibilityOf" :player="player"/>
            </div>
        </div>
        <div v-if="player.selfReplicatingRobotsCards.length > 0" class="player_home_block">
            <span v-i18n>Self-replicating Robots cards</span>
            <div>
                <div v-for="card in player.selfReplicatingRobotsCards" :key="card.name" class="cardbox">
                    <Card :card="card" />
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script lang="ts">

import {registerOverlay} from '@/client/utils/overlayCoordinator';
import {PLAYER_CARDS_OVERLAY} from '@/client/components/overview/ownPlayerIndex';
import {defineComponent} from 'vue';

import StackedCards from '@/client/components/StackedCards.vue';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {vueRoot} from '@/client/components/vueRoot';
import Card from '@/client/components/card/Card.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {CardType} from '@/common/cards/CardType';
import {getCardsByType, isCardActivated} from '@/client/utils/CardUtils';
import {sortActiveCards} from '@/client/utils/ActiveCardsSortingOrder';
import {CardModel} from '@/common/models/CardModel';
import CardFilterBar from '@/client/components/cardfilter/CardFilterBar.vue';
import CardFilterEmptyHint from '@/client/components/cardfilter/CardFilterEmptyHint.vue';
import CardSortMenu from '@/client/components/cardfilter/CardSortMenu.vue';
import {CardFilterContext, resetCardFilter} from '@/client/utils/cardFilter';
import {cardVisibility, CardVisibility, playedCardFilter, playedCardsSortOrder, unmatchedCards} from '@/client/utils/cardFilterState';
import {SortOrder, sortCards} from '@/client/utils/SortOrder';

// Unregister functions per instance (not reactive, hence outside of data)
const unregisterByInstance = new WeakMap<object, () => void>();

export default defineComponent({
  name: 'OtherPlayer',
  props: {
    player: {
      type: Object as () => PublicPlayerModel,
      required: true,
    },
    playerIndex: {
      type: Number,
      required: true,
    },
  },
  components: {
    AppButton,
    StackedCards,
    Card,
    CardFilterBar,
    CardFilterEmptyHint,
    CardSortMenu,
  },
  // Escape closes the open card view (a modal in the two-column layout)
  mounted() {
    window.addEventListener('keydown', this.closeOnEscape);
    // Register as overlay; the players' card views share one key (playerCardsToggle.ts manages them)
    unregisterByInstance.set(this, registerOverlay(PLAYER_CARDS_OVERLAY, () => {
      if (this.isVisible()) {
        this.hideMe();
      }
    }));
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.closeOnEscape);
    unregisterByInstance.get(this)?.();
    unregisterByInstance.delete(this);
  },
  methods: {
    resetCardFilter,
    visibilityOf(card: CardModel): CardVisibility {
      return cardVisibility(card, playedCardFilter, this.filterContext);
    },
    visibilityClass(card: CardModel): string | undefined {
      const visibility = this.visibilityOf(card);
      return visibility === 'shown' ? undefined : 'card-filter-' + visibility;
    },
    // Cards of the given types in their group: sorted when a sorting is chosen, otherwise as before
    // (active cards in action order, the rest in playing order)
    cardsOf(types: Array<CardType>): ReadonlyArray<CardModel> {
      const cards = getCardsByType(this.player.tableau, types);
      if (playedCardsSortOrder.value !== undefined) {
        return sortCards(cards, playedCardsSortOrder.value);
      }
      return types.includes(CardType.ACTIVE) ? sortActiveCards(cards) : cards;
    },
    setPlayedSortOrder(value: SortOrder | undefined): void {
      playedCardsSortOrder.value = value;
    },
    closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && this.isVisible()) {
        this.hideMe();
      }
    },
    hideMe() {
      vueRoot(this).setVisibilityState('pinned_player_' + this.playerIndex, false);
    },
    isVisible() {
      return vueRoot(this).getVisibilityState(
        'pinned_player_' + this.playerIndex,
      );
    },
  },
  computed: {
    playedCardFilter(): typeof playedCardFilter {
      return playedCardFilter;
    },
    playedCardsSortOrder(): SortOrder | undefined {
      return playedCardsSortOrder.value;
    },
    filterContext(): CardFilterContext {
      return {withCost: false};
    },
    nothingShown(): boolean {
      return this.player.tableau.length > 1 && unmatchedCards.value === 'hide' && this.player.tableau.every((card) => this.visibilityOf(card) !== 'shown');
    },
    CardType(): typeof CardType {
      return CardType;
    },
    getCardsByType(): typeof getCardsByType {
      return getCardsByType;
    },
    isCardActivated(): typeof isCardActivated {
      return isCardActivated;
    },
    sortActiveCards(): typeof sortActiveCards {
      return sortActiveCards;
    },
  },
});
</script>
