<template>
  <div class="player_home_block player_home_block--setup nofloat">
    <template v-if="isInitialDraftingPhase">
      <div v-for="card in playerView.dealtCorporationCards" :key="card.name" class="cardbox">
        <Card :card="card"/>
      </div>

      <div v-for="card in playerView.dealtPreludeCards" :key="card.name" class="cardbox">
        <Card :card="card"/>
      </div>

      <div v-for="card in playerView.dealtCeoCards" :key="card.name" class="cardbox">
        <Card :card="card"/>
      </div>

      <div v-for="card in playerView.dealtProjectCards" :key="card.name" class="cardbox">
        <Card :card="card"/>
      </div>
    </template>
    <div class="player_home_block player_home_block--hand" v-if="playerView.draftedCards.length > 0">
      <DynamicTitle title="Drafted Cards" :color="thisPlayer.color"/>
      <div v-for="card in playerView.draftedCards" :key="card.name" class="cardbox">
          <Card :card="card"/>
      </div>
    </div>

    <template v-if="playerView.pickedCorporationCard.length === 1">
      <DynamicTitle title="Your selected cards:" :color="thisPlayer.color"/>
      <div>
        <div class="cardbox">
          <Card :card="playerView.pickedCorporationCard[0]"/>
        </div>
        <template v-if="game.gameOptions.expansions.prelude">
          <div v-for="card in playerView.preludeCardsInHand" :key="card.name" class="cardbox">
            <Card :card="card"/>
          </div>
        </template>
        <template v-if="game.gameOptions.expansions.ceo">
          <div v-for="card in playerView.ceoCardsInHand" :key="card.name" class="cardbox">
          <Card :card="card"/>
          </div>
        </template>
      </div>
      <div>
        <div v-for="card in playerView.cardsInHand" :key="card.name" class="cardbox">
          <Card :card="card"/>
        </div>
      </div>
    </template>

    <!-- Startauswahl als Tabs (SelectInitialCards). Brett, Meilensteine, Auszeichnungen und Log stehen in der
         rechten Spalte (PlayerHome), die Zugreihenfolge zeigen die Spielerleisten ("1." = Startspieler) -->
    <WaitingFor v-if="game.phase !== 'end'" :playerView="playerView" :waitingfor="playerView.waitingFor"/>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

import Card from '@/client/components/card/Card.vue';
import DynamicTitle from '@/client/components/common/DynamicTitle.vue';
import WaitingFor from '@/client/components/WaitingFor.vue';
import {Phase} from '@/common/Phase';
import {GameModel} from '@/common/models/GameModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';

export default defineComponent({
  name: 'PlayerSetupView',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
  },
  computed: {
    thisPlayer(): PublicPlayerModel {
      return this.playerView.thisPlayer;
    },
    game(): GameModel {
      return this.playerView.game;
    },
    isInitialDraftingPhase(): boolean {
      return (this.game.phase === Phase.INITIALDRAFTING) && this.game.gameOptions.initialDraftVariant;
    },
  },
  components: {
    Card,
    DynamicTitle,
    WaitingFor,
  },
});
</script>
