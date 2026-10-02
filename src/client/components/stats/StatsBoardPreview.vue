<template>
  <div class="stats-board-preview" :class="heatmap === undefined ? undefined : `stats-heatmap stats-heatmap--${heatmapType}`">
    <!-- The board is a fixed ~700 px wide; on narrow screens shrink it instead of clipping -->
    <div v-if="spaces !== undefined" ref="scaled" class="stats-board-scaled" :style="{zoom: scale}">
      <Board
        :spaces="spaces"
        :expansions="expansions"
        :venusScaleLevel="0"
        :boardName="boardName"/>
    </div>
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

// Empty game board as it looks in the game (spaces and bonuses from the server)
export default defineComponent({
  name: 'StatsBoardPreview',
  components: {Board},
  props: {
    boardName: {type: String as PropType<BoardName>, required: true},
    /** Optional: color the spaces by frequency (cities or greeneries). */
    heatmap: {type: Object as PropType<Heatmap>, default: undefined},
    heatmapType: {type: String as PropType<HeatmapTileType>, default: 'city'},
  },
  watch: {
    heatmap() {
      this.$nextTick(() => this.paintHeatmap());
    },
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
  },
  methods: {
    fitToWidth(): void {
      const available = (this.$el as HTMLElement).clientWidth;
      this.scale = this.naturalWidth <= 0 ? 1 : Math.min(1, available / this.naturalWidth);
    },
    /**
     * Colors the spaces of the rendered game board. Board.vue knows no heatmap; instead of rebuilding it for that,
     * each space (data_space_id) gets a CSS variable that the stylesheet overlays as a color.
     */
    paintHeatmap(): void {
      const root = this.$el as HTMLElement | undefined;
      if (root === undefined || this.spaces === undefined) {
        return;
      }
      for (const element of Array.from(root.querySelectorAll<HTMLElement>('[data_space_id]'))) {
        const count = this.heatmap?.counts.get(element.getAttribute('data_space_id') as SpaceModel['id']) ?? 0;
        // Share of games instead of count: "60 %" is understandable without knowing how many games there are
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
      scale: 1,
      /** Width of the board at original size, measured once at zoom 1. */
      naturalWidth: 0,
      resizeObserver: undefined as ResizeObserver | undefined,
      // Without expansions: this is about the board itself, not Venus/Moon tracks
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
      this.naturalWidth = (this.$refs.scaled as HTMLElement | undefined)?.scrollWidth ?? 0;
      this.fitToWidth();
      // Older browsers and test environments without ResizeObserver keep the first fit
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.fitToWidth());
        this.resizeObserver.observe(this.$el as HTMLElement);
      }
      this.paintHeatmap();
    } catch (error) {
      console.error(error);
      this.failed = true;
    }
  },
});
</script>
