<template>
  <div class="stats-heatmap-block">
    <!-- Titel links, Farbskala oben rechts in der Ecke der Karte -->
    <div class="stats-card-head">
      <h2 v-i18n>Where cities and greeneries end up</h2>
      <div class="stats-heat-legend" aria-hidden="true">
        <span v-for="step in steps" :key="step" class="stats-heat-legend-step" :data-heat-step="step">{{ step * 10 }}</span>
        <span class="stats-dim">%</span>
      </div>
    </div>
    <div class="stats-heatmap-tools">
      <SegmentedControl :options="typeOptions" v-model="type"/>
      <SegmentedControl v-if="playerOptions.length > 2" :options="playerOptions" v-model="player"/>
    </div>
    <StatsBoardPreview :boardName="boardName" :heatmap="map" :heatmapType="type"/>
    <p v-if="map.games === 0" class="stats-note" v-i18n>No game with a saved board yet.</p>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import SegmentedControl from '@/client/components/create/SegmentedControl.vue';
import {SegmentOption} from '@/client/components/create/createGameChoices';
import {BoardName} from '@/common/boards/BoardName';
import {StatsGame} from '@/common/stats/StatsGame';
import StatsBoardPreview from './StatsBoardPreview.vue';
import {Heatmap, heatmap, HeatmapTileType, HEAT_STEPS} from './statsHeatmap';

// Leerer Wert der Spielerauswahl: alle Spieler zusammen
const ALL_PLAYERS = '';

// Heatmap wie bei tfmstats: je heller ein Feld, desto öfter stand dort am Ende eine Stadt bzw. Grünfläche
export default defineComponent({
  name: 'StatsBoardHeatmap',
  components: {SegmentedControl, StatsBoardPreview},
  props: {
    boardName: {type: String as PropType<BoardName>, required: true},
    games: {type: Array as PropType<ReadonlyArray<StatsGame>>, required: true},
  },
  data() {
    return {
      type: 'city' as HeatmapTileType,
      player: ALL_PLAYERS,
      steps: Array.from({length: HEAT_STEPS}, (_, index) => index + 1),
      typeOptions: [{value: 'city', label: 'Cities'}, {value: 'greenery', label: 'Greeneries'}] as ReadonlyArray<SegmentOption>,
    };
  },
  computed: {
    playerOptions(): Array<SegmentOption> {
      const names = new Set(this.games.flatMap((game) => (game.details?.tiles ?? []).map((tile) => tile.playerName)));
      return [{value: ALL_PLAYERS, label: 'All'}, ...Array.from(names).sort().map((name) => ({value: name, label: name}))];
    },
    map(): Heatmap {
      return heatmap(this.games, this.boardName, this.type, this.player === ALL_PLAYERS ? undefined : this.player);
    },
  },
});
</script>
