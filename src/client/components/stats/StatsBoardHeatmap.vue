<template>
  <div class="stats-heatmap-block">
    <div class="stats-heatmap-tools">
      <SegmentedControl :options="typeOptions" v-model="type"/>
      <SegmentedControl v-if="playerOptions.length > 2" :options="playerOptions" v-model="player"/>
    </div>
    <StatsBoardPreview :boardName="boardName" :heatmap="map" :heatmapType="type"/>
    <p class="stats-note">{{ note }}</p>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import SegmentedControl from '@/client/components/create/SegmentedControl.vue';
import {SegmentOption} from '@/client/components/create/createGameChoices';
import {BoardName} from '@/common/boards/BoardName';
import {StatsGame} from '@/common/stats/StatsGame';
import StatsBoardPreview from './StatsBoardPreview.vue';
import {Heatmap, heatmap, HeatmapTileType} from './statsHeatmap';

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
    note(): string {
      if (this.map.games === 0) {
        return translateText('No game with a saved board yet. Screenshots do not show the board; every game finished here counts.');
      }
      return translateTextWithParams('Percent of the ${0} games with a saved board in which a tile of this kind was on that space at the end. Screenshots do not show the board; every game finished here counts.', [String(this.map.games)]);
    },
  },
});
</script>
