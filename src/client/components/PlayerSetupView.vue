<template>
  <div class="player_home_block player_home_block--setup nofloat">
    <div class="player_home_block player_home_block--hand" v-if="showsDraftedCardsBlock(playerView)">
      <DynamicTitle title="Drafted Cards" :color="thisPlayer.color"/>
      <div v-for="card in playerView.draftedCards" :key="card.name" class="cardbox">
          <Card :card="card"/>
      </div>
      <!-- Initial draft, waiting for the others: dealt corporations/preludes below (with an own input they sit in the draft tab) -->
      <CardListSection v-for="section in dealtSections" :key="section.title" :title="section.title" :cards="section.cards"/>
    </div>

    <!-- After the initial selection, while opponents are still choosing: own selection like the hand cards in the game
         (gray cards tab, next to it the red status tab showing who is still choosing) -->
    <div v-if="playerView.pickedCorporationCard.length === 1" class="setup-picked">
      <div class="or-tabs" role="tablist">
        <HandCardsTab :count="pickedCards.length" :active="true" label="Your selection"/>
        <WaitingForPlayersTab :playerView="playerView"/>
      </div>
      <div v-docked-tab class="or-tab-panel or-tab-panel--view" role="tabpanel">
        <div v-for="card in pickedCards" :key="card.name" class="cardbox">
          <Card :card="card"/>
        </div>
      </div>
    </div>

    <!-- Initial selection as tabs (SelectInitialCards). Board, milestones, awards and log are in the
         right column (PlayerHome), the player bars show the turn order ("1." = starting player) -->
    <!-- Invisible without own input (status tab shows who is still choosing); stays mounted because it polls the server -->
    <div v-show="playerView.waitingFor !== undefined">
      <WaitingFor v-if="game.phase !== 'end'" :playerView="playerView" :waitingfor="playerView.waitingFor"/>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {vDockedTab} from '@/client/directives/DockedTab';

import Card from '@/client/components/card/Card.vue';
import DynamicTitle from '@/client/components/common/DynamicTitle.vue';
import WaitingFor from '@/client/components/WaitingFor.vue';
import {Phase} from '@/common/Phase';
import {GameModel} from '@/common/models/GameModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {CardModel} from '@/common/models/CardModel';
import HandCardsTab from '@/client/components/HandCardsTab.vue';
import WaitingForPlayersTab from '@/client/components/WaitingForPlayersTab.vue';
import {initialDraftDealtSections, showsDraftedCardsBlock} from '@/client/utils/draftedCards';
import CardListSection from '@/client/components/CardListSection.vue';

export default defineComponent({
  name: 'PlayerSetupView',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
  },
  computed: {
    // Own initial selection in game order: corporation, preludes, CEO, bought cards
    pickedCards(): Array<CardModel> {
      return [
        ...this.playerView.pickedCorporationCard,
        ...(this.game.gameOptions.expansions.prelude ? this.playerView.preludeCardsInHand : []),
        ...(this.game.gameOptions.expansions.ceo ? this.playerView.ceoCardsInHand : []),
        ...this.playerView.cardsInHand,
      ];
    },
    thisPlayer(): PublicPlayerModel {
      return this.playerView.thisPlayer;
    },
    game(): GameModel {
      return this.playerView.game;
    },
    dealtSections(): ReturnType<typeof initialDraftDealtSections> {
      return initialDraftDealtSections(this.playerView);
    },
  },
  methods: {
    showsDraftedCardsBlock,
  },
  directives: {
    dockedTab: vDockedTab,
  },
  components: {
    HandCardsTab,
    WaitingForPlayersTab,
    Card,
    CardListSection,
    DynamicTitle,
    WaitingFor,
  },
});
</script>
