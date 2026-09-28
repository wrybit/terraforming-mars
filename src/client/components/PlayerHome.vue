<template>
  <div id="player-home" :class="{'with-turmoil': game.turmoil, 'player-home--acting': isPlayerActing(playerView)}">
    <!-- player-home--acting: roter Rahmen um den Viewport, solange dieser Spieler am Zug ist (active_player_outline.less).
         Kommentar bewusst innerhalb der Wurzel, sonst hätte die Komponente zwei Wurzelknoten ($el wäre kein Element) -->
    <TopBar :playerView="playerView" />

    <div v-if="game.phase === 'end'">
      <div class="player_home_block">
        <DynamicTitle title="This game is over!" :color="thisPlayer.color"/>
        <a :href="'the-end?id='+ playerView.id" v-i18n>Go to game results</a>
      </div>
    </div>

    <Sidebar v-trim-whitespace
      :actingPlayer="isPlayerActing(playerView)"
      :playerColor="thisPlayer.color"
      :generation="game.generation"
      :coloniesCount="game.colonies.length"
      :temperature = "game.temperature"
      :oxygen = "game.oxygenLevel"
      :oceans = "game.oceans"
      :venus = "game.venusScaleLevel"
      :turmoil = "game.turmoil"
      :moonData="game.moon"
      :gameOptions = "game.gameOptions"
      :playerNumber = "playerView.players.length"
      :lastSoloGeneration = "game.lastSoloGeneration"
      :deckSize = "game.deckSize"
      :discardPileSize = "game.discardPileSize"
      :otherDeckSizes = "game.otherDeckSizes"
      :spectatorId = "game.spectatorId"
      :expectedPurgeTimeMs = "game.expectedPurgeTimeMs"/>

    <div v-if="thisPlayer.tableau.length > 0">
      <!-- Zwei-Spalten-Layout: Brett steht im DOM zuerst (Hotkey-Reihenfolge, schmale Screens), wird per CSS rechts platziert -->
      <div class="player-home-columns">
        <div class="player-home-columns__board" :ref="trackBoardColumn">
          <div class="player_home_block player-home-columns__mars">
            <GameBoardView
              ref="gameBoardView"
              :game="game"
              :tileView="tileView"
              :players="playerView.players"
              @toggleTileView="cycleTileView()"
            />
          </div>

          <!-- Log unter dem Brett: beides bleibt im Zwei-Spalten-Layout gemeinsam sichtbar -->
          <a class="hotkey-target"></a>
          <div class="player_home_block nofloat player-home-columns__log">
            <LogPanel :viewModel="playerView" :step="game.step" @spaceClicked="onSpaceClicked"/>
          </div>
        </div>

        <div class="player-home-columns__main">
          <a class="hotkey-target"></a>
          <PlayersOverview class="player_home_block player_home_block--players nofloat" :playerView="playerView" v-trim-whitespace id="shortkey-playersoverview"/>

          <a class="hotkey-target"></a>
          <div class="player_home_block player_home_block--actions nofloat">
            <a name="actions" class="player_home_anchor"></a>
            <DynamicTitle title="Actions" :color="thisPlayer.color"/>
            <WaitingFor v-if="game.phase !== 'end'" :playerView="playerView" :waitingfor="playerView.waitingFor"/>
          </div>

          <div class="player_home_block player_home_block--hand" v-if="playerView.draftedCards.length > 0">
            <DynamicTitle title="Drafted cards" :color="thisPlayer.color" />
            <div v-for="card in playerView.draftedCards" :key="card.name" class="cardbox">
              <Card :card="card"/>
            </div>
          </div>

          <a name="cards" class="player_home_anchor"></a>
          <!-- Steht die Hand als Tab im Aktionsmenü, entfällt dieser Block (isHandInActionTabs) -->
          <div class="player_home_block player_home_block--hand" v-if="cardsInHandCount > 0 && !isHandInActionTabs(playerView)" id="shortkey-hand">
            <div class="hiding-card-button-row">
              <DynamicTitle title="Cards In Hand" :color="thisPlayer.color"/>
              <div :class="['hiding-card-button', showHand ? 'hand-toggle' : 'hand-toggle-transparent']" @click.prevent="showHand = !showHand">
                <div class="played-cards-count">{{cardsInHandCount.toString()}}</div>
                <div class="played-cards-selection">{{ showHand ? '✔' : '' }}</div>
              </div>
              <div class="text-overview" v-i18n>[ toggle cards in hand ]</div>
            </div>
            <SortableCards v-show="showHand" :playerId="playerView.id" :cards="allCardsInHand"/>
          </div>

          <!-- Eigene gespielte Karten: wie bei Gegnern über "anzeigen" in der Spielerleiste (Modal) -->
        </div>
      </div>
    </div>

    <div v-if="thisPlayer.underworldData.tokens.length > 0">
      <DynamicTitle title="Claimed Underground Resource Tokens" :color="thisPlayer.color"/>
      <UndergroundTokens :underworldData="thisPlayer.underworldData"/>
    </div>

    <template v-if="thisPlayer.tableau.length === 0">
      <PlayerSetupView :playerView="playerView" :tileView="tileView" @toggleTileView="cycleTileView()"/>
    </template>

    <div v-if="game.colonies.length > 0" class="player_home_block" ref="colonies" id="shortkey-colonies">
      <a name="colonies" class="player_home_anchor hotkey-target"></a>
      <DynamicTitle title="Colonies" :color="thisPlayer.color"/>
      <div class="colonies-fleets-cont">
        <div class="colonies-player-fleets" v-for="colonyPlayer in playerView.players" :key="colonyPlayer.color">
          <div :class="'colonies-fleet colonies-fleet-'+ colonyPlayer.color" v-for="idx in getFleetsCountRange(colonyPlayer)" :key="idx"></div>
        </div>
      </div>
      <div class="player_home_colony_cont">
        <div class="player_home_colony" v-for="colony in game.colonies" :key="colony.name">
          <Colony :colony="colony" :active="colony.isActive"/>
        </div>
      </div>
    </div>

    <KeyboardShortcuts v-show="keyboardShortcutOpened" @close="keyboardShortcutOpened = false"/>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

import PlayersOverview from '@/client/components/overview/PlayersOverview.vue';
import WaitingFor from '@/client/components/WaitingFor.vue';
import Sidebar from '@/client/components/Sidebar.vue';
import Card from '@/client/components/card/Card.vue';
import Colony from '@/client/components/colonies/Colony.vue';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import GameBoardView from '@/client/components/GameBoardView.vue';
import PlayerSetupView from '@/client/components/PlayerSetupView.vue';
import DynamicTitle from '@/client/components/common/DynamicTitle.vue';
import SortableCards from '@/client/components/SortableCards.vue';
import TopBar from '@/client/components/TopBar.vue';
import UndergroundTokens from '@/client/components/underworld/UndergroundTokens.vue';
import KeyboardShortcuts from '@/client/components/KeyboardShortcuts.vue';
import {getPreferences, PreferencesManager} from '@/client/utils/PreferencesManager';
import {GameModel} from '@/common/models/GameModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {CardModel} from '@/common/models/CardModel';
import {HomeMixin} from '@/client/mixins/HomeMixin';
import {observeBoardColumn} from '@/client/utils/boardColumnPosition';
import {observeRightColumnFit} from '@/client/utils/rightColumnFit';
import {allCardsInHand, isHandInActionTabs} from '@/client/utils/handCards';

// Aufräumfunktion der Spalten-Beobachtung (Position fürs Modal, Platzausnutzung); pro Seite gibt es nur eine Spieleransicht
let stopObservingBoardColumn: (() => void) | undefined;

function observeBoardColumnFully(column: HTMLElement): () => void {
  const stopPosition = observeBoardColumn(column);
  const stopFit = observeRightColumnFit(column);
  return () => {
    stopPosition();
    stopFit();
  };
}

type PlayerHomeModel = {
  showHand: boolean;
}

export default defineComponent({
  name: 'PlayerHome',
  mixins: [HomeMixin],
  data(): PlayerHomeModel {
    const preferences = getPreferences();
    return {
      showHand: !preferences.hide_hand,
    };
  },
  watch: {
    showHand: function hide_hand() {
      PreferencesManager.INSTANCE.set('hide_hand', !this.showHand);
    },
  },
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
    cardsInHandCount(): number {
      const playerView = this.playerView;
      return playerView.cardsInHand.length + playerView.preludeCardsInHand.length + playerView.ceoCardsInHand.length;
    },
    allCardsInHand(): Array<CardModel> {
      return allCardsInHand(this.playerView);
    },
  },

  components: {
    DynamicTitle,
    Card,
    PlayersOverview,
    WaitingFor,
    Sidebar,
    Colony,
    LogPanel,
    SortableCards,
    TopBar,
    GameBoardView,
    PlayerSetupView,
    UndergroundTokens,
    KeyboardShortcuts,
  },
  beforeUnmount() {
    stopObservingBoardColumn?.();
    stopObservingBoardColumn = undefined;
  },
  methods: {
    isHandInActionTabs,
    // Funktions-Ref: wird mit dem Element bzw. beim Entfernen mit null aufgerufen
    trackBoardColumn(element: unknown) {
      stopObservingBoardColumn?.();
      stopObservingBoardColumn = element instanceof HTMLElement ? observeBoardColumnFully(element) : undefined;
    },
    isPlayerActing(playerView: PlayerViewModel) : boolean {
      return playerView.players.length > 1 && playerView.waitingFor !== undefined && !playerView.waitingFor.optional;
    },
    getFleetsCountRange(player: PublicPlayerModel): Array<number> {
      const fleetsRange = [];
      for (let i = 0; i < player.fleetSize - player.tradesThisGeneration; i++) {
        fleetsRange.push(i);
      }
      return fleetsRange;
    },
  },
});

</script>
