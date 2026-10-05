<template>
  <!-- Content of the players screen: toggle, player table, milestones & awards (player and spectator) -->
  <div v-if="viewModel.players.length > 1" class="mb-segments" role="tablist">
    <button v-for="entry in PLAYER_SEGMENTS" :key="entry.key" type="button" role="tab"
      :aria-selected="segment === entry.key"
      :class="['mb-segment', {'mb-segment--active': segment === entry.key}]"
      v-flash-tab="{id: 'mobile-segment-' + entry.key, areas: entry.flashAreas, active: segment === entry.key}"
      @click="emit('update:segment', entry.key)">{{ entry.labels.map((label) => $t(label)).join(' & ') }}</button>
  </div>
  <PlayersOverview v-show="segment === 'players'" :playerView="viewModel" v-trim-whitespace/>
  <!-- The wrapper carries v-show: the table itself is forced visible in the mobile view via !important -->
  <div v-if="viewModel.players.length > 1" v-show="segment === 'ma'" class="mb-ma">
    <MilestoneAwardTable :milestones="viewModel.game.milestones" :awards="viewModel.game.awards" :players="viewModel.players" :viewerColor="viewerColor">
      <!-- Same header as in the player section: name, status/time, corporation -->
      <template #player="{player}">
        <PlayerIdentity :player="player" :playerView="viewModel" :actionLabel="playerActionLabel(player, viewModel)" :highlighted="player.color === viewerColor"/>
      </template>
    </MilestoneAwardTable>
  </div>
</template>

<script setup lang="ts">
import {Color} from '@/common/Color';
import {ViewModel} from '@/common/models/PlayerModel';
import PlayersOverview from '@/client/components/overview/PlayersOverview.vue';
import PlayerIdentity from '@/client/components/overview/PlayerIdentity.vue';
import MilestoneAwardTable from '@/client/components/milestoneAwardTable/MilestoneAwardTable.vue';
import {playerActionLabel} from '@/client/components/overview/playerActionLabel';
import {PLAYER_SEGMENTS, PlayersSegment} from '@/client/components/mobile/mobileScreens';
import {vFlashTab} from '@/client/directives/ChangeFlashTab';

defineProps<{
  viewModel: ViewModel;
  segment: PlayersSegment;
  // Color of your own player (highlighted); spectators have none
  viewerColor?: Color;
}>();

const emit = defineEmits<{
  (e: 'update:segment', segment: PlayersSegment): void;
}>();
</script>
