<template>
  <div v-show="isVisible()" class="other_player_panel">
    <div :class="'player_translucent_bg_color_' + player.color" class="other_player_header">
      <div class="player_name">{{ player.name }} <span v-i18n>played cards</span></div>
      <AppButton size="big" type="close" @click="hideMe" :disableOnServerBusy="false" align="right" />
    </div>
    <div class="other_player_cont menu">
        <div v-if="player.tableau.length > 0" class="player_home_block">
            <div>
                <div v-for="card in getCardsByType(player.tableau, [CardType.CORPORATION])" :key="card.name" class="cardbox">
                    <Card :card="card" :actionUsed="isCardActivated(card, player)" :cubeColor="player.color"/>
                </div>
                <div v-for="card in getCardsByType(player.tableau, [CardType.CEO])" :key="card.name" class="cardbox">
                    <Card :card="card" :actionUsed="isCardActivated(card, player)" :cubeColor="player.color"/>
                </div>

                <div v-for="card in sortActiveCards(getCardsByType(player.tableau, [CardType.ACTIVE]))" :key="card.name" class="cardbox">
                    <Card :card="card" :actionUsed="isCardActivated(card, player)" :cubeColor="player.color"/>
                </div>
                <StackedCards :cards="getCardsByType(player.tableau, [CardType.AUTOMATED, CardType.PRELUDE])" :player="player"/>
                <StackedCards :cards="getCardsByType(player.tableau, [CardType.EVENT])" :player="player"/>
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
