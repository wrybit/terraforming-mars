<template>
  <!-- Replay of a finished game in the normal game view, read only: players, Mars, log with milestones & awards and
       the hand cards of the chosen player, as they were at the step of the replay panel below. -->
  <div ref="root" :id="mobile ? undefined : 'player-home'" :class="['replay-view', mobile ? 'replay-view--mobile' : 'player-home--fixed']">
    <!-- Phones and tablets: the mobile view of the game -->
    <ReplayMobileHome v-if="mobile" :playerView="viewModel" :stream="stream" :menu="actionMenu" :focus="nextFocus"
      :eventText="eventText" :perspective="perspective" :tileView="tileView" :step="current" :placed="placedSpaces.length > 0"
      @toggleTileView="tileView = nextTileView(tileView)" />
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
          <ReplayActionTabs v-if="actionMenu.options.length > 0" :playerView="viewModel" :menu="actionMenu" :focus="nextFocus" />
        </div>
      </template>
    </HomeColumns>

    <ReplayPanel
      :count="steps.length"
      :current="current"
      :generations="generations"
      :raises="raises"
      :marks="marks"
      :victoryPoints="victoryPoints"
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
import {mobileLayout} from '@/client/utils/mobileLayout';
import ReplayPanel from './ReplayPanel.vue';
import ReplayActionTabs from './ReplayActionTabs.vue';
import ReplayMobileHome from './ReplayMobileHome.vue';
import {replayActionFocus, replayActionMenu, replayMoneyReliable} from './replayActionMenu';
import {ReplayState} from './reconstructReplay';
import {replayGenerations, replayMarks, replayRaises, ReplayStep} from './replaySteps';
import {replayLogStream, replayViewModel} from './replayViewModel';
import {reuseUnchanged} from './replayReuse';
import {replayColor} from './replayColors';
import {replayPlacedSpaces} from './replayPlacedSpaces';
import {readReplayPlayer, writeReplayPlayer} from './replayAddress';
import {replayVictoryPoints} from './replayPoints';

const props = defineProps<{
  // Final view of the results page: everything that doesn't change during a game comes from it
  final: ViewModel,
  source: ReplaySourceModel,
  states: ReadonlyArray<ReplayState>,
  steps: ReadonlyArray<ReplayStep>,
}>();
defineEmits<{(event: 'close'): void}>();

const current = ref(0);
// From the address first (a shared link shows the same view), then the own seat, then the first player
const perspective = ref<Color>(readReplayPlayer(props.source.players.map((player) => player.color)) ??
  props.final.thisPlayer?.color ?? props.source.players[0].color);
watch(perspective, writeReplayPlayer, {immediate: true});
const tileView = ref<TileView>('show');
// Phones and tablets get the game's mobile view
const mobile = computed(() => mobileLayout.value);

const generations = computed(() => replayGenerations(props.steps));
const raises = computed(() => replayRaises(props.steps, props.states));
const marks = computed(() => replayMarks(props.steps, props.states));
// Victory points (TR included) of every player at every step for the graph and the scores in the panel
const victoryPoints = computed(() => props.source.players.map((player, index) => {
  const final = props.final.players.find((candidate) => candidate.color === player.color);
  const ratings = props.steps.map((step) => props.states[step.state].players[index].terraformRating);
  return {
    color: player.color,
    values: replayVictoryPoints(ratings, generations.value, final?.victoryPointsByGeneration ?? [], final?.victoryPointsBreakdown.total ?? ratings[ratings.length - 1] ?? 0),
  };
}));
const panelPlayers = computed(() => props.source.players.map((player) => ({color: player.color, name: player.name})));

const step = computed(() => props.steps[current.value]);
// Spaces of this step's tiles
const placedSpaces = computed(() => replayPlacedSpaces(props.source, step.value));
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
  placedSpaces.value.forEach((space) => {
    element.querySelectorAll<HTMLElement>(`.board-log-highlight[data_log_highlight_id="${space}"]`).forEach((marker) => {
      marker.classList.add(PLACED_CLASS);
      marker.style.setProperty('--replay-placed', color);
    });
  });
}
watch([step, tileView, perspective], markPlaced, {flush: 'post'});
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
// From the final greenery placement on the game offers no actions any more
const finalStep = computed(() => {
  const index = props.steps.findIndex((candidate) => props.source.log[candidate.line]?.message === 'Final greenery placement');
  return index < 0 ? props.steps.length : index;
});
// Costs only decide the menu when the reconstructed money is trustworthy for this game
const checkCosts = computed(() => replayMoneyReliable(props.source, props.states, props.steps));
const milestones = computed(() => props.final.game.milestones.map((milestone) => ({name: milestone.name, threshold: milestone.threshold})));
const actionMenu = computed(() => {
  // New cards in the hand: the hand after that step, otherwise the menu before the action
  const reference = nextStep.value ?? step.value;
  if (current.value + 1 >= finalStep.value) {
    return {type: 'or' as const, title: 'Take your next action', buttonLabel: 'Take action', options: [], initialIdx: 0};
  }
  const shown = props.states[nextFocus.value?.added === true || nextStep.value === undefined ? reference.state : Math.max(0, reference.line - 1)];
  const index = Math.max(0, props.source.players.findIndex((player) => player.color === menuColor.value));
  return replayActionMenu(props.source, shown, shown.players[index], menuColor.value,
    milestones.value, props.final.game.awards.map((award) => award.name), nextFocus.value, checkCosts.value);
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
