<template>
  <div class="stats-board-preview" :class="heatmap === undefined ? undefined : `stats-heatmap stats-heatmap--${heatmapType}`">
    <Board v-if="spaces !== undefined"
      :spaces="spaces"
      :expansions="expansions"
      :venusScaleLevel="0"
      :boardName="boardName"/>
    <p v-else-if="failed" class="stats-note" v-i18n>The board could not be loaded.</p>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {paths} from '@/common/app/paths';
import {BoardName} from '@/common/boards/BoardName';
import {Expansion} from '@/common/cards/GameModule';
import {SpaceModel} from '@/common/models/SpaceModel';
import {Heatmap, heatStep, HeatmapTileType} from './statsHeatmap';
import {translateTextWithParams} from '@/client/directives/i18n';
import Board from '@/client/components/Board.vue';

// Leeres Spielbrett, wie es im Spiel aussieht (Felder und Boni vom Server)
export default defineComponent({
  name: 'StatsBoardPreview',
  components: {Board},
  props: {
    boardName: {type: String as PropType<BoardName>, required: true},
    /** Optional: Felder nach Häufigkeit einfärben (Städte oder Grünflächen). */
    heatmap: {type: Object as PropType<Heatmap>, default: undefined},
    heatmapType: {type: String as PropType<HeatmapTileType>, default: 'city'},
  },
  watch: {
    heatmap() {
      this.$nextTick(() => this.paintHeatmap());
    },
  },
  methods: {
    /**
     * Färbt die Felder des gerenderten Spielbretts ein. Board.vue kennt keine Heatmap; statt es dafür umzubauen,
     * bekommt jedes Feld (data_space_id) eine CSS-Variable, die das Stylesheet als Farbe darüberlegt.
     */
    paintHeatmap(): void {
      const root = this.$el as HTMLElement | undefined;
      if (root === undefined || this.spaces === undefined) {
        return;
      }
      for (const element of Array.from(root.querySelectorAll<HTMLElement>('[data_space_id]'))) {
        const count = this.heatmap?.counts.get(element.getAttribute('data_space_id') as SpaceModel['id']) ?? 0;
        // Anteil der Partien statt Anzahl: „60 %“ versteht man ohne zu wissen, wie viele Partien es sind
        const games = this.heatmap?.games ?? 0;
        const percent = games === 0 ? 0 : Math.round(count / games * 100);
        element.classList.toggle('stats-heat-space', count > 0);
        element.dataset.heat = count > 0 ? `${percent}%` : '';
        element.dataset.heatStep = count > 0 ? String(heatStep(percent)) : '';
        element.title = count > 0 ? translateTextWithParams('${0} of ${1} games', [String(count), String(games)]) : '';
      }
    },
  },
  data() {
    return {
      spaces: undefined as Array<SpaceModel> | undefined,
      failed: false,
      // Ohne Erweiterungen: es geht um das Brett selbst, nicht um Venus-/Mond-Leisten
      expansions: {} as Record<Expansion, boolean>,
    };
  },
  async mounted() {
    try {
      const response = await fetch(`${paths.API_STATS_BOARD}?name=${encodeURIComponent(this.boardName)}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      this.spaces = await response.json();
      await this.$nextTick();
      this.paintHeatmap();
    } catch (error) {
      console.error(error);
      this.failed = true;
    }
  },
});
</script>
