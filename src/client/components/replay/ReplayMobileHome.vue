<template>
  <div id="player-home" :class="['mb-home', 'mb-home--' + screen]">
    <!-- The replay on phones and tablets: the game's mobile view (MobilePlayerHome.vue), read only. Before an action the
         turn sheet opens with the chosen action marked, then its task view with the chosen card, like a player does it. -->
    <MobileHeader :game="playerView.game" :aria-label="$t('Players')" @click="go('players')" />

    <main class="mb-main">
      <MobileMarsScreen v-show="screen === 'mars'" :game="playerView.game" :players="playerView.players" :participantId="playerView.id"
        :tileView="tileView" :acting="false" :bannerTitle="eventText" :viewerColor="perspective"
        @toggleTileView="$emit('toggleTileView')" @showMilestones="showMilestones" />
      <section v-show="screen === 'hand'" class="mb-screen mb-screen--hand">
        <HandCardsPanel :playerView="playerView" hideUndergroundTokens />
      </section>
      <section v-show="screen === 'players'" :class="['mb-screen', 'mb-screen--players', {'mb-screen--players-scroll': playerView.players.length > 2}]">
        <MobilePlayersPanel :viewModel="playerView" :viewerColor="perspective" v-model:segment="playersSegment" />
      </section>
      <section v-show="screen === 'log'" class="mb-screen mb-screen--log">
        <LogPanel :viewModel="playerView" :stream="stream" />
      </section>
      <!-- Task view as in the game: header with Back, the action and its count, below it only the chosen tab -->
      <section v-show="screen === 'turn'" ref="turnSection" class="mb-screen mb-screen--turn">
        <div v-if="task !== undefined" :class="['mb-task-head', task.tone !== undefined && task.tone !== 'highlight' ? 'mb-task-head--' + task.tone : '']">
          <button type="button" class="mb-icon-button" :aria-label="$t('Back')" @click="leaveTask">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <span class="mb-task-title">{{ $t(task.label) }}</span>
          <span class="mb-task-sub">{{ task.detail !== undefined ? $t(task.detail) : task.count ?? '' }}</span>
        </div>
        <ReplayActionTabs :playerView="playerView" :menu="menu" :focus="focus" />
        <div v-if="carousel !== undefined && carousel.count > 1" class="mb-dots">
          <button v-for="index in carousel.count" :key="index" type="button"
            :class="['mb-dot', {'mb-dot--active': index - 1 === carousel.index, 'mb-dot--unavailable': carousel.unavailable[index - 1]}]"
            :aria-label="String(index)" @click="scrollCarousel(index - 1)"></button>
          <span class="mb-dots-count">{{ carousel.index + 1 }} / {{ carousel.count }}</span>
        </div>
      </section>
    </main>

    <!-- In the task view the task bar replaces the footer bar; the tab's button sits to the right of Back (mobile.less) -->
    <div v-if="screen === 'turn'" class="mb-taskbar">
      <button type="button" class="mb-taskbar-back" :aria-label="$t('Close')" @click="leaveTask">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
    </div>
    <MobileNav v-else :items="MOBILE_NAV" :active="screen" @navigate="navigate">
      <template #turn>
        <MobileTurnButton :class="{'mb-turn-button--lifted': sheetOpen}" :acting="focus !== undefined" :actionNumber="undefined" :actionsPerTurn="2" />
      </template>
    </MobileNav>

    <!-- Slides only when opened or closed by hand; the steps switch it without the drawer moving -->
    <Transition :name="sheetSlides ? 'mb-sheet' : 'replay-sheet'">
      <MobileTurnSheet v-if="sheetOpen" ref="sheet" :menu="turnMenu" :title="eventText" :actionNumber="undefined" :actionsPerTurn="2"
        :playerView="playerView" @close="closeSheet" @select="startTask" @confirm="sheetOpen = false" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {Color} from '@/common/Color';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {OrOptionsModel} from '@/common/models/PlayerInputModel';
import {GenerationLog} from '@/client/utils/fetchLogs';
import {TileView} from '@/client/components/board/TileView';
import {displayedOptionIndices} from '@/client/components/orOptionsDisplayed';
import HandCardsPanel from '@/client/components/HandCardsPanel.vue';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import MobileHeader from '@/client/components/mobile/MobileHeader.vue';
import MobileMarsScreen from '@/client/components/mobile/MobileMarsScreen.vue';
import MobileNav from '@/client/components/mobile/MobileNav.vue';
import MobilePlayersPanel from '@/client/components/mobile/MobilePlayersPanel.vue';
import MobileTurnButton from '@/client/components/mobile/MobileTurnButton.vue';
import MobileTurnSheet from '@/client/components/mobile/MobileTurnSheet.vue';
import {MOBILE_NAV, MobileScreen, PlayersSegment} from '@/client/components/mobile/mobileScreens';
import {buildTurnMenu, findTurnMenuTile, selectTurnMenuTile, TurnMenuTile} from '@/client/components/mobile/turnMenu';
import {CarouselState, observeCardCarousel, scrollCarouselTo} from '@/client/components/mobile/cardCarousel';
import ReplayActionTabs from './ReplayActionTabs.vue';
import {ReplayActionFocus} from './replayActionMenu';

const props = defineProps<{
  playerView: PlayerViewModel,
  stream: Array<GenerationLog>,
  menu: OrOptionsModel,
  // The next step's action, undefined when the next step is no action of the menu's player
  focus: ReplayActionFocus | undefined,
  eventText: string,
  perspective: Color,
  tileView: TileView,
  // Changes with every step
  step: number,
  // The step placed a tile: Mars shows it
  placed: boolean,
}>();
defineEmits<{(event: 'toggleTileView'): void}>();

// How long the turn sheet shows the chosen action before its task view opens
const SHEET_MS = 500;
const FOCUS_CLASS = 'replay-action-tabs__focus';

const screen = ref<MobileScreen>('mars');
const playersSegment = ref<PlayersSegment>('players');
const sheetOpen = ref(false);
const sheetSlides = ref(false);
const task = ref<TurnMenuTile | undefined>(undefined);
const carousel = ref<CarouselState | undefined>(undefined);
const turnSection = ref<HTMLElement>();
const sheet = ref<{$el: HTMLElement}>();
let sheetTimer: number | undefined;
let stopCarousel: (() => void) | undefined;

const turnMenu = computed(() => buildTurnMenu(props.menu));
// Tile of the next action: tabs and tiles are numbered in display order (orOptionsDisplayed.ts)
const focusTile = computed(() => props.focus === undefined ? undefined :
  findTurnMenuTile(turnMenu.value, displayedOptionIndices(props.menu).indexOf(props.menu.initialIdx ?? -1)));

function go(next: MobileScreen): void {
  screen.value = next;
}
function showMilestones(): void {
  playersSegment.value = 'ma';
  go('players');
}
// The turn button opens the sheet, like in the game
function navigate(next: MobileScreen): void {
  if (next === 'turn') {
    sheetSlides.value = true;
    sheetOpen.value = true;
  } else {
    go(next);
  }
}
function startTask(index: number): void {
  window.clearTimeout(sheetTimer);
  if (turnSection.value !== undefined) {
    selectTurnMenuTile(turnSection.value, index);
  }
  task.value = findTurnMenuTile(turnMenu.value, index);
  sheetOpen.value = false;
  go('turn');
  showFocusedCard();
}
// The carousel selects the card in its middle: swipe to the chosen card, like "Play card" from the large view
async function showFocusedCard(): Promise<void> {
  await nextTick();
  // The screen was hidden until now: wait for its layout before swiping
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const section = turnSection.value;
  const list = Array.from(section?.querySelectorAll<HTMLElement>('.payments_cont') ?? []).find((element) => element.offsetWidth > 0);
  const cards = Array.from(list?.querySelectorAll(':scope > label.payments_cards') ?? []);
  const index = cards.findIndex((card) => card.classList.contains(FOCUS_CLASS) || card.querySelector('.' + FOCUS_CLASS) !== null);
  if (section !== undefined && index >= 0) {
    scrollCarouselTo(section, index);
  }
}
function closeSheet(): void {
  sheetSlides.value = true;
  sheetOpen.value = false;
}
function leaveTask(): void {
  task.value = undefined;
  go('mars');
  sheetSlides.value = true;
  sheetOpen.value = true;
}
function scrollCarousel(index: number): void {
  if (turnSection.value !== undefined) {
    scrollCarouselTo(turnSection.value, index);
  }
}

// Marks the chosen tile in the open sheet: the tiles stand in the order of the menu's sections (MobileTurnSheet.vue)
async function markSheetTile(tile: TurnMenuTile): Promise<void> {
  await nextTick();
  const element = sheet.value?.$el;
  if (element === undefined) {
    return;
  }
  const menu = turnMenu.value;
  const end = menu.pass !== undefined || menu.skip !== undefined ? [menu.skip, menu.pass] : [];
  const order = [...menu.available, ...menu.actions, ...end].filter((entry, position) => entry !== undefined || position === menu.available.length + menu.actions.length);
  const position = order.findIndex((entry) => entry?.index === tile.index);
  element.querySelectorAll('.' + FOCUS_CLASS).forEach((marked) => marked.classList.remove(FOCUS_CLASS));
  element.querySelectorAll('.mb-tile')[position]?.classList.add(FOCUS_CLASS);
}

// Each step shows what happens: Mars for a placed tile; before an action the sheet with the action, then its task
// view; actions without a task (pass, conversions …) stay in the sheet
watch(() => props.step, () => {
  window.clearTimeout(sheetTimer);
  sheetSlides.value = false;
  const tile = focusTile.value;
  if (props.placed) {
    sheetOpen.value = false;
    task.value = undefined;
    go('mars');
  } else if (tile !== undefined) {
    if (screen.value === 'turn') {
      task.value = undefined;
      go('mars');
    }
    sheetOpen.value = true;
    markSheetTile(tile);
    const ownTask = tile.confirmation === undefined && tile !== turnMenu.value.pass && tile !== turnMenu.value.skip;
    if (ownTask) {
      sheetTimer = window.setTimeout(() => startTask(tile.index), SHEET_MS);
    }
  }
}, {flush: 'post'});

onMounted(() => {
  if (turnSection.value !== undefined) {
    stopCarousel = observeCardCarousel(turnSection.value, (state) => carousel.value = state);
  }
});
onBeforeUnmount(() => {
  window.clearTimeout(sheetTimer);
  stopCarousel?.();
});
</script>
