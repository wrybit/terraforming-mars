<template>
  <div class="stats-board-preview">
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
import Board from '@/client/components/Board.vue';

// Leeres Spielbrett, wie es im Spiel aussieht (Felder und Boni vom Server)
export default defineComponent({
  name: 'StatsBoardPreview',
  components: {Board},
  props: {
    boardName: {type: String as PropType<BoardName>, required: true},
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
    } catch (error) {
      console.error(error);
      this.failed = true;
    }
  },
});
</script>
