<template>
  <div :class="['player-home-columns', {'player-home-columns--board-collapsed': boardCollapsed}]">
    <!-- Two-column layout of the player and spectator view (player_home_columns.less): left #main, right #board.
         The board comes first in the DOM (hotkey order, narrow screens) and is placed on the right via CSS.
         Comment inside so the root stays a single element -->
    <div class="player-home-columns__board" :ref="trackBoardColumn">
      <slot name="board"></slot>
    </div>

    <!-- Drag handle between the columns (only visible in the two-column layout): splits the width, double click = default -->
    <ColumnResizeHandle class="player-home-columns__resizer" :split="split"/>

    <div class="player-home-columns__main">
      <slot name="main"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {observeBoardColumn} from '@/client/utils/boardColumnPosition';
import {observeRightColumnFit} from '@/client/utils/rightColumnFit';
import {PLAYER_HOME_SPLIT} from '@/client/utils/columnResize';
import ColumnResizeHandle from '@/client/components/ColumnResizeHandle.vue';
import {replaceCleanup} from '@/client/utils/instanceCleanup';

// Column observer (position for the modal, space usage) per view (utils/instanceCleanup.ts): a shared handle let an
// old view stop the observer of the new one, Mars then kept a stale zoom and overlapped the milestones
const OBSERVER = 'board-column';

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
  components: {
    ColumnResizeHandle,
  },
  props: {
    // Right column (board) hidden, the left one takes the full width (setup phase, SetupBoardToggle)
    boardCollapsed: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    split() {
      return PLAYER_HOME_SPLIT;
    },
  },
  beforeUnmount() {
    replaceCleanup(this, OBSERVER);
  },
  methods: {
    trackBoardColumn(element: unknown) {
      replaceCleanup(this, OBSERVER, element instanceof HTMLElement ? observeBoardColumnFully(element) : undefined);
    },
  },
});
</script>
