<template>
  <div class="row-resize-handle"
    role="separator" aria-orientation="horizontal" tabindex="0"
    :aria-label="$t('Row height')" :title="$t('Row height')"
    v-proximity-handle
    @pointerdown="startResize" @dblclick="resetResize"
    @keydown.up.prevent="nudgeResize(-1)" @keydown.down.prevent="nudgeResize(1)">
    <!-- Horizontal drag handle below a card of the player view (resize_handle.less): sets the height of the card directly
         above it (previous sibling). Invisible until the mouse approaches; double click = default height.
         Comment inside so the root stays a single element -->
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {vProximityHandle} from '@/client/directives/ProximityHandle';
import {KEYBOARD_ROW_STEP, RowResizeTarget, clampHeight, startRowResize} from '@/client/utils/rowResize';
import {loadStoredNumber, saveStoredNumber} from '@/client/utils/layoutStorage';
import {playersCardTarget} from '@/client/utils/playersCardFit';
import {marsCardTarget} from '@/client/utils/rightColumnFit';

// Which card the handle resizes: the player table (left) or Mars (right)
export type RowResizeKind = 'players' | 'mars';

const STORAGE_KEYS: Record<RowResizeKind, string> = {
  players: 'player_home_players_height',
  mars: 'player_home_mars_height',
};
const BOARD_COLUMN_SELECTOR = '.player-home-columns__board';

export default defineComponent({
  name: 'RowResizeHandle',
  directives: {
    proximityHandle: vProximityHandle,
  },
  props: {
    kind: {
      type: String as PropType<RowResizeKind>,
      required: true,
    },
  },
  mounted() {
    // Restore the saved height – only where the handle is shown (fixed layout, player_home_fixed.less),
    // otherwise it could not be reset
    const stored = loadStoredNumber(STORAGE_KEYS[this.kind]);
    if (stored !== undefined && getComputedStyle(this.$el).display !== 'none') {
      this.target()?.apply(stored);
    }
  },
  methods: {
    target(): RowResizeTarget | undefined {
      const handle = this.$el as HTMLElement;
      const card = handle.previousElementSibling;
      if (!(card instanceof HTMLElement)) {
        return undefined;
      }
      if (this.kind === 'players') {
        // Without players PlayersOverview renders nothing; then there is no card to resize
        return card.querySelector('.players-table') === null ? undefined : playersCardTarget(card);
      }
      const column = handle.closest<HTMLElement>(BOARD_COLUMN_SELECTOR);
      return column === null ? undefined : marsCardTarget(column, card);
    },
    save(height: number | undefined) {
      saveStoredNumber(STORAGE_KEYS[this.kind], height);
    },
    startResize(event: PointerEvent) {
      const target = this.target();
      if (target !== undefined) {
        startRowResize(event, target, (height) => this.save(height));
      }
    },
    resetResize() {
      this.target()?.apply(undefined);
      this.save(undefined);
    },
    // Up arrow moves the handle up, the card gets smaller
    nudgeResize(direction: number) {
      const target = this.target();
      if (target !== undefined) {
        const height = clampHeight(target.current() + direction * KEYBOARD_ROW_STEP, target.limits());
        target.apply(height);
        this.save(height);
      }
    },
  },
});
</script>
