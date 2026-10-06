<template>
  <div class="stats-board-preview" :class="heatmap === undefined ? undefined : `stats-heatmap stats-heatmap--${heatmapType}`">
    <ScaledBoard v-if="spaces !== undefined" :spaces="spaces" :boardName="boardForBoardView"/>
    <p v-else-if="failed" class="stats-note" v-i18n>The board could not be loaded.</p>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {paths} from '@/common/app/paths';
import {BoardName} from '@/common/boards/BoardName';
import {SpaceModel} from '@/common/models/SpaceModel';
import {StatsBoardKey} from '@/common/stats/statsBoardKey';
import {Heatmap, heatStep, HeatmapTileType} from './statsHeatmap';
import {translateTextWithParams} from '@/client/directives/i18n';
import ScaledBoard from '@/client/components/board/ScaledBoard.vue';

// Empty game board as it looks in the game (spaces and bonuses from the server)
export default defineComponent({
  name: 'StatsBoardPreview',
  components: {ScaledBoard},
  props: {
    boardKey: {type: String as PropType<StatsBoardKey>, required: true},
    /** Optional: color the spaces by frequency (cities or greeneries). */
    heatmap: {type: Object as PropType<Heatmap>, default: undefined},
    heatmapType: {type: String as PropType<HeatmapTileType>, default: 'city'},
  },
  computed: {
    /**
     * Board.vue draws the labels of a known board (volcanoes, Noctis City …). "random" is no board of its own: with the
     * name it knows nothing about, it draws only the spaces – exactly right, because the labels differ per shuffled game.
     */
    boardForBoardView(): BoardName {
      return this.boardKey as BoardName;
    },
  },
  watch: {
    heatmap() {
      this.$nextTick(() => this.paintHeatmap());
    },
  },
  methods: {
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
    };
  },
  async mounted() {
    try {
      const response = await fetch(`${paths.API_STATS_BOARD}?name=${encodeURIComponent(this.boardKey)}`);
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
