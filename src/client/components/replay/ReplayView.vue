<template>
  <!-- Replay of a finished game in the normal game view, read only: players, Mars, log with milestones & awards and
       the hand cards of the chosen player, as they were at the step of the replay panel below. -->
  <div id="player-home" ref="root" :class="['replay-view', mobile ? ['mb-home', 'mb-home--' + (screen === 'turn' ? 'replay-actions' : screen), 'replay-view--mobile'] : 'player-home--fixed']">
    <!-- Phones and tablets: the mobile view of the game (one screen at a time, footer bar), like MobilePlayerHome.vue -->
    <template v-if="mobile">
      <MobileHeader :game="viewModel.game" :aria-label="$t('Players')" @click="screen = 'players'" />
      <main class="mb-main">
        <MobileMarsScreen v-show="screen === 'mars'" :game="viewModel.game" :players="viewModel.players" :participantId="viewModel.id"
          :tileView="tileView" :acting="false" :bannerTitle="eventText" :viewerColor="perspective"
          @toggleTileView="tileView = nextTileView(tileView)" @showMilestones="showMilestones" />
        <section v-show="screen === 'hand'" class="mb-screen mb-screen--hand">
          <HandCardsPanel :playerView="viewModel" hideUndergroundTokens />
        </section>
        <!-- Not the game's turn screen (its task bar takes over the footer): the action tabs as they are -->
        <section v-show="screen === 'turn'" class="mb-screen mb-screen--replay-actions">
          <ReplayActionTabs :playerView="viewModel" :menu="actionMenu" :focus="nextFocus" :color="replayColor(menuColor)" />
        </section>
        <section v-show="screen === 'players'" :class="['mb-screen', 'mb-screen--players', {'mb-screen--players-scroll': viewModel.players.length > 2}]">
          <MobilePlayersPanel :viewModel="viewModel" :viewerColor="perspective" v-model:segment="playersSegment" />
        </section>
        <section v-show="screen === 'log'" class="mb-screen mb-screen--log">
          <LogPanel :viewModel="viewModel" :stream="stream" />
        </section>
      </main>
      <MobileNav :items="MOBILE_NAV" :active="screen" @navigate="screen = $event">
        <template #turn>
          <MobileTurnButton :acting="false" :actionNumber="undefined" :actionsPerTurn="2" />
        </template>
      </MobileNav>
    </template>
    <HomeColumns v-else>
      <template #board>
        <div class="player_home_block player-home-columns__mars">
          <GameBoardView :game="viewModel.game" :tileView="tileView" :players="viewModel.players" :viewerColor="perspective"
            @toggleTileView="tileView = nextTileView(tileView)" />
        </div>
        <RowResizeHandle kind="mars" />
        <div class="player_home_block nofloat player-home-columns__log">
          <LogPanel :viewModel="viewModel" milestonesAwards :stream="stream" />
        </div>
      </template>
      <template #main>
        <PlayersOverview class="player_home_block player_home_block--players nofloat" :playerView="viewModel" />
        <RowResizeHandle kind="players" />
        <!-- The game's action tabs (hand cards first) fill the rest of the column like on a player's turn -->
        <div class="player_home_block player_home_block--actions nofloat">
          <ReplayActionTabs :playerView="viewModel" :menu="actionMenu" :focus="nextFocus" :color="replayColor(menuColor)" />
        </div>
      </template>
    </HomeColumns>

    <ReplayPanel
      :count="steps.length"
      :current="current"
      :generations="generations"
      :raises="raises"
      :marks="marks"
      :terraformRatings="terraformRatings"
      :players="panelPlayers"
      :perspective="perspective"
      :eventText="eventText"
      :actor="steps[current]?.actor"
      :temperature="state.temperature"
      :oxygen="state.oxygenLevel"
      :oceans="state.oceans"
      @go="current = $event"
      @perspective="perspective = $event"
      @close="$emit('close')" />
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue';
import {Color} from '@/common/Color';
import {ViewModel} from '@/common/models/PlayerModel';
import {ReplaySourceModel} from '@/common/models/ReplaySourceModel';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {translateMessage} from '@/client/directives/i18n';
import {nextTileView, TileView} from '@/client/components/board/TileView';
import HomeColumns from '@/client/components/HomeColumns.vue';
import GameBoardView from '@/client/components/GameBoardView.vue';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import PlayersOverview from '@/client/components/overview/PlayersOverview.vue';
import RowResizeHandle from '@/client/components/RowResizeHandle.vue';
import HandCardsPanel from '@/client/components/HandCardsPanel.vue';
import MobileHeader from '@/client/components/mobile/MobileHeader.vue';
import MobileMarsScreen from '@/client/components/mobile/MobileMarsScreen.vue';
import MobileNav from '@/client/components/mobile/MobileNav.vue';
import MobilePlayersPanel from '@/client/components/mobile/MobilePlayersPanel.vue';
import MobileTurnButton from '@/client/components/mobile/MobileTurnButton.vue';
import {MOBILE_NAV, MobileScreen, PlayersSegment} from '@/client/components/mobile/mobileScreens';
import {mobileLayout} from '@/client/utils/mobileLayout';
import ReplayPanel from './ReplayPanel.vue';
import ReplayActionTabs from './ReplayActionTabs.vue';
import {replayActionFocus, replayActionMenu} from './replayActionMenu';
import {ReplayState} from './reconstructReplay';
import {replayGenerations, replayMarks, replayRaises, ReplayStep} from './replaySteps';
import {replayLogStream, replayViewModel} from './replayViewModel';
import {reuseUnchanged} from './replayReuse';
import {replayColor} from './replayColors';
import {replayPlacedSpaces} from './replayPlacedSpaces';

const props = defineProps<{
  // Final view of the results page: everything that doesn't change during a game comes from it
  final: ViewModel,
  source: ReplaySourceModel,
  states: ReadonlyArray<ReplayState>,
  steps: ReadonlyArray<ReplayStep>,
}>();
defineEmits<{(event: 'close'): void}>();

const current = ref(0);
const perspective = ref<Color>(props.final.thisPlayer?.color ?? props.source.players[0].color);
const tileView = ref<TileView>('show');
// Mobile view: which screen of the footer bar is open, and the toggle of the players screen
const mobile = computed(() => mobileLayout.value);
const screen = ref<MobileScreen>('mars');
const playersSegment = ref<PlayersSegment>('players');
function showMilestones(): void {
  playersSegment.value = 'ma';
  screen.value = 'players';
}

const generations = computed(() => replayGenerations(props.steps));
const raises = computed(() => replayRaises(props.steps, props.states));
const marks = computed(() => replayMarks(props.steps, props.states));
const terraformRatings = computed(() => props.source.players.map((player, index) => ({
  color: player.color,
  values: props.steps.map((step) => props.states[step.state].players[index].terraformRating),
})));
const panelPlayers = computed(() => props.source.players.map((player) => ({color: player.color, name: player.name})));

const step = computed(() => props.steps[current.value]);
// Tiles placed in this step glow on Mars in the colour of their player until the next step
const root = ref<HTMLElement>();
const PLACED_CLASS = 'replay-placed';
function markPlaced(): void {
  const element = root.value;
  if (element === undefined) {
    return;
  }
  element.querySelectorAll<HTMLElement>('.' + PLACED_CLASS).forEach((marked) => marked.classList.remove(PLACED_CLASS));
  const color = step.value.actor === undefined ? '#fff' : replayColor(step.value.actor);
  replayPlacedSpaces(props.source, step.value).forEach((space) => {
    element.querySelectorAll<HTMLElement>(`.board-log-highlight[data_log_highlight_id="${space}"]`).forEach((marker) => {
      marker.classList.add(PLACED_CLASS);
      marker.style.setProperty('--replay-placed', color);
    });
  });
}
watch([step, tileView, perspective], markPlaced, {flush: 'post'});
// Mobile: one screen at a time, so each step opens the one that shows it, like the desktop shows both at once:
// Mars when the step placed a tile, otherwise the actions when the next step is an action (opened upfront)
watch(step, () => {
  if (!mobile.value) {
    return;
  }
  if (replayPlacedSpaces(props.source, step.value).length > 0) {
    screen.value = 'mars';
  } else if (nextFocus.value !== undefined) {
    screen.value = 'turn';
  }
});
onMounted(markPlaced);
const state = computed(() => props.states[step.value.state]);
const last = computed(() => current.value === props.steps.length - 1);
// Parts that stay the same between steps keep their objects (replayReuse.ts): only what changed renders anew
let previousView: unknown;
let previousStream: unknown;
const viewModel = computed(() => previousView = reuseUnchanged(previousView, replayViewModel(props.final, props.source, state.value, perspective.value, last.value)));
const stream = computed(() => previousStream = reuseUnchanged(previousStream, replayLogStream(props.source, step.value.state, perspective.value)));
// The action tabs show what comes next: the menu of the next step's actor as it was before that step, with its
// action open and marked – so one sees the choice before its result. Steps without an action (generation start …)
// keep the player of the last action, so the box doesn't jump.
const nextStep = computed(() => props.steps[current.value + 1]);
const menuColor = computed(() => {
  for (let index = current.value + 1; index >= 0; index--) {
    const candidate = props.steps[index];
    if (candidate?.actor !== undefined && replayActionFocus(props.source, candidate) !== undefined) {
      return candidate.actor;
    }
  }
  return perspective.value;
});
const nextFocus = computed(() => nextStep.value !== undefined && nextStep.value.actor === menuColor.value ?
  replayActionFocus(props.source, nextStep.value) : undefined);
const actionMenu = computed(() => {
  // New cards in the hand: the hand after that step, otherwise the menu before the action
  const reference = nextStep.value ?? step.value;
  const shown = props.states[nextFocus.value?.added === true || nextStep.value === undefined ? reference.state : Math.max(0, reference.line - 1)];
  const index = Math.max(0, props.source.players.findIndex((player) => player.color === menuColor.value));
  return replayActionMenu(props.source, shown, shown.players[index],
    props.final.game.milestones.map((milestone) => milestone.name), props.final.game.awards.map((award) => award.name), nextFocus.value);
});
// What happened in this step: its first log line, translated like in the log
const eventText = computed(() => {
  const entry = props.source.log[step.value.line];
  if (entry === undefined) {
    return '';
  }
  // Players by name, not by colour
  const data = entry.data.map((datum) => datum.type === LogMessageDataType.PLAYER ?
    {...datum, value: props.source.players.find((player) => player.color === datum.value)?.name ?? datum.value} : datum) as LogMessage['data'];
  return translateMessage(new LogMessage(entry.type ?? LogMessageType.DEFAULT, entry.message, data));
});
</script>
