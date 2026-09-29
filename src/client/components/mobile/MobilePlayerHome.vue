<template>
  <div id="player-home" :ref="trackRoot"
    :class="['mb-home', 'mb-home--' + screen, {'mb-home--acting': acting, 'mb-home--placing': placing, 'mb-home--setup': isSetupPhase}]">
    <!-- Mobil-Ansicht der Spieleransicht (Handy, Tablet hoch und quer): immer nur ein Bildschirm, unten die Fußleiste.
         Auf dem Zug-Bildschirm wird die Fußleiste zur Aufgabenleiste (Zurück + Bestätigen/Bezahlen der Eingabe). -->

    <button type="button" class="mb-top" @click="go('players')" :aria-label="$t('Players')">
      <span class="mb-top-gen">{{ $t('Gen') }} <b>{{ game.generation }}</b></span>
      <span class="mb-top-globals">
        <span class="mb-top-global"><img src="assets/global-parameters/oxygen.png" alt="">{{ game.oxygenLevel }} %</span>
        <span class="mb-top-global"><img src="assets/global-parameters/temperature.png" alt="">{{ game.temperature }} °C</span>
        <span class="mb-top-global"><img src="assets/tiles/ocean.png" alt="">{{ game.oceans }}/{{ maxOceans }}</span>
        <span v-if="hasVenus" class="mb-top-global"><img src="assets/global-parameters/venus.png" alt="">{{ game.venusScaleLevel }} %</span>
      </span>
      <span class="mb-top-money">
        <i class="resource_icon resource_icon--megacredits"></i>
        <b>{{ thisPlayer.megacredits }}</b>
        <small>{{ signed(thisPlayer.megacreditProduction) }}</small>
      </span>
    </button>

    <div :class="['mb-banner', {'mb-banner--waiting': !acting}]">
      <span class="mb-banner-dot"></span>
      <span class="mb-banner-title">{{ bannerTitle }}</span>
      <span class="mb-banner-sub">{{ bannerSub }}</span>
    </div>

    <main class="mb-main">
      <!-- Mars: Brett ohne Skalen-Ring, darunter die Parameter als Balken, dann Meilensteine usw. aus GameBoardView -->
      <section v-show="screen === 'mars'" class="mb-screen mb-screen--mars">
        <GameBoardView
          ref="gameBoardView"
          :game="game"
          :tileView="tileView"
          :players="playerView.players"
          :viewerColor="thisPlayer.color"
          @toggleTileView="cycleTileView()"
        />
        <MobileParameterBars
          :temperature="game.temperature"
          :oxygen="game.oxygenLevel"
          :oceans="game.oceans"
          :venus="hasVenus ? game.venusScaleLevel : undefined"/>
        <GameOverNotice v-if="game.phase === 'end'" :participantId="playerView.id"/>
        <div v-if="game.colonies.length > 0" class="mb-colonies">
          <h3 class="mb-section-label">{{ $t('Colonies') }}</h3>
          <div class="player_home_colony_cont">
            <div class="player_home_colony" v-for="colony in game.colonies" :key="colony.name">
              <Colony :colony="colony" :active="colony.isActive"/>
            </div>
          </div>
        </div>
        <div v-if="thisPlayer.underworldData.tokens.length > 0" class="mb-underground">
          <h3 class="mb-section-label">{{ $t('Claimed Underground Resource Tokens') }}</h3>
          <UndergroundTokens :underworldData="thisPlayer.underworldData"/>
        </div>
      </section>

      <section v-show="screen === 'hand'" class="mb-screen mb-screen--hand">
        <div v-if="playerView.draftedCards.length > 0" class="mb-drafted">
          <h3 class="mb-section-label">{{ $t('Drafted cards') }}</h3>
          <div class="mb-card-list">
            <div v-for="card in playerView.draftedCards" :key="card.name" class="cardbox">
              <Card :card="card"/>
            </div>
          </div>
        </div>
        <HandCardsPanel :playerView="playerView"/>
        <p v-if="!hasHandPanelContent" class="mb-empty">{{ $t('No cards in hand') }}</p>
      </section>

      <section v-show="screen === 'players'" class="mb-screen mb-screen--players">
        <SetupTurnOrder v-if="isSetupPhase" :players="playerView.players"/>
        <PlayersOverview v-else :playerView="playerView" v-trim-whitespace/>
      </section>

      <section v-show="screen === 'log'" class="mb-screen mb-screen--log">
        <LogPanel v-if="!isSetupPhase" :viewModel="playerView" @spaceClicked="showSpace"/>
      </section>

      <!-- Eingabe bleibt immer eingebunden: WaitingFor fragt den Server nach dem eigenen Zug -->
      <section v-show="screen === 'turn'" class="mb-screen mb-screen--turn">
        <PlayerSetupView v-if="isSetupPhase" :playerView="playerView"/>
        <template v-else>
          <p v-if="playerView.waitingFor === undefined" class="mb-empty">{{ bannerTitle }}</p>
          <WaitingFor v-if="game.phase !== 'end'" :playerView="playerView" :waitingfor="playerView.waitingFor"/>
        </template>
      </section>
    </main>

    <!-- Aufgabenleiste: auf dem Zug-Bildschirm und während einer Feldwahl; Bestätigen/Bezahlen sitzen rechts daneben (mobile.less) -->
    <div v-if="screen === 'turn' || placing" class="mb-taskbar">
      <button type="button" class="mb-taskbar-back" @click="leaveTask">{{ $t(screen === 'turn' ? 'Back' : 'Actions') }}</button>
      <template v-if="screen !== 'turn'">
        <span class="mb-taskbar-hint">{{ $t('Tap a highlighted space') }}</span>
        <button type="button" class="btn btn-submit btn-rounded mb-taskbar-zoom" @click="zoomMars">{{ $t('Zoom') }}</button>
      </template>
    </div>
    <nav v-else class="mb-nav" :aria-label="$t('Navigation')">
      <button v-for="item in navItems" :key="item.screen" type="button"
        :class="['mb-nav-item', 'mb-nav-item--' + item.screen, {'mb-nav-item--active': screen === item.screen}]"
        @click="go(item.screen)">
        <span v-if="item.icon === undefined" :class="['mb-turn-button', {'mb-turn-button--idle': !acting}]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>
        </span>
        <img v-else :src="item.icon" alt="">
        <span v-if="item.screen === 'hand' && cardsInHandCount > 0" class="mb-nav-badge">{{ cardsInHandCount }}</span>
        <span class="mb-nav-label">{{ $t(item.label) }}</span>
      </button>
    </nav>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import * as constants from '@/common/constants';
import {GameModel} from '@/common/models/GameModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {Phase} from '@/common/Phase';
import {SpaceId} from '@/common/Types';
import {HomeMixin} from '@/client/mixins/HomeMixin';
import {translateTextWithParams} from '@/client/directives/i18n';
import GameBoardView from '@/client/components/GameBoardView.vue';
import GameOverNotice from '@/client/components/gameend/GameOverNotice.vue';
import Colony from '@/client/components/colonies/Colony.vue';
import UndergroundTokens from '@/client/components/underworld/UndergroundTokens.vue';
import Card from '@/client/components/card/Card.vue';
import HandCardsPanel from '@/client/components/HandCardsPanel.vue';
import PlayersOverview from '@/client/components/overview/PlayersOverview.vue';
import SetupTurnOrder from '@/client/components/SetupTurnOrder.vue';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import PlayerSetupView from '@/client/components/PlayerSetupView.vue';
import WaitingFor from '@/client/components/WaitingFor.vue';
import MobileParameterBars from '@/client/components/mobile/MobileParameterBars.vue';
import {MOBILE_NAV, MobileNavItem, MobileScreen} from '@/client/components/mobile/mobileScreens';
import {isBoardPlacementActive} from '@/client/components/board/boardPlacementActive';
import {ownActiveCards} from '@/client/utils/ownActiveCards';
import {playersToWaitFor} from '@/client/utils/playersToWaitFor';
import {requestPlacementZoom} from '@/client/components/board/placementZoom';

// Aufräumfunktion der Feldwahl-Beobachtung; pro Seite gibt es nur eine Spieleransicht
let stopObserving: (() => void) | undefined;

type DataModel = {
  screen: MobileScreen;
  placing: boolean;
};

export default defineComponent({
  name: 'MobilePlayerHome',
  mixins: [HomeMixin],
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
  },
  data(): DataModel {
    return {
      // Wer am Zug ist, landet direkt in der Eingabe, sonst auf dem Mars
      screen: this.playerView.waitingFor !== undefined && !this.playerView.waitingFor.optional ? 'turn' : 'mars',
      placing: false,
    };
  },
  components: {
    GameBoardView,
    GameOverNotice,
    Colony,
    UndergroundTokens,
    Card,
    HandCardsPanel,
    PlayersOverview,
    SetupTurnOrder,
    LogPanel,
    PlayerSetupView,
    WaitingFor,
    MobileParameterBars,
  },
  computed: {
    game(): GameModel {
      return this.playerView.game;
    },
    thisPlayer(): PublicPlayerModel {
      return this.playerView.thisPlayer;
    },
    navItems(): ReadonlyArray<MobileNavItem> {
      return MOBILE_NAV;
    },
    maxOceans(): number {
      return constants.MAX_OCEAN_TILES;
    },
    hasVenus(): boolean {
      return this.game.gameOptions.expansions.venus;
    },
    // Startphase: noch keine Karte ausgespielt (Konzern, Präludien, Startkarten werden gewählt)
    isSetupPhase(): boolean {
      return this.thisPlayer.tableau.length === 0;
    },
    acting(): boolean {
      return this.playerView.waitingFor !== undefined && !this.playerView.waitingFor.optional;
    },
    cardsInHandCount(): number {
      const playerView = this.playerView;
      return playerView.cardsInHand.length + playerView.preludeCardsInHand.length + playerView.ceoCardsInHand.length;
    },
    hasHandPanelContent(): boolean {
      return this.cardsInHandCount > 0 || ownActiveCards(this.playerView).length > 0;
    },
    bannerTitle(): string {
      if (this.game.phase === Phase.END) {
        return this.$t('The game is over!');
      }
      if (this.acting) {
        return this.$t(this.isSetupPhase ? 'Initial selection' : 'Your turn');
      }
      const names = playersToWaitFor(this.playerView).map((player) => player.name);
      return names.length === 0 ? this.$t('Waiting for other players') : translateTextWithParams('Waiting for ${0}', [names.join(', ')]);
    },
    bannerSub(): string {
      if (!this.acting || this.game.phase !== Phase.ACTION) {
        return '';
      }
      return translateTextWithParams('Action ${0} of ${1}', [String(this.thisPlayer.actionsTakenThisRound + 1), '2']);
    },
  },
  watch: {
    // Neue Pflicht-Eingabe (z. B. nach dem Zug der anderen): direkt in die Eingabe wechseln
    acting(now: boolean) {
      if (now && !this.placing) {
        this.screen = 'turn';
      }
    },
  },
  beforeUnmount() {
    stopObserving?.();
    stopObserving = undefined;
  },
  methods: {
    signed(value: number): string {
      return value >= 0 ? '+' + value : String(value);
    },
    go(screen: MobileScreen) {
      this.screen = screen;
      window.scrollTo({top: 0});
    },
    // Aus der Eingabe zurück zum Mars, aus der Feldwahl auf dem Mars zurück ins Aktionsmenü
    leaveTask() {
      this.go(this.screen === 'turn' ? 'mars' : 'turn');
    },
    // Großes, zoombares Brett für die Feldwahl (BoardZoomModal)
    zoomMars() {
      requestPlacementZoom();
    },
    showSpace(spaceId: SpaceId) {
      this.go('mars');
      this.onSpaceClicked(spaceId);
    },
    // Feldwahl (SelectSpace) erkennen: dann den Mars zeigen, die Eingabe bleibt im Hintergrund eingebunden
    updatePlacing(root: HTMLElement) {
      const placing = isBoardPlacementActive(root);
      if (placing !== this.placing) {
        this.placing = placing;
        if (placing) {
          this.go('mars');
        }
      }
    },
    // Funktions-Ref: wird mit dem Element bzw. beim Entfernen mit null aufgerufen
    trackRoot(element: unknown) {
      stopObserving?.();
      stopObserving = undefined;
      if (!(element instanceof HTMLElement)) {
        return;
      }
      const placement = new MutationObserver(() => this.updatePlacing(element));
      placement.observe(element, {childList: true, subtree: true, attributes: true, attributeFilter: ['class']});
      stopObserving = () => placement.disconnect();
    },
  },
});
</script>
