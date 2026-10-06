<template>
  <div id="spectator-home" :class="{'with-turmoil': game.turmoil, 'player-home--fixed': usesFixedLayout}">
    <!-- Built like the player view (PlayerHome.vue), just without own hand and input -->
    <Sidebar v-trim-whitespace
      :actingPlayer="false"
      :playerColor="spectator.color"
      :coloniesCount="game.colonies.length"
      :temperature = "game.temperature"
      :oxygen = "game.oxygenLevel"
      :oceans = "game.oceans"
      :venus = "game.venusScaleLevel"
      :turmoil = "game.turmoil"
      :moonData="game.moon"
      :gameOptions = "game.gameOptions"
      :playerNumber = "spectator.players.length"
      :lastSoloGeneration = "game.lastSoloGeneration"
      :deckSize = "game.deckSize"
      :discardPileSize = "game.discardPileSize"
      :otherDeckSizes = "game.otherDeckSizes"
      :spectatorId = "game.spectatorId"
      :expectedPurgeTimeMs = "game.expectedPurgeTimeMs"/>

    <HomeColumns>
      <template #board>
        <div class="player_home_block player-home-columns__mars">
          <GameBoardView
            ref="gameBoardView"
            :game="game"
            :tileView="tileView"
            :players="spectator.players"
            @toggleTileView="cycleTileView()"
          />
          <!-- Game end: notice above Mars, then automatically to the results page -->
          <GameOverNotice v-if="game.phase === 'end'" :participantId="spectator.id"/>
        </div>
      </template>

      <!-- On the left the log instead of hand cards: it fills the space below the player table -->
      <template #main>
        <a class="hotkey-target"></a>
        <PlayersOverview class="player_home_block player_home_block--players nofloat" :playerView="spectator" v-trim-whitespace id="shortkey-playersoverview"/>
        <!-- Height of the players card, the log below gets the rest (only in the fixed layout) -->
        <RowResizeHandle kind="players"/>
        <a class="hotkey-target"></a>
        <div class="player_home_block nofloat player-home-columns__log player_home_block--spectator-log">
          <LogPanel :viewModel="spectator" milestonesAwards @spaceClicked="onSpaceClicked"/>
        </div>
      </template>
    </HomeColumns>

    <WaitingFor v-show="false" v-if="game.phase !== 'end'" :playerView="spectator" :waitingfor="undefined"/>
    <KeyboardShortcuts v-show="keyboardShortcutOpened" @close="keyboardShortcutOpened = false"/>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

import {GameModel} from '@/common/models/GameModel';
import {vueRoot} from '@/client/components/vueRoot';
import {SpectatorModel} from '@/common/models/SpectatorModel';
import GameOverNotice from '@/client/components/gameend/GameOverNotice.vue';
import HomeColumns from '@/client/components/HomeColumns.vue';
import RowResizeHandle from '@/client/components/RowResizeHandle.vue';
import GameBoardView from '@/client/components/GameBoardView.vue';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import Sidebar from '@/client/components/Sidebar.vue';
import WaitingFor from '@/client/components/WaitingFor.vue';
import PlayersOverview from '@/client/components/overview/PlayersOverview.vue';
import KeyboardShortcuts from '@/client/components/KeyboardShortcuts.vue';
import {HomeMixin} from '@/client/mixins/HomeMixin';

export default defineComponent({
  name: 'SpectatorHome',
  mixins: [HomeMixin],
  props: {
    spectator: {
      type: Object as () => SpectatorModel,
      required: true,
    },
  },
  computed: {
    game(): GameModel {
      return this.spectator.game;
    },
    // Fixed app layout like in the player view (player_home_fixed.less); colonies live in the board tabs
    usesFixedLayout(): boolean {
      return this.game.phase !== 'end';
    },
  },
  components: {
    GameBoardView,
    GameOverNotice,
    HomeColumns,
    RowResizeHandle,
    KeyboardShortcuts,
    LogPanel,
    PlayersOverview,
    Sidebar,
    WaitingFor,
  },
  methods: {
    forceRerender() {
      // TODO(kberg): this is very inefficient. It pulls down the entire state, ignoring the value of 'waitingFor' which only fetches a short state.
      vueRoot(this).updateSpectator();
    },
  },
});
</script>
