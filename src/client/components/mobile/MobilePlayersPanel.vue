<template>
  <!-- Inhalt des Spieler-Bildschirms: Umschalter, Spielertabelle, Meilensteine & Auszeichnungen (Spieler und Zuschauer) -->
  <div v-if="viewModel.players.length > 1" class="mb-segments" role="tablist">
    <button v-for="entry in PLAYER_SEGMENTS" :key="entry.key" type="button" role="tab"
      :aria-selected="segment === entry.key"
      :class="['mb-segment', {'mb-segment--active': segment === entry.key}]"
      @click="emit('update:segment', entry.key)">{{ entry.labels.map((label) => $t(label)).join(' & ') }}</button>
  </div>
  <PlayersOverview v-show="segment === 'players'" :playerView="viewModel" v-trim-whitespace/>
  <!-- Hülle trägt v-show: die Tabelle selbst ist in der Mobil-Ansicht per !important sichtbar geschaltet -->
  <div v-if="viewModel.players.length > 1" v-show="segment === 'ma'" class="mb-ma">
    <MilestoneAwardTable :milestones="viewModel.game.milestones" :awards="viewModel.game.awards" :players="viewModel.players" :viewerColor="viewerColor">
      <!-- Gleicher Kopf wie im Spieler-Abschnitt: Name, Status/Zeit, Konzern -->
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

defineProps<{
  viewModel: ViewModel;
  segment: PlayersSegment;
  // Farbe des eigenen Spielers (hervorgehoben); Zuschauer haben keine
  viewerColor?: Color;
}>();

const emit = defineEmits<{
  (e: 'update:segment', segment: PlayersSegment): void;
}>();
</script>
