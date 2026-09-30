<template>
  <div id="player-home" :ref="trackRoot"
    :class="['mb-home', 'mb-home--' + screen, 'mb-setup-step-' + setupStep, {'mb-setup-last': setupStep >= setupSteps.length - 1,'mb-home--acting': acting, 'mb-home--placing': placing, 'mb-home--setup': isSetupPhase}]">
    <!-- Mobil-Ansicht der Spieleransicht (Handy, Tablet hoch und quer): immer nur ein Bildschirm, unten die Fußleiste.
         "Zug" öffnet das Aktionsmenü als Sheet; in einer Aufgabe wird die Fußleiste zur Aufgabenleiste
         (Abbrechen + Bestätigen/Bezahlen der Eingabe). -->

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

    <main class="mb-main">
      <!-- Mars: Brett ohne Skalen-Ring, darunter die Parameter als Balken, dann Meilensteine usw. aus GameBoardView -->
      <section v-show="screen === 'mars'" class="mb-screen mb-screen--mars">
        <!-- Zugstatus wie im Mockup nur hier: wer dran ist, welche Aktion, eigene Spielzeit -->
        <div :class="['mb-banner', {'mb-banner--waiting': !acting}]">
          <span class="mb-banner-dot"></span>
          <span class="mb-banner-title">{{ bannerTitle }}</span>
          <span class="mb-banner-sub">{{ bannerSub }}</span>
          <PlayerTimer v-if="game.gameOptions.showTimers" class="mb-banner-timer" :timer="thisPlayer.timer" :live="game.phase !== 'end'"/>
        </div>
        <GameBoardView
          ref="gameBoardView"
          :game="game"
          :tileView="tileView"
          :players="playerView.players"
          :viewerColor="thisPlayer.color"
          @toggleTileView="cycleTileView()"
        />
        <!-- Antippen des Mars öffnet ebenfalls die Großansicht (GameBoardView) -->
        <button type="button" class="mb-mars-zoom" @click="zoomMars">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6"/></svg>
          {{ $t('Zoom') }}
        </button>
        <MobileParameterBars
          :temperature="game.temperature"
          :oxygen="game.oxygenLevel"
          :oceans="game.oceans"
          :venus="hasVenus ? game.venusScaleLevel : undefined"/>
        <div v-if="playerView.players.length > 1" class="mb-quick">
          <button type="button" @click="showMilestones">{{ $t('Milestones') }} <b>{{ claimedMilestones }}/{{ maxMilestones }}</b></button>
          <button type="button" @click="showMilestones">{{ $t('Awards') }} <b>{{ fundedAwards }}/{{ maxAwards }}</b></button>
        </div>
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

      <section v-show="screen === 'hand'" class="mb-screen mb-screen--hand" @click.capture="zoomCard">
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

      <section v-show="screen === 'players'" class="mb-screen mb-screen--players" @click.capture="zoomCard">
        <SetupTurnOrder v-if="isSetupPhase" :players="playerView.players"/>
        <template v-else>
          <div v-if="playerView.players.length > 1" class="mb-segments" role="tablist">
            <button v-for="segment in playerSegments" :key="segment.key" type="button" role="tab"
              :aria-selected="playersSegment === segment.key"
              :class="['mb-segment', {'mb-segment--active': playersSegment === segment.key}]"
              @click="playersSegment = segment.key">{{ $t(segment.label) }}</button>
          </div>
          <PlayersOverview v-show="playersSegment === 'players'" :playerView="playerView" v-trim-whitespace/>
          <!-- Hülle trägt v-show: die Tabelle selbst ist in der Mobil-Ansicht per !important sichtbar geschaltet -->
          <div v-if="playerView.players.length > 1" v-show="playersSegment === 'ma'" class="mb-ma">
            <MilestoneAwardTable :milestones="game.milestones" :awards="game.awards" :players="playerView.players" :viewerColor="thisPlayer.color"/>
          </div>
        </template>
      </section>

      <section v-show="screen === 'log'" class="mb-screen mb-screen--log">
        <LogPanel v-if="!isSetupPhase" :viewModel="playerView" @spaceClicked="showSpace"/>
      </section>

      <!-- Eingabe bleibt immer eingebunden: WaitingFor fragt den Server nach dem eigenen Zug.
           Als Aufgaben-Ansicht: Kopf mit Zurück, Titel und Zähler, darunter nur der Inhalt der gewählten Aufgabe -->
      <section v-show="screen === 'turn'" class="mb-screen mb-screen--turn" ref="turnSection">
        <div v-if="!isSetupPhase && (isActionMenu ? task !== undefined : inputTitle !== undefined)"
          :class="['mb-task-head', isActionMenu && task?.tone !== undefined && task.tone !== 'highlight' ? 'mb-task-head--' + task.tone : '']">
          <button type="button" class="mb-icon-button" :aria-label="$t('Back')" @click="leaveTask">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <template v-if="isActionMenu && task !== undefined">
            <span class="mb-task-title">{{ $t(task.label) }}</span>
            <span class="mb-task-sub">{{ taskSubText(task) }}</span>
          </template>
          <span v-else class="mb-task-title">{{ inputTitle }}</span>
        </div>
        <!-- Startauswahl in Schritten wie im Mockup: Konzern, Präludien, Karten – immer nur eine Spalte sichtbar -->
        <div v-if="isSetupPhase && setupSteps.length > 1" class="mb-steps" role="tablist">
          <button v-for="(step, index) in setupSteps" :key="index" type="button" role="tab"
            :aria-selected="setupStep === index"
            :class="['mb-step', {'mb-step--active': setupStep === index, 'mb-step--done': step.done}]"
            @click="showSetupStep(index)">
            <span class="mb-step-number">{{ index + 1 }}</span>
            <span class="mb-step-title">{{ step.title }}</span>
            <b class="mb-step-count">{{ step.badge }}</b>
          </button>
        </div>
        <PlayerSetupView v-if="isSetupPhase" :playerView="playerView"/>
        <!-- Vor dem letzten Schritt: "Weiter" statt Start (der Start-Knopf der Auswahl erscheint im letzten Schritt) -->
        <button v-if="isSetupPhase && setupStep < setupSteps.length - 1" type="button"
          class="btn btn-submit btn-rounded mb-setup-next" @click="showSetupStep(setupStep + 1)">
          {{ nextStepLabel }}
        </button>
        <template v-else>
          <p v-if="playerView.waitingFor === undefined" class="mb-empty">{{ bannerTitle }}</p>
          <WaitingFor v-if="game.phase !== 'end'" :playerView="playerView" :waitingfor="playerView.waitingFor"/>
          <!-- Karten-Karussell (Karte spielen): Position und Anzahl, Punkt antippen wischt dorthin -->
          <div v-if="carousel !== undefined && carousel.count > 1" class="mb-dots">
            <button v-for="index in carousel.count" :key="index" type="button"
              :class="['mb-dot', {'mb-dot--active': index - 1 === carousel.index}]"
              :aria-label="String(index)" @click="scrollCarousel(index - 1)"></button>
            <span class="mb-dots-count">{{ carousel.index + 1 }} / {{ carousel.count }}</span>
          </div>
        </template>
      </section>
    </main>

    <!-- Aufgabenleiste: auf dem Zug-Bildschirm und während einer Feldwahl; Bestätigen/Bezahlen sitzen rechts daneben (mobile.less) -->
    <div v-if="screen === 'turn' || placing" class="mb-taskbar">
      <button type="button" class="mb-taskbar-back" @click="leaveTask">{{ $t(screen !== 'turn' ? 'Actions' : isActionMenu ? 'Cancel' : 'Back') }}</button>
      <template v-if="screen !== 'turn'">
        <span class="mb-taskbar-hint">{{ $t('Tap a highlighted space') }}</span>
        <button type="button" class="btn btn-submit btn-rounded mb-taskbar-zoom" @click="zoomMars">{{ $t('Zoom') }}</button>
      </template>
    </div>
    <nav v-else class="mb-nav" :aria-label="$t('Navigation')">
      <button v-for="item in navItems" :key="item.screen" type="button"
        :class="['mb-nav-item', 'mb-nav-item--' + item.screen, {'mb-nav-item--active': screen === item.screen}]"
        @click="navigate(item.screen)">
        <span v-if="item.icon === undefined" :class="['mb-turn-button', {'mb-turn-button--idle': !acting}]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>
        </span>
        <img v-else :src="item.icon" alt="">
        <span v-if="item.screen === 'hand' && cardsInHandCount > 0" class="mb-nav-badge">{{ cardsInHandCount }}</span>
        <span class="mb-nav-label">{{ $t(item.label) }}</span>
      </button>
    </nav>

    <MobileCardZoom v-if="zoomedCard !== undefined" :card="zoomedCard" :origin="zoomedCardOrigin" :playable="zoomedCardPlayTile !== undefined"
      @close="zoomedCard = undefined" @play="playZoomedCard"/>
    <MobileTurnSheet v-if="sheetOpen && menu !== undefined" :menu="menu" :title="bannerTitle" :sub="bannerSub"
      @close="sheetOpen = false" @select="startTask"/>
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
import MobileTurnSheet from '@/client/components/mobile/MobileTurnSheet.vue';
import MobileCardZoom from '@/client/components/mobile/MobileCardZoom.vue';
import {CardModel} from '@/common/models/CardModel';
import PlayerTimer from '@/client/components/overview/PlayerTimer.vue';
import MilestoneAwardTable from '@/client/components/milestoneAwardTable/MilestoneAwardTable.vue';
import {TurnMenu, TurnMenuTile, buildTurnMenu, playableCardTile, readInputTitle, selectTurnMenuTile} from '@/client/components/mobile/turnMenu';
import {isChoiceMenu} from '@/client/components/choiceMenu';
import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';
import {MOBILE_NAV, MobileNavItem, MobileScreen} from '@/client/components/mobile/mobileScreens';
import {isBoardPlacementActive} from '@/client/components/board/boardPlacementActive';
import {ownActiveCards} from '@/client/utils/ownActiveCards';
import {playersToWaitFor} from '@/client/utils/playersToWaitFor';
import {requestPlacementZoom} from '@/client/components/board/placementZoom';
import {CarouselState, observeCardCarousel, scrollCarouselTo} from '@/client/components/mobile/cardCarousel';

// Aufräumfunktion der Beobachter (Feldwahl, Karussell); pro Seite gibt es nur eine Spieleransicht
let stopObserving: (() => void) | undefined;

// Sichtbarer Fußbereich der Eingabe (Bestätigen, Bezahlen); fest unten, der Inhalt braucht darunter so viel Platz
const FOOTER_SELECTOR = '.mb-screen--turn .or-tab-footer, .mb-screen--turn .setup-summary';

function updateFooterSpace(root: HTMLElement): void {
  const heights = Array.from(root.querySelectorAll<HTMLElement>(FOOTER_SELECTOR)).map((footer) => footer.offsetHeight);
  const value = Math.max(0, ...heights) + 'px';
  if (root.style.getPropertyValue('--mb-footer-height') !== value) {
    root.style.setProperty('--mb-footer-height', value);
  }
}

type DataModel = {
  screen: MobileScreen;
  placing: boolean;
  sheetOpen: boolean;
  // Im Sheet gewählte Aktion; ihr Label und ihre Unterzeile bilden den Aufgaben-Kopf
  task: TurnMenuTile | undefined;
  // Titel einer Eingabe außerhalb des Aktionsmenüs (aus dem Eingabe-Tab gelesen)
  inputTitle: string | undefined;
  playersSegment: PlayersSegment;
  carousel: CarouselState | undefined;
  // Groß angezeigte Karte (Antippen in Hand bzw. Spieler-Bildschirm)
  zoomedCard: CardModel | undefined;
  zoomedCardOrigin: DOMRect | undefined;
  // Schritte der Startauswahl (aus den Spalten von SelectInitialCards gelesen) und der sichtbare
  setupSteps: Array<SetupStep>;
  setupStep: number;
};

type SetupStep = {title: string, badge: string, done: boolean};

// Spalten der Startauswahl (SelectInitialCards): Titel, Zähler, erledigt
function readSetupSteps(root: HTMLElement): Array<SetupStep> {
  const columns = root.querySelector('.mb-screen--turn .setup-columns');
  return Array.from(columns?.querySelectorAll<HTMLElement>(':scope > .setup-column') ?? []).map((column) => {
    const count = column.querySelector('.setup-column-count');
    return {
      title: column.querySelector('.setup-column-title')?.textContent?.trim() ?? '',
      badge: count?.textContent?.trim() ?? '',
      done: count?.classList.contains('setup-column-count--done') ?? false,
    };
  });
}

// Klasse, an der Card.vue den Kartennamen zeigt ('card-' + Name in Kleinbuchstaben, Leerzeichen als '-')
function cardClassName(name: string): string {
  return 'card-' + name.toLowerCase().replaceAll(' ', '-');
}

// Umschalter im Spieler-Bildschirm wie im Mockup
const PLAYER_SEGMENTS = [
  {key: 'players', label: 'Players'},
  {key: 'ma', label: 'Milestones & awards'},
] as const;
type PlayersSegment = typeof PLAYER_SEGMENTS[number]['key'];

// Zuletzt gewählter Bildschirm außerhalb der Aufgabe. Nach jedem Server-Update wird die Ansicht neu aufgebaut
// (App.vue: key), der Bildschirm soll dabei erhalten bleiben
let rememberedScreen: MobileScreen = 'mars';

/* True, wenn `input` das Aktionsmenü des Zuges ist (dieselbe Unterscheidung wie WaitingFor). */
function isActionMenuInput(input: PlayerInputModel | undefined): boolean {
  return input !== undefined && !input.optional && input.type === 'or' && !isChoiceMenu(input);
}

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
    const waitingFor = this.playerView.waitingFor;
    const menu = isActionMenuInput(waitingFor);
    // Aktionsmenü: Sheet über dem bisherigen Bildschirm; andere Pflicht-Eingaben direkt als Aufgabe
    const acting = waitingFor !== undefined && !waitingFor.optional;
    return {
      screen: acting && !menu ? 'turn' : rememberedScreen,
      placing: false,
      sheetOpen: menu,
      task: undefined,
      inputTitle: undefined,
      playersSegment: 'players',
      carousel: undefined,
      zoomedCard: undefined,
      zoomedCardOrigin: undefined,
      setupSteps: [],
      setupStep: 0,
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
    MobileTurnSheet,
    MobileCardZoom,
    PlayerTimer,
    MilestoneAwardTable,
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
    // Alle Karten, die man antippen kann: eigene Hand, Draft, gespielte Karten aller Spieler
    knownCards(): Array<CardModel> {
      const view = this.playerView;
      return [
        ...view.cardsInHand, ...view.preludeCardsInHand, ...view.ceoCardsInHand, ...view.draftedCards,
        ...view.players.flatMap((player) => player.tableau),
      ];
    },
    zoomedCardPlayTile(): TurnMenuTile | undefined {
      const card = this.zoomedCard;
      return card === undefined ? undefined :
        playableCardTile(this.menu, this.isActionMenu ? this.playerView.waitingFor as OrOptionsModel : undefined, card.name);
    },
    nextStepLabel(): string {
      const next = this.setupSteps[this.setupStep + 1];
      return next === undefined ? '' : translateTextWithParams('Next: ${0}', [next.title]);
    },
    playerSegments(): typeof PLAYER_SEGMENTS {
      return PLAYER_SEGMENTS;
    },
    claimedMilestones(): number {
      return this.game.milestones.filter((milestone) => milestone.playerName !== undefined).length;
    },
    fundedAwards(): number {
      return this.game.awards.filter((award) => award.playerName !== undefined).length;
    },
    maxMilestones(): number {
      return constants.MAX_MILESTONES;
    },
    maxAwards(): number {
      return constants.MAX_AWARDS;
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
    isActionMenu(): boolean {
      return isActionMenuInput(this.playerView.waitingFor);
    },
    menu(): TurnMenu | undefined {
      return this.isActionMenu ? buildTurnMenu(this.playerView.waitingFor as OrOptionsModel, this.game.temperature) : undefined;
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

  mounted() {
    // Titel einer schon gerenderten Eingabe lesen (Aufgaben-Kopf außerhalb des Aktionsmenüs)
    this.$nextTick(() => this.refreshInputTitle());
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
      if (screen !== 'turn') {
        rememberedScreen = screen;
      }
      window.scrollTo({top: 0});
    },
    // Fußleiste: "Zug" öffnet das Aktionsmenü als Sheet, alle anderen wechseln den Bildschirm
    navigate(screen: MobileScreen) {
      if (screen === 'turn' && this.isActionMenu) {
        this.openSheet();
      } else {
        this.go(screen);
      }
    },
    openSheet() {
      this.sheetOpen = true;
    },
    // Kachel im Sheet: passende Aktion im Menü wählen und als Aufgabe zeigen
    startTask(index: number) {
      const section = this.$refs.turnSection as HTMLElement | undefined;
      if (section !== undefined) {
        selectTurnMenuTile(section, index);
      }
      const menu = this.menu;
      this.task = menu === undefined ? undefined :
        [...menu.available, ...menu.actions, menu.skip, menu.pass].find((tile) => tile?.index === index);
      this.sheetOpen = false;
      this.go('turn');
    },
    // Aufgabe abbrechen: zurück zum Menü (bzw. zum Mars); aus der Feldwahl zurück in die Aufgabe
    leaveTask() {
      if (this.screen !== 'turn') {
        this.go('turn');
      } else if (this.isActionMenu) {
        this.go(rememberedScreen);
        this.openSheet();
      } else {
        this.go('mars');
      }
    },
    taskSubText(tile: TurnMenuTile): string {
      return tile.sub === undefined ? '' : translateTextWithParams(tile.sub.text, tile.sub.params);
    },
    refreshInputTitle() {
      const section = this.$refs.turnSection as HTMLElement | undefined;
      const title = section === undefined ? undefined : readInputTitle(section);
      if (title !== this.inputTitle) {
        this.inputTitle = title;
      }
    },
    // Großes, zoombares Brett für die Feldwahl (BoardZoomModal)
    zoomMars() {
      requestPlacementZoom();
    },
    // Karte antippen: groß zeigen (Klick auf Bedienelemente der Karte bleibt unberührt)
    zoomCard(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const container = target?.closest('.card-container');
      if (container === null || container === undefined || target?.closest('button, a, input') !== null) {
        return;
      }
      const card = this.knownCards.find((entry) => container.classList.contains(cardClassName(entry.name)));
      if (card !== undefined) {
        event.stopPropagation();
        this.zoomedCardOrigin = container.getBoundingClientRect();
        this.zoomedCard = card;
      }
    },
    // "Karte spielen" aus der Großansicht: Karussell öffnen und zu dieser Karte wischen
    playZoomedCard() {
      const card = this.zoomedCard;
      const tile = this.zoomedCardPlayTile;
      this.zoomedCard = undefined;
      if (card === undefined || tile === undefined) {
        return;
      }
      this.startTask(tile.index);
      this.$nextTick(() => {
        const section = this.$refs.turnSection as HTMLElement | undefined;
        const labels = Array.from(section?.querySelectorAll('.payments_cont > label.payments_cards') ?? []);
        const index = labels.findIndex((label) => label.querySelector('.' + cardClassName(card.name)) !== null);
        if (index >= 0) {
          this.scrollCarousel(index);
        }
      });
    },
    showSetupStep(index: number) {
      this.setupStep = index;
      window.scrollTo({top: 0});
    },
    refreshSetupSteps(root: HTMLElement) {
      const steps = readSetupSteps(root);
      if (JSON.stringify(steps) !== JSON.stringify(this.setupSteps)) {
        this.setupSteps = steps;
      }
    },
    scrollCarousel(index: number) {
      const section = this.$refs.turnSection as HTMLElement | undefined;
      if (section !== undefined) {
        scrollCarouselTo(section, index);
      }
    },
    showMilestones() {
      this.playersSegment = 'ma';
      this.go('players');
    },
    showSpace(spaceId: SpaceId) {
      this.go('mars');
      this.onSpaceClicked(spaceId);
    },
    // Feldwahl (SelectSpace) erkennen: dann gleich der große Mars; die Eingabe bleibt im Hintergrund eingebunden
    updatePlacing(root: HTMLElement) {
      // Eine Feldwahl im Menü zählt erst, wenn sie als Aufgabe gewählt ist (oder als eigene Eingabe kommt)
      const placing = isBoardPlacementActive(root) && (this.placing || this.screen === 'turn' || !this.isActionMenu);
      if (placing !== this.placing) {
        this.placing = placing;
        // Feldwahl gleich im großen, zoombaren Mars (BoardZoomModal) wie im Mockup
        if (placing) {
          requestPlacementZoom();
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
      const placement = new MutationObserver(() => {
        this.updatePlacing(element);
        updateFooterSpace(element);
        this.refreshInputTitle();
        this.refreshSetupSteps(element);
      });
      placement.observe(element, {childList: true, subtree: true, attributes: true, attributeFilter: ['class']});
      const stopCarousel = observeCardCarousel(element, (state) => {
        if (state?.count !== this.carousel?.count || state?.index !== this.carousel?.index) {
          this.carousel = state;
        }
      });
      stopObserving = () => {
        placement.disconnect();
        stopCarousel();
      };
    },
  },
});
</script>
