<template>
  <div id="player-home" :ref="trackRoot"
    :class="['mb-home', 'mb-home--' + screen, 'mb-setup-step-' + setupStep, {'mb-setup-last': setupStep >= setupSteps.length - 1,'mb-home--acting': acting, 'mb-home--placing': placing, 'mb-home--setup': isSetupPhase}]">
    <!-- Mobile player view (phone, tablet portrait and landscape): always just one screen, footer bar at the bottom.
         "Turn" opens the action menu as a sheet; inside a task the footer bar becomes the task bar
         (Cancel + Confirm/Pay for the input). -->

    <MobileHeader :game="game" @click="go('players')" :aria-label="$t('Players')">
      <span class="mb-top-money">
        <i class="resource_icon resource_icon--megacredits"></i>
        <b>{{ thisPlayer.megacredits }}</b>
        <small>{{ signed(thisPlayer.megacreditProduction) }}</small>
      </span>
    </MobileHeader>

    <main class="mb-main">
      <MobileMarsScreen v-show="screen === 'mars'" ref="gameBoardView"
        :game="game" :players="playerView.players" :participantId="playerView.id" :tileView="tileView"
        :acting="acting" :bannerTitle="bannerTitle" :viewerColor="thisPlayer.color"
        @toggleTileView="cycleTileView()" @showMilestones="showMilestones">
        <template #timer>
          <PlayerTimer v-if="game.gameOptions.showTimers" class="mb-banner-timer" :timer="thisPlayer.timer" :live="game.phase !== 'end'"/>
        </template>
        <div v-if="thisPlayer.underworldData.tokens.length > 0" class="mb-underground">
          <h3 class="mb-section-label">{{ $t('Claimed Underground Resource Tokens') }}</h3>
          <UndergroundTokens :underworldData="thisPlayer.underworldData"/>
        </div>
      </MobileMarsScreen>

      <section v-show="screen === 'hand'" class="mb-screen mb-screen--hand" @click.capture="zoomCard">
        <div v-if="playerView.draftedCards.length > 0" class="mb-drafted">
          <h3 class="mb-section-label">{{ $t('Drafted cards') }}</h3>
          <div class="mb-card-list">
            <div v-for="card in playerView.draftedCards" :key="card.name" class="cardbox">
              <Card :card="card"/>
            </div>
          </div>
        </div>
        <HandCardsPanel :playerView="playerView" hideUndergroundTokens/>
      </section>

      <!-- From three players on, the tables scroll horizontally beneath sticky icon columns (mobile.less) -->
      <section v-show="screen === 'players'" :class="['mb-screen', 'mb-screen--players', {'mb-screen--players-scroll': playerView.players.length > 2}]"
        @click.capture="zoomCard" @scroll.capture="markHorizontalScroll">
        <SetupTurnOrder v-if="isSetupPhase" :players="playerView.players"/>
        <MobilePlayersPanel v-else :viewModel="playerView" :viewerColor="thisPlayer.color" v-model:segment="playersSegment"/>
      </section>

      <section v-show="screen === 'log'" class="mb-screen mb-screen--log">
        <LogPanel v-if="!isSetupPhase" :viewModel="playerView" zoomCarousel @spaceClicked="showSpace"/>
      </section>

      <!-- The input always stays mounted: WaitingFor asks the server about the own turn.
           As task view: header with Back, title and counter, below it only the content of the chosen task -->
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
        <!-- Initial selection confirmed: header like a task, below it the own selection (PlayerSetupView); status of who is still choosing -->
        <div v-else-if="isSetupConfirmed" class="mb-task-head">
          <button type="button" class="mb-icon-button" :aria-label="$t('Back')" @click="go('mars')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span class="mb-task-title">{{ $t('Your selection') }}</span>
          <span class="mb-task-sub">{{ bannerTitle }}</span>
        </div>
        <!-- Initial selection in steps like in the mockup: corporation, preludes, cards – only one column visible at a time -->
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
        <!-- Before the last step: "Next" instead of Start (the selection's start button appears in the last step) -->
        <button v-if="isSetupPhase && setupStep < setupSteps.length - 1" type="button"
          class="btn btn-submit btn-rounded mb-setup-next" @click="showSetupStep(setupStep + 1)">
          {{ nextStepLabel }}
        </button>
        <!-- During initial selection the input already lives in PlayerSetupView; a second one (WaitingFor) in the last
             step would have laid its own empty balance bar over the correct one -->
        <template v-else-if="!isSetupPhase">
          <p v-if="playerView.waitingFor === undefined" class="mb-empty">{{ bannerTitle }}</p>
          <WaitingFor v-if="game.phase !== 'end'" :playerView="playerView" :waitingfor="playerView.waitingFor"/>
          <!-- Card carousel (play card): position and count, tapping a dot swipes there -->
          <div v-if="carousel !== undefined && carousel.count > 1" class="mb-dots">
            <button v-for="index in carousel.count" :key="index" type="button"
              :class="['mb-dot', {'mb-dot--active': index - 1 === carousel.index}]"
              :aria-label="String(index)" @click="scrollCarousel(index - 1)"></button>
            <span class="mb-dots-count">{{ carousel.index + 1 }} / {{ carousel.count }}</span>
          </div>
        </template>
      </section>
    </main>

    <!-- Task bar: on the turn screen and during space selection; Confirm/Pay sit to its right (mobile.less).
         After the initial selection is confirmed there is nothing to confirm: then the navigation stays -->
    <div v-if="(screen === 'turn' && !isSetupConfirmed) || placing" class="mb-taskbar">
      <!-- Back as an icon: no own texts besides the existing translations -->
      <button type="button" class="mb-taskbar-back" :aria-label="$t('Close')" @click="leaveTask"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
      <template v-if="screen !== 'turn'">
        <span class="mb-taskbar-hint">{{ task !== undefined ? $t(task.label) : '' }}</span>
        <button type="button" class="btn btn-submit btn-rounded mb-taskbar-zoom" @click="zoomMars">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6"/></svg>
        </button>
      </template>
    </div>
    <MobileNav v-else :items="navItems" :active="screen" :handCount="cardsInHandCount" @navigate="navigate">
      <template #turn>
        <!-- While the turn sheet is open (incl. sliding in/out), its own button moves with it; this one stays invisible -->
        <MobileTurnButton :class="{'mb-turn-button--lifted': turnButtonLifted}"
          :acting="acting" :action-number="actionNumber" :actions-per-turn="actionsPerTurn"/>
      </template>
    </MobileNav>

    <MobileCardZoom v-if="zoomedCard !== undefined" :count="zoomedCardList.length" :index="zoomedCardIndex" :origin="zoomedCardOrigin"
      :playable="zoomedCardPlayTile !== undefined" @close="zoomedCard = undefined" @play="playZoomedCard" @update:index="showZoomedCard">
      <template #slide="{index}">
        <Card :card="zoomedCardList[index]"/>
      </template>
    </MobileCardZoom>
    <Transition name="mb-sheet" @before-enter="turnButtonLifted = true" @after-leave="turnButtonLifted = false">
      <MobileTurnSheet v-if="sheetOpen && (menu !== undefined || !acting)" :menu="menu" :waitingPlayers="waitingPlayers" :title="bannerTitle"
        :action-number="actionNumber" :actions-per-turn="actionsPerTurn" :playerView="playerView" @close="sheetOpen = false" @select="startTask" @confirm="confirmTask"/>
    </Transition>
  </div>
</template>

<script lang="ts">
import {isDraftRepick} from '@/client/utils/draftedCards';
import {defineComponent, markRaw} from 'vue';
import {GameModel} from '@/common/models/GameModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {Phase} from '@/common/Phase';
import {SpaceId} from '@/common/Types';
import {HomeMixin} from '@/client/mixins/HomeMixin';
import UndergroundTokens from '@/client/components/underworld/UndergroundTokens.vue';
import Card from '@/client/components/card/Card.vue';
import HandCardsPanel from '@/client/components/HandCardsPanel.vue';
import SetupTurnOrder from '@/client/components/SetupTurnOrder.vue';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import PlayerSetupView from '@/client/components/PlayerSetupView.vue';
import WaitingFor from '@/client/components/WaitingFor.vue';
import MobileTurnSheet from '@/client/components/mobile/MobileTurnSheet.vue';
import MobileCardZoom from '@/client/components/mobile/MobileCardZoom.vue';
import MobileTurnButton from '@/client/components/mobile/MobileTurnButton.vue';
import {CardModel} from '@/common/models/CardModel';
import PlayerTimer from '@/client/components/overview/PlayerTimer.vue';
import {TurnMenu, TurnMenuTile, buildTurnMenu, playableCardTile, readInputTitle, findTurnMenuTile, selectTurnMenuTile, submitTurnMenuTile} from '@/client/components/mobile/turnMenu';
import {isChoiceMenu} from '@/client/components/choiceMenu';
import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';
import {MOBILE_NAV, MobileNavItem, MobileScreen, PlayersSegment} from '@/client/components/mobile/mobileScreens';
import MobileHeader from '@/client/components/mobile/MobileHeader.vue';
import MobileMarsScreen from '@/client/components/mobile/MobileMarsScreen.vue';
import MobileNav from '@/client/components/mobile/MobileNav.vue';
import MobilePlayersPanel from '@/client/components/mobile/MobilePlayersPanel.vue';
import {isBoardPlacementActive, placementBoard} from '@/client/components/board/boardPlacementActive';
import {ownActiveCards} from '@/client/utils/ownActiveCards';
import {playersToWaitFor} from '@/client/utils/playersToWaitFor';
import {waitingStatusText} from '@/client/utils/waitingStatusText';
import {requestPlacementZoom} from '@/client/components/board/placementZoom';
import {markHorizontalScroll} from '@/client/components/mobile/horizontalScroll';
import {CarouselState, observeCardCarousel, scrollCarouselTo} from '@/client/components/mobile/cardCarousel';

// Cleanup function of the observers (space selection, carousel); there is only one player view per page
let stopObserving: (() => void) | undefined;

// Visible footer area of the input (Confirm, Pay); fixed at the bottom, the content needs that much space below it
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
  // Turn button moves with the sheet: stays lifted out of the footer bar until closing has finished
  turnButtonLifted: boolean;
  // Action chosen in the sheet; its label and subline form the task header
  task: TurnMenuTile | undefined;
  // Title of an input outside the action menu (read from the input tab)
  inputTitle: string | undefined;
  playersSegment: PlayersSegment;
  carousel: CarouselState | undefined;
  // Card shown large (tap in hand or on a player screen)
  zoomedCard: CardModel | undefined;
  zoomedCardOrigin: DOMRect | undefined;
  // Visible cards of the screen in display order: previous/next in the large view
  zoomedCardList: Array<CardModel>;
  // Screen the card comes from (target of the shrink animation after paging)
  zoomedCardScreen: HTMLElement | undefined;
  // Steps of the initial selection (read from the columns of SelectInitialCards) and the visible one
  setupSteps: Array<SetupStep>;
  setupStep: number;
};

type SetupStep = {title: string, badge: string, done: boolean};

// Columns of the initial selection (SelectInitialCards): title, counter, done
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

// Class on which Card.vue shows the card name ('card-' + name in lowercase, spaces as '-')
function cardClassName(name: string): string {
  return 'card-' + name.toLowerCase().replaceAll(' ', '-');
}


// Last chosen screen outside a task. After every server update the view is rebuilt
// (App.vue: key); the screen should be kept across that
let rememberedScreen: MobileScreen = 'mars';
// Draft repick opened via "Turn": the view is rebuilt on every refresh while waiting for the others,
// so the open card selection must survive that (otherwise it jumps back to Mars)
let draftRepickOpen = false;
// First mount after page load: don't open the turn drawer automatically.
// App.vue rebuilds the view on every server update (playerkey) – there it should keep
// opening, so that after an action the menu for the next one is right there.
let pageJustLoaded = true;

/* True if `input` is the turn's action menu (same distinction as WaitingFor). */
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
    // Action menu: sheet over the previous screen; other mandatory inputs directly as a task
    const acting = waitingFor !== undefined && !waitingFor.optional;
    const openSheet = menu && !pageJustLoaded;
    pageJustLoaded = false;
    return {
      screen: (acting && !menu) || (draftRepickOpen && waitingFor !== undefined && isDraftRepick(this.playerView, waitingFor)) ? 'turn' : rememberedScreen,
      placing: false,
      sheetOpen: openSheet,
      turnButtonLifted: openSheet,
      task: undefined,
      inputTitle: undefined,
      playersSegment: 'players',
      carousel: undefined,
      zoomedCard: undefined,
      zoomedCardOrigin: undefined,
      zoomedCardList: [],
      zoomedCardScreen: undefined,
      setupSteps: [],
      setupStep: 0,
    };
  },
  components: {
    UndergroundTokens,
    Card,
    HandCardsPanel,
    SetupTurnOrder,
    LogPanel,
    PlayerSetupView,
    WaitingFor,
    MobileHeader,
    MobileMarsScreen,
    MobileNav,
    MobilePlayersPanel,
    MobileTurnSheet,
    MobileCardZoom,
    MobileTurnButton,
    PlayerTimer,
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
    // All cards that can be tapped: own hand, draft, played cards of all players
    knownCards(): Array<CardModel> {
      const view = this.playerView;
      return [
        ...view.cardsInHand, ...view.preludeCardsInHand, ...view.ceoCardsInHand, ...view.draftedCards,
        ...view.players.flatMap((player) => player.tableau),
      ];
    },
    zoomedCardIndex(): number {
      const card = this.zoomedCard;
      return card === undefined ? -1 : this.zoomedCardList.findIndex((entry) => entry.name === card.name);
    },
    zoomedCardPlayTile(): TurnMenuTile | undefined {
      const card = this.zoomedCard;
      return card === undefined ? undefined :
        playableCardTile(this.menu, this.isActionMenu ? this.playerView.waitingFor as OrOptionsModel : undefined, card.name);
    },
    nextStepLabel(): string {
      const next = this.setupSteps[this.setupStep + 1];
      return next === undefined ? '' : next.title;
    },
    // Setup phase: no card played yet (corporation, preludes, initial cards are being chosen)
    isSetupPhase(): boolean {
      return this.thisPlayer.tableau.length === 0;
    },
    // Initial selection confirmed, other players still choosing: PlayerSetupView then shows the own selection
    isSetupConfirmed(): boolean {
      return this.isSetupPhase && this.playerView.pickedCorporationCard.length === 1;
    },
    waitingPlayers(): Array<PublicPlayerModel> {
      return playersToWaitFor(this.playerView);
    },
    isActionMenu(): boolean {
      return isActionMenuInput(this.playerView.waitingFor);
    },
    menu(): TurnMenu | undefined {
      return this.isActionMenu ? buildTurnMenu(this.playerView.waitingFor as OrOptionsModel) : undefined;
    },
    acting(): boolean {
      return this.playerView.waitingFor !== undefined && !this.playerView.waitingFor.optional;
    },
    // Draft: the pick can still be changed while the others choose – then "Turn" leads to the cards, not to the waiting sheet
    draftRepick(): boolean {
      const waitingFor = this.playerView.waitingFor;
      return waitingFor !== undefined && isDraftRepick(this.playerView, waitingFor);
    },
    cardsInHandCount(): number {
      const playerView = this.playerView;
      return playerView.cardsInHand.length + playerView.preludeCardsInHand.length + playerView.ceoCardsInHand.length;
    },
    hasHandPanelContent(): boolean {
      return this.cardsInHandCount > 0 || ownActiveCards(this.playerView).length > 0;
    },
    // Only existing translations: title of the input from the server or "… is taking their turn"
    bannerTitle(): string {
      if (this.game.phase === Phase.END) {
        return this.$t('This game is over!');
      }
      const waitingFor = this.playerView.waitingFor;
      if (this.acting && waitingFor !== undefined) {
        return this.$t(waitingFor.title);
      }
      return waitingStatusText(this.playerView, (text) => this.$t(text));
    },
    // The model only knows the actions taken, not the allowed ones; special cases with more actions barely exist
    actionsPerTurn(): number {
      return 2;
    },
    // Which action of this turn is currently due; undefined if it's not your turn in the action phase
    actionNumber(): number | undefined {
      if (!this.acting || this.game.phase !== Phase.ACTION) {
        return undefined;
      }
      return Math.min(this.thisPlayer.actionsTakenThisRound + 1, this.actionsPerTurn);
    },
  },

  mounted() {
    // Read the title of an already rendered input (task header outside the action menu)
    this.$nextTick(() => this.refreshInputTitle());
  },
  beforeUnmount() {
    stopObserving?.();
    stopObserving = undefined;
  },
  methods: {
    markHorizontalScroll,
    signed(value: number): string {
      return value >= 0 ? '+' + value : String(value);
    },
    go(screen: MobileScreen) {
      this.screen = screen;
      draftRepickOpen = screen === 'turn' && this.draftRepick;
      if (screen !== 'turn') {
        rememberedScreen = screen;
      }
      window.scrollTo({top: 0});
    },
    // Footer bar: "Turn" opens the action menu as a sheet (not your turn: sheet showing who is up),
    // all others switch the screen. Exception initial selection: after confirming, the turn screen shows
    // the own selection (PlayerSetupView) – the sheet would only have "waiting for …" and the cards would be unreachable
    navigate(screen: MobileScreen) {
      if (screen === 'turn' && !this.isSetupConfirmed && !this.draftRepick && (this.isActionMenu || !this.acting)) {
        this.openSheet();
      } else {
        this.go(screen);
      }
    },
    openSheet() {
      this.sheetOpen = true;
    },
    // Tile in the sheet: choose the matching action in the menu and show it as a task
    startTask(index: number) {
      const section = this.$refs.turnSection as HTMLElement | undefined;
      if (section !== undefined) {
        selectTurnMenuTile(section, index);
      }
      this.task = findTurnMenuTile(this.menu, index);
      this.sheetOpen = false;
      this.go('turn');
    },
    // Prompt in the sheet confirmed: trigger the tab's button right away (temperature, end turn) or start space selection
    // (greenery: the task immediately opens the large Mars, updatePlacing)
    confirmTask(index: number) {
      if (findTurnMenuTile(this.menu, index)?.confirmation?.action === 'place') {
        this.startTask(index);
        return;
      }
      const section = this.$refs.turnSection as HTMLElement | undefined;
      this.sheetOpen = false;
      if (section !== undefined) {
        submitTurnMenuTile(section, index);
      }
    },
    // Cancel task: back to the menu (or to Mars); from space selection back into the task
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
      if (tile.detail !== undefined) {
        return this.$t(tile.detail);
      }
      return tile.count === undefined ? '' : String(tile.count);
    },
    refreshInputTitle() {
      const section = this.$refs.turnSection as HTMLElement | undefined;
      const title = section === undefined ? undefined : readInputTitle(section);
      if (title !== this.inputTitle) {
        this.inputTitle = title;
      }
    },
    // Large, zoomable board for space selection (BoardZoomModal)
    zoomMars() {
      requestPlacementZoom();
    },
    // Tap a card: show it large (clicks on the card's controls stay untouched)
    zoomCard(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const container = target?.closest('.card-container');
      if (container === null || container === undefined || target?.closest('button, a, input') !== null) {
        return;
      }
      const card = this.cardOfContainer(container);
      if (card !== undefined) {
        event.stopPropagation();
        const screen = event.currentTarget as HTMLElement;
        // markRaw: don't make DOM nodes reactive
        this.zoomedCardScreen = markRaw(screen);
        this.zoomedCardList = this.visibleCards(screen);
        this.zoomedCardOrigin = container.getBoundingClientRect();
        this.zoomedCard = card;
      }
    },
    cardOfContainer(container: Element): CardModel | undefined {
      return this.knownCards.find((entry) => container.classList.contains(cardClassName(entry.name)));
    },
    // All visible cards of the screen (hidden sections don't count), each only once
    visibleCards(screen: HTMLElement): Array<CardModel> {
      const cards: Array<CardModel> = [];
      for (const container of Array.from(screen.querySelectorAll('.card-container'))) {
        const card = container.getClientRects().length > 0 ? this.cardOfContainer(container) : undefined;
        if (card !== undefined && !cards.some((entry) => entry.name === card.name)) {
          cards.push(card);
        }
      }
      return cards;
    },
    // Paging/swiping in the large view; the shrink animation then targets the new card in the list
    showZoomedCard(index: number) {
      const card = this.zoomedCardList[index];
      if (card === undefined) {
        return;
      }
      const container = this.zoomedCardScreen?.querySelector('.card-container.' + CSS.escape(cardClassName(card.name)));
      this.zoomedCardOrigin = container?.getBoundingClientRect() ?? undefined;
      this.zoomedCard = card;
    },
    // "Play card" from the large view: open the carousel and swipe to this card
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
        const index = labels.findIndex((label) => label.querySelector('.' + CSS.escape(cardClassName(card.name))) !== null);
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
    // Detect space selection (SelectSpace): then go straight to the large Mars; the input stays mounted in the background
    updatePlacing(root: HTMLElement) {
      // A space selection in the menu only counts once it is chosen as a task (or arrives as its own input).
      // Merely switching to the turn screen is not enough: when opening "Build", the
      // greenery tab is still in the DOM briefly, and the large Mars would open by mistake.
      const placementTask = this.screen === 'turn' && this.task?.confirmation?.action === 'place';
      const placing = isBoardPlacementActive(root) && (this.placing || placementTask || !this.isActionMenu);
      if (placing !== this.placing) {
        this.placing = placing;
        // Space selection right in the large, zoomable Mars (BoardZoomModal) like in the mockup
        if (placing) {
          requestPlacementZoom(placementBoard());
        }
      }
    },
    // Function ref: called with the element, or with null on removal
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
