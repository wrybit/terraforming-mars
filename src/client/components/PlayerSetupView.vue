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

    <!-- Nach der Startauswahl, solange Mitspieler noch wählen: eigene Auswahl wie die Handkarten im Spiel
         (grauer Karten-Tab, daneben der rote Status-Tab, wer noch wählt) -->
    <div v-if="playerView.pickedCorporationCard.length === 1" class="setup-picked">
      <div class="or-tabs" role="tablist">
        <HandCardsTab :count="pickedCards.length" :active="true" label="Your selection"/>
        <WaitingForPlayersTab :players="playersToWaitFor(playerView)"/>
      </div>
      <div v-docked-tab class="or-tab-panel or-tab-panel--view" role="tabpanel">
        <div v-for="card in pickedCards" :key="card.name" class="cardbox">
          <Card :card="card"/>
        </div>
      </div>
    </div>

    <!-- Startauswahl als Tabs (SelectInitialCards). Brett, Meilensteine, Auszeichnungen und Log stehen in der
         rechten Spalte (PlayerHome), die Zugreihenfolge zeigen die Spielerleisten ("1." = Startspieler) -->
    <!-- Ohne eigene Eingabe unsichtbar (Status-Tab zeigt, wer noch wählt); bleibt eingebunden, weil es den Server abfragt -->
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
import {playersToWaitFor} from '@/client/utils/playersToWaitFor';

export default defineComponent({
  name: 'PlayerSetupView',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
  },
  computed: {
    // Eigene Startauswahl in Spielreihenfolge: Konzern, Präludien, CEO, gekaufte Karten
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
    isInitialDraftingPhase(): boolean {
      return (this.game.phase === Phase.INITIALDRAFTING) && this.game.gameOptions.initialDraftVariant;
    },
  },
  methods: {
    playersToWaitFor,
  },
  directives: {
    dockedTab: vDockedTab,
  },
  components: {
    HandCardsTab,
    WaitingForPlayersTab,
    Card,
    DynamicTitle,
    WaitingFor,
  },
});
</script>
