<template>
  <div id="player-home" :class="['mb-home', 'mb-home--' + screen]">
    <!-- The replay on phones and tablets: the game's mobile view (MobilePlayerHome.vue), read only. Before an action
         its task view opens with the chosen card, like after choosing it in the turn sheet; the sheet itself only
         opens by hand. -->
    <MobileHeader :game="playerView.game" :aria-label="$t('Players')" @click="go('players')" />

    <main class="mb-main">
      <MobileMarsScreen v-show="screen === 'mars'" :game="playerView.game" :players="playerView.players" :participantId="playerView.id"
        :tileView="tileView" :acting="false" :bannerTitle="eventText" :viewerColor="perspective"
        @toggleTileView="$emit('toggleTileView')" @showMilestones="showMilestones" />
      <section v-show="screen === 'hand'" class="mb-screen mb-screen--hand">
        <MobileTaskHead :title="$t('All cards')" :back="false" />
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
        <MobileTaskHead v-if="task !== undefined" :title="$t(task.label)" :sub="task.detail !== undefined ? $t(task.detail) : task.count"
          :tone="task.tone !== undefined && task.tone !== 'highlight' ? task.tone : undefined" @back="leaveTask" />
        <ReplayActionTabs :playerView="playerView" :menu="menu" :focus="focus" />
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

    <!-- Only opened by hand (turn button, Back): the steps never open it -->
    <Transition name="mb-sheet">
      <MobileTurnSheet v-if="sheetOpen" ref="sheet" :menu="turnMenu" :title="eventText" :actionNumber="undefined" :actionsPerTurn="2"
        :playerView="playerView" @close="closeSheet" @select="startTask" @confirm="sheetOpen = false" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, ref, watch} from 'vue';
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
import {showCardInGrid} from '@/client/components/mobile/cardGrid';
import MobileTaskHead from '@/client/components/mobile/MobileTaskHead.vue';
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

const FOCUS_CLASS = 'replay-action-tabs__focus';

const screen = ref<MobileScreen>('mars');
const playersSegment = ref<PlayersSegment>('players');
const sheetOpen = ref(false);
const task = ref<TurnMenuTile | undefined>(undefined);
const turnSection = ref<HTMLElement>();
const sheet = ref<{$el: HTMLElement}>();

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
    openSheet();
  } else {
    go(next);
  }
}
function startTask(index: number): void {
  if (turnSection.value !== undefined) {
    selectTurnMenuTile(turnSection.value, index);
  }
  task.value = findTurnMenuTile(turnMenu.value, index);
  sheetOpen.value = false;
  go('turn');
  showFocusedCard();
}
// Scroll the chosen card (marked by ReplayActionTabs) into view, like "Play card" from the large view
async function showFocusedCard(): Promise<void> {
  await nextTick();
  // The screen was hidden until now: wait for its layout before scrolling
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const section = turnSection.value;
  if (section !== undefined) {
    showCardInGrid(section, (card) => card.classList.contains(FOCUS_CLASS) || card.querySelector('.' + FOCUS_CLASS) !== null, false);
  }
}
function closeSheet(): void {
  sheetOpen.value = false;
}
// Opened by hand, the sheet marks the next action like the replay's tabs
function openSheet(): void {
  sheetOpen.value = true;
  if (focusTile.value !== undefined) {
    markSheetTile(focusTile.value);
  }
}
function leaveTask(): void {
  task.value = undefined;
  go('mars');
  openSheet();
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

// Each step shows what happens, without the turn sheet: Mars for a placed tile, the task view of the next action
// (its tab with the chosen card); actions without a task view (pass, end turn, conversions) show Mars
watch(() => props.step, () => {
  sheetOpen.value = false;
  const tile = focusTile.value;
  const ownTask = tile !== undefined && tile.confirmation === undefined && tile !== turnMenu.value.pass && tile !== turnMenu.value.skip;
  if (!props.placed && ownTask) {
    startTask(tile.index);
  } else if (props.placed || tile !== undefined) {
    task.value = undefined;
    go('mars');
  }
}, {flush: 'post'});

onBeforeUnmount(() => {
});
</script>
