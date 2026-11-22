<template>
  <!-- Replay of a finished game in the normal game view, read only: players, Mars, log with milestones & awards and
       the hand cards of the chosen player, as they were at the step of the replay panel below. -->
  <div id="player-home" class="player-home--fixed replay-view">
    <HomeColumns>
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
          <ReplayActionTabs :playerView="viewModel" :menu="actionMenu" :focus="ownFocus" />
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
import {computed, ref} from 'vue';
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
import ReplayPanel from './ReplayPanel.vue';
import ReplayActionTabs from './ReplayActionTabs.vue';
import {replayActionFocus, replayActionMenu} from './replayActionMenu';
import {ReplayState} from './reconstructReplay';
import {replayGenerations, replayMarks, replayRaises, ReplayStep} from './replaySteps';
import {replayLogStream, replayViewModel} from './replayViewModel';
import {reuseUnchanged} from './replayReuse';

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

const generations = computed(() => replayGenerations(props.steps));
const raises = computed(() => replayRaises(props.steps, props.states));
const marks = computed(() => replayMarks(props.steps, props.states));
const terraformRatings = computed(() => props.source.players.map((player, index) => ({
  color: player.color,
  values: props.steps.map((step) => props.states[step.state].players[index].terraformRating),
})));
const panelPlayers = computed(() => props.source.players.map((player) => ({color: player.color, name: player.name})));

const step = computed(() => props.steps[current.value]);
const state = computed(() => props.states[step.value.state]);
const last = computed(() => current.value === props.steps.length - 1);
// Parts that stay the same between steps keep their objects (replayReuse.ts): only what changed renders anew
let previousView: unknown;
let previousStream: unknown;
const viewModel = computed(() => previousView = reuseUnchanged(previousView, replayViewModel(props.final, props.source, state.value, perspective.value, last.value)));
const stream = computed(() => previousStream = reuseUnchanged(previousStream, replayLogStream(props.source, step.value.state, perspective.value)));
// Action tabs of the chosen player, as they were before this step; its own action opens and marks its tab
const ownFocus = computed(() => step.value.actor === perspective.value ? replayActionFocus(props.source, step.value) : undefined);
const actionMenu = computed(() => {
  const before = props.states[Math.max(0, step.value.line - 1)];
  const index = Math.max(0, props.source.players.findIndex((player) => player.color === perspective.value));
  return replayActionMenu(props.source, before, before.players[index],
    props.final.game.milestones.map((milestone) => milestone.name), props.final.game.awards.map((award) => award.name), ownFocus.value);
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
