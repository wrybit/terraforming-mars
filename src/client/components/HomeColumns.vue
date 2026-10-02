<template>
  <div :class="['player-home-columns', {'player-home-columns--board-collapsed': boardCollapsed}]" :ref="trackColumns">
    <!-- Two-column layout of the player and spectator view (player_home_columns.less): left #main, right #board.
         The board comes first in the DOM (hotkey order, narrow screens) and is placed on the right via CSS.
         Comment inside so the root stays a single element -->
    <div class="player-home-columns__board" :ref="trackBoardColumn">
      <slot name="board"></slot>
    </div>

    <!-- Drag handle between the columns (only visible in the two-column layout): splits the width, double click = default -->
    <div class="player-home-columns__resizer"
      role="separator" aria-orientation="vertical" tabindex="0"
      :aria-valuenow="boardShare" :aria-valuemin="minBoardShare" :aria-valuemax="maxBoardShare"
      :aria-label="$t('Column width')" :title="$t('Column width')"
      @pointerdown="startResize" @dblclick="resetResize"
      @keydown.left.prevent="nudgeResize(1)" @keydown.right.prevent="nudgeResize(-1)">
      <!-- Left / right split, only visible while dragging or with keyboard focus -->
      <span class="player-home-columns__resizer-label" aria-hidden="true">{{ columnSplitLabel }}</span>
    </div>

    <div class="player-home-columns__main">
      <slot name="main"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {observeBoardColumn} from '@/client/utils/boardColumnPosition';
import {observeRightColumnFit} from '@/client/utils/rightColumnFit';
import {
  DEFAULT_BOARD_SHARE, KEYBOARD_STEP, MAX_BOARD_SHARE, MIN_BOARD_SHARE,
  applyBoardShare, loadBoardShare, setBoardShare, shareLabel, startColumnResize,
} from '@/client/utils/columnResize';

// Cleanup function of the column observer (position for the modal, space usage); there is only one game view per page
let stopObservingBoardColumn: (() => void) | undefined;
// Column container for the drag handle; there is only one game view per page
let columnsElement: HTMLElement | undefined;

function observeBoardColumnFully(column: HTMLElement): () => void {
  const stopPosition = observeBoardColumn(column);
  const stopFit = observeRightColumnFit(column);
  return () => {
    stopPosition();
    stopFit();
  };
}

export default defineComponent({
  name: 'HomeColumns',
  props: {
    // Right column (board) hidden, the left one takes the full width (setup phase, SetupBoardToggle)
    boardCollapsed: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // Share of the right column in percent (columnResize.ts)
      boardShare: loadBoardShare(),
    };
  },
  computed: {
    columnSplitLabel(): string {
      return shareLabel(this.boardShare);
    },
    minBoardShare(): number {
      return MIN_BOARD_SHARE;
    },
    maxBoardShare(): number {
      return MAX_BOARD_SHARE;
    },
  },
  beforeUnmount() {
    stopObservingBoardColumn?.();
    stopObservingBoardColumn = undefined;
  },
  methods: {
    // Function ref of the column container: apply the saved split immediately
    // (called with the element, or with null on removal)
    trackColumns(element: unknown) {
      columnsElement = element instanceof HTMLElement ? element : undefined;
      if (columnsElement !== undefined) {
        applyBoardShare(columnsElement, this.boardShare);
      }
    },
    trackBoardColumn(element: unknown) {
      stopObservingBoardColumn?.();
      stopObservingBoardColumn = element instanceof HTMLElement ? observeBoardColumnFully(element) : undefined;
    },
    startResize(event: PointerEvent) {
      if (columnsElement !== undefined) {
        startColumnResize(event, columnsElement, (share) => {
          this.boardShare = share;
        });
      }
    },
    resetResize() {
      if (columnsElement !== undefined) {
        this.boardShare = setBoardShare(columnsElement, DEFAULT_BOARD_SHARE);
      }
    },
    // Left arrow key moves the handle left, the right column gets wider
    nudgeResize(direction: number) {
      if (columnsElement !== undefined) {
        this.boardShare = setBoardShare(columnsElement, this.boardShare + direction * KEYBOARD_STEP);
      }
    },
  },
});
</script>
