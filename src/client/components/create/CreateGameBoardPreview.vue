<template>
  <div class="create-game-board-preview">
    <!-- Random board: which board it became -->
    <div v-if="preview !== undefined && showBoardName" class="create-game-board-preview-head">
      <span :class="boardColorClass(preview.boardName)"></span>
      <span class="capitalized" v-i18n>{{ preview.boardName }}</span>
    </div>
    <ScaledBoard v-if="preview !== undefined" :class="{'create-game-board-preview--loading': loading}"
      :spaces="preview.spaces" :boardName="preview.boardName" planetOnly/>
    <!-- New draw: bottom right next to the planet -->
    <button v-if="preview !== undefined && isRandom" type="button" class="create-game-icon-button create-game-board-preview-reroll"
      :title="$t('Draw again')" :aria-label="$t('Draw again')" @click="$emit('reroll')">
      <svg class="create-game-head-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></svg>
    </button>
    <p v-else-if="failed" class="create-game-note" v-i18n>The board could not be loaded.</p>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {paths} from '@/common/app/paths';
import {NewGameConfig} from '@/common/game/NewGameConfig';
import {BoardName} from '@/common/boards/BoardName';
import {BoardPreviewModel} from '@/common/models/BoardPreviewModel';
import ScaledBoard from '@/client/components/board/ScaledBoard.vue';

// Short pause after a change, so a quick series of clicks loads only once
const DEBOUNCE_MS = 150;

/**
 * Board of the game being created, built by the server from the same settings and board seed as the game itself
 * (api/boardpreview) – what is shown here is exactly the board the game gets.
 */
export default defineComponent({
  name: 'CreateGameBoardPreview',
  components: {ScaledBoard},
  emits: ['reroll', 'drawn'],
  props: {
    config: {type: Object as PropType<NewGameConfig>, required: true},
    // Shown when the board or its bonuses are drawn: offers a new draw
    isRandom: {type: Boolean, default: false},
    // Random board: name the drawn board
    showBoardName: {type: Boolean, default: false},
    // Color hexagon of a board, as on the board chips
    boardColorClass: {type: Function as PropType<(boardName: BoardName) => string>, required: true},
  },
  data() {
    return {
      preview: undefined as BoardPreviewModel | undefined,
      loading: false,
      failed: false,
      timer: undefined as ReturnType<typeof setTimeout> | undefined,
      // Answers can overtake each other: only the latest request counts
      requestNumber: 0,
    };
  },
  computed: {
    // Only the settings the board depends on; player names and the like do not reload it
    boardKey(): string {
      const {board, boardSeed, shuffleMapOption, expansions, includedCards} = this.config;
      return JSON.stringify({board, boardSeed, shuffleMapOption, expansions, includedCards});
    },
  },
  watch: {
    boardKey() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.load(), DEBOUNCE_MS);
    },
  },
  mounted() {
    this.load();
  },
  beforeUnmount() {
    clearTimeout(this.timer);
  },
  methods: {
    async load(): Promise<void> {
      const requestNumber = ++this.requestNumber;
      this.loading = true;
      try {
        const response = await fetch(paths.API_BOARD_PREVIEW, {method: 'POST', body: JSON.stringify(this.config), headers: {'Content-Type': 'application/json'}});
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const preview = await response.json() as BoardPreviewModel;
        if (requestNumber === this.requestNumber) {
          this.preview = preview;
          this.failed = false;
          this.$emit('drawn', preview.boardName);
        }
      } catch (error) {
        console.error(error);
        if (requestNumber === this.requestNumber) {
          this.failed = true;
        }
      } finally {
        if (requestNumber === this.requestNumber) {
          this.loading = false;
        }
      }
    },
  },
});
</script>
