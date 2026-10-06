<template>
  <div v-show="isVisible()" class="other_player_panel">
    <div :class="'player_translucent_bg_color_' + player.color" class="other_player_header">
      <div class="player_name">{{ player.name }} <span v-i18n>played cards</span></div>
      <AppButton size="big" type="close" @click="hideMe" :disableOnServerBusy="false" align="right" />
    </div>
    <div class="other_player_cont menu">
        <!-- Own filter and sorting for played cards (cardFilterState.ts), no cost filter; at the top with a separator line -->
        <CardFilterBar v-if="player.tableau.length > 1" :cards="player.tableau" :filter="playedCardFilter" :context="filterContext">
          <template #sort="{compact}">
            <CardSortMenu :modelValue="playedCardsSortOrder" :compact="compact" @update:modelValue="setPlayedSortOrder"/>
          </template>
        </CardFilterBar>
        <div v-if="player.tableau.length > 0" class="player_home_block">
            <CardFilterEmptyHint v-if="nothingShown" @reset="resetCardFilter(playedCardFilter)"/>
            <PlayedCardsGroups :player="player" :visibility="visibilityOf"/>
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

import PlayedCardsGroups from '@/client/components/PlayedCardsGroups.vue';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {vueRoot} from '@/client/components/vueRoot';
import Card from '@/client/components/card/Card.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {CardModel} from '@/common/models/CardModel';
import CardFilterBar from '@/client/components/cardfilter/CardFilterBar.vue';
import CardFilterEmptyHint from '@/client/components/cardfilter/CardFilterEmptyHint.vue';
import CardSortMenu from '@/client/components/cardfilter/CardSortMenu.vue';
import {CardFilterContext, resetCardFilter} from '@/client/utils/cardFilter';
import {cardVisibility, CardVisibility, playedCardFilter, playedCardsSortOrder, unmatchedCards} from '@/client/utils/cardFilterState';
import {SortOrder} from '@/client/utils/SortOrder';

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
    PlayedCardsGroups,
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
  },
});
</script>
