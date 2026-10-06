<template>
  <div id="player-home" :class="{'with-turmoil': game.turmoil, 'player-home--acting': isPlayerActing(playerView), 'player-home--fixed': usesFixedLayout}">
    <!-- player-home--acting: red frame around the viewport while this player is taking their turn (active_player_outline.less).
         Comment deliberately inside the root, otherwise the component would have two root nodes ($el would not be an element) -->
    <TopBar :playerView="playerView" />

    <Sidebar v-trim-whitespace
      :actingPlayer="isPlayerActing(playerView)"
      :playerColor="thisPlayer.color"
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

    <!-- Two-column layout (HomeColumns) also in the start phase (choosing starting cards): selection on the left, board and log on the right -->
    <div>
      <!-- Start phase: game board collapsible (SetupBoardToggle), then the selection columns get the full width -->
      <HomeColumns :boardCollapsed="isSetupPhase && boardCollapsed">
        <template #board>
          <div class="player_home_block player-home-columns__mars">
            <GameBoardView
              ref="gameBoardView"
              :game="game"
              :tileView="tileView"
              :players="playerView.players"
              :viewerColor="playerView.thisPlayer.color"
              @toggleTileView="cycleTileView()"
            />
            <!-- Game end: message above Mars, then automatically to the results page -->
            <GameOverNotice v-if="game.phase === 'end'" :participantId="playerView.id"/>
          </div>
          <!-- Height of the Mars card, the log below gets the rest (only in the fixed layout) -->
          <RowResizeHandle v-if="!isSetupPhase" kind="mars"/>

          <!-- Log below the board: both stay visible together in the two-column layout -->
          <a class="hotkey-target"></a>
          <div v-if="!isSetupPhase" class="player_home_block nofloat player-home-columns__log">
            <LogPanel :viewModel="playerView" milestonesAwards :acting="isPlayerActing(playerView)" @spaceClicked="onSpaceClicked"/>
          </div>
        </template>

        <template #main>
          <a class="hotkey-target"></a>
          <!-- Start phase: only the turn order – the player bars show nothing but zeros there yet -->
          <SetupTurnOrder v-if="isSetupPhase" :players="playerView.players">
            <SetupBoardToggle/>
          </SetupTurnOrder>
          <PlayersOverview v-else class="player_home_block player_home_block--players nofloat" :playerView="playerView" v-trim-whitespace id="shortkey-playersoverview"/>
          <!-- Height of the players card, the tab box below gets the rest (only in the fixed layout) -->
          <RowResizeHandle v-if="!isSetupPhase" kind="players"/>

          <!-- Start phase: starting card selection or draft instead of action menu and hand cards -->
          <PlayerSetupView v-if="isSetupPhase" :playerView="playerView"/>

          <template v-else>
          <a class="hotkey-target"></a>
          <!-- Invisible without an own input (the note on whose turn it is then appears as a red tab by the hand cards);
               WaitingFor stays mounted though, because it polls the server after the own turn -->
          <div class="player_home_block player_home_block--actions nofloat" v-show="playerView.waitingFor !== undefined">
            <a name="actions" class="player_home_anchor"></a>
            <WaitingFor v-if="game.phase !== 'end'" :playerView="playerView" :waitingfor="playerView.waitingFor"/>
          </div>

          <div class="player_home_block player_home_block--hand" v-if="showsDraftedCardsBlock(playerView)">
            <DynamicTitle title="Drafted cards" :color="thisPlayer.color" />
            <div v-for="card in playerView.draftedCards" :key="card.name" class="cardbox">
              <Card :card="card"/>
            </div>
          </div>

          <a name="cards" class="player_home_anchor"></a>
          <!-- Without a pending input (not our turn) the hand cards sit alone in the same tab container.
               Otherwise they are the first tab there above the input (isHandInInputTabs), and this block is dropped. -->
          <div class="player_home_block player_home_block--hand" v-if="hasHandPanelContent && !isHandInInputTabs(playerView)" id="shortkey-hand">
            <div class="or-tabs" role="tablist">
              <HandCardsTab :count="cardsInHandCount" :active="true"/>
              <WaitingForPlayersTab :playerView="playerView"/>
            </div>
            <div v-docked-tab class="or-tab-panel or-tab-panel--view" role="tabpanel">
              <HandCardsPanel :playerView="playerView"/>
            </div>
          </div>

          <!-- Own played cards: as for opponents, via "show" in the player bar (modal) -->
          </template>
        </template>
      </HomeColumns>
    </div>

    <div v-if="thisPlayer.underworldData.tokens.length > 0">
      <DynamicTitle title="Claimed Underground Resource Tokens" :color="thisPlayer.color"/>
      <UndergroundTokens :underworldData="thisPlayer.underworldData"/>
    </div>

    <KeyboardShortcuts v-show="keyboardShortcutOpened" @close="keyboardShortcutOpened = false"/>
  </div>
</template>

<script lang="ts">
import {computed, defineComponent} from 'vue';
import {GAME_MENU_CONTEXT, GameMenuContext} from '@/client/components/gameMenu/gameMenuContext';
import {vDockedTab} from '@/client/directives/DockedTab';

import PlayersOverview from '@/client/components/overview/PlayersOverview.vue';
import WaitingFor from '@/client/components/WaitingFor.vue';
import Sidebar from '@/client/components/Sidebar.vue';
import Card from '@/client/components/card/Card.vue';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import GameBoardView from '@/client/components/GameBoardView.vue';
import PlayerSetupView from '@/client/components/PlayerSetupView.vue';
import HomeColumns from '@/client/components/HomeColumns.vue';
import RowResizeHandle from '@/client/components/RowResizeHandle.vue';
import SetupTurnOrder from '@/client/components/SetupTurnOrder.vue';
import SetupBoardToggle from '@/client/components/SetupBoardToggle.vue';
import {setupBoardCollapsed} from '@/client/components/setupBoardCollapsed';
import DynamicTitle from '@/client/components/common/DynamicTitle.vue';
import GameOverNotice from '@/client/components/gameend/GameOverNotice.vue';
import HandCardsPanel from '@/client/components/HandCardsPanel.vue';
import HandCardsTab from '@/client/components/HandCardsTab.vue';
import WaitingForPlayersTab from '@/client/components/WaitingForPlayersTab.vue';
import TopBar from '@/client/components/TopBar.vue';
import UndergroundTokens from '@/client/components/underworld/UndergroundTokens.vue';
import KeyboardShortcuts from '@/client/components/KeyboardShortcuts.vue';
import {GameModel} from '@/common/models/GameModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {HomeMixin} from '@/client/mixins/HomeMixin';
import {isHandInInputTabs} from '@/client/utils/handCards';
import {showsDraftedCardsBlock} from '@/client/utils/draftedCards';
import {ownActiveCards} from '@/client/utils/ownActiveCards';

export default defineComponent({
  name: 'PlayerHome',
  mixins: [HomeMixin],
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
  },
  // Data of the game menu (GameMenu.vue in the players table header and the setup turn order)
  provide() {
    return {
      [GAME_MENU_CONTEXT as symbol]: computed((): GameMenuContext => {
        const game = this.playerView.game;
        return {
          playerName: this.playerView.thisPlayer.name,
          playerColor: this.playerView.thisPlayer.color,
          deckSize: game.deckSize,
          discardPileSize: game.discardPileSize,
          coloniesCount: game.colonies.length,
          gameOptions: game.gameOptions,
          playerNumber: this.playerView.players.length,
          lastSoloGeneration: game.lastSoloGeneration,
          otherDeckSizes: game.otherDeckSizes,
          spectatorId: game.spectatorId,
          expectedPurgeTimeMs: game.expectedPurgeTimeMs,
        };
      }),
    };
  },
  computed: {
    // Game board collapsed in the start phase (shared state, setupBoardCollapsed.ts)
    boardCollapsed(): boolean {
      return setupBoardCollapsed.value;
    },
    // Start phase: no card played yet (corporation, preludes, starting cards are being chosen)
    isSetupPhase(): boolean {
      return this.thisPlayer.tableau.length === 0;
    },
    // Fixed app layout (player_home_fixed.less): only when nothing is left below the columns,
    // otherwise underground markers etc. would no longer be reachable (colonies live in the board tabs)
    usesFixedLayout(): boolean {
      return this.game.phase !== 'end' &&
        this.thisPlayer.underworldData.tokens.length === 0;
    },
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
    // The hand cards block also shows the own active cards – so it stays visible even without hand cards
    hasHandPanelContent(): boolean {
      return this.cardsInHandCount > 0 || ownActiveCards(this.playerView).length > 0;
    },
  },

  directives: {
    dockedTab: vDockedTab,
  },
  components: {
    DynamicTitle,
    GameOverNotice,
    Card,
    PlayersOverview,
    WaitingFor,
    Sidebar,
    LogPanel,
    HandCardsPanel,
    HandCardsTab,
    WaitingForPlayersTab,
    TopBar,
    GameBoardView,
    HomeColumns,
    RowResizeHandle,
    PlayerSetupView,
    SetupTurnOrder,
    SetupBoardToggle,
    UndergroundTokens,
    KeyboardShortcuts,
  },
  methods: {
    showsDraftedCardsBlock,
    isHandInInputTabs,
    isPlayerActing(playerView: PlayerViewModel) : boolean {
      return playerView.players.length > 1 && playerView.waitingFor !== undefined && !playerView.waitingFor.optional;
    },
  },
});

</script>
