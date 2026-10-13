<template>
  <div class="row-resize-handle"
    role="separator" aria-orientation="horizontal" tabindex="0"
    :aria-label="$t('Row height')" :title="$t('Row height')"
    v-proximity-handle
    @pointerdown="startResize" @dblclick="resetResize"
    @keydown.up.prevent="nudgeResize(-1)" @keydown.down.prevent="nudgeResize(1)">
    <!-- Horizontal drag handle below a card (resize_handle.less): sets the height of the card directly above it
         (previous sibling). Invisible until the mouse approaches; double click = default height.
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
import {boardTarget, chartTarget, observeBoardFit, tableTarget} from '@/client/utils/gameEndResize';
import {tween} from '@/client/utils/tween';

// Which card the handle resizes: game view – player table (left), Mars (right);
// results page – victory point table, board, charts
export type RowResizeKind = 'players' | 'mars' | 'game-end-table' | 'game-end-board' | 'game-end-chart';

type KindSetup = {
  storageKey: string;
  // undefined if the card has nothing to resize (e.g. no players)
  target(card: HTMLElement, handle: HTMLElement): RowResizeTarget | undefined;
  // Optional: watches something that changes the limits (column width) and calls onChange; returns a cleanup function
  observe?(card: HTMLElement, onChange: () => void): () => void;
};

// Element inside the card, or undefined
const inside = (card: HTMLElement, selector: string) => card.querySelector<HTMLElement>(selector) ?? undefined;

const BOARD_ZOOM_SELECTOR = '.game-end-board-zoom';

const KINDS: Record<RowResizeKind, KindSetup> = {
  'players': {
    storageKey: 'player_home_players_height',
    // Without players PlayersOverview renders nothing; then there is no card to resize
    target(card) {
      const table = inside(card, '.players-table');
      return table === undefined ? undefined : playersCardTarget(card, table);
    },
  },
  'mars': {
    storageKey: 'player_home_mars_height',
    target(card, handle) {
      const column = handle.closest<HTMLElement>('.player-home-columns__board');
      return column === null ? undefined : marsCardTarget(column, card);
    },
  },
  'game-end-table': {
    storageKey: 'game_end_table_height',
    target(card) {
      const table = inside(card, '.game_end_table');
      return table === undefined ? undefined : tableTarget(card, table);
    },
  },
  'game-end-board': {
    storageKey: 'game_end_board_height',
    target(card) {
      const content = inside(card, BOARD_ZOOM_SELECTOR);
      return content === undefined ? undefined : boardTarget(card, content);
    },
    observe(card, onChange) {
      const content = inside(card, BOARD_ZOOM_SELECTOR);
      return content === undefined ? () => {} : observeBoardFit(card, content, onChange);
    },
  },
  'game-end-chart': {
    storageKey: 'game_end_chart_height',
    target(card) {
      const chart = inside(card, '.victory-point-chart-container');
      return chart === undefined ? undefined : chartTarget(card, chart);
    },
  },
};

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
  data() {
    return {
      stopObserving: undefined as (() => void) | undefined,
      // Stops a running double-click animation (dragging or keys take over)
      stopAnimation: undefined as (() => void) | undefined,
    };
  },
  mounted() {
    this.restore();
    // Also while hidden: the window can grow into the two-column layout later
    const card = this.card();
    const observe = KINDS[this.kind].observe;
    if (card !== undefined && observe !== undefined) {
      this.stopObserving = observe(card, () => this.restore());
    }
  },
  beforeUnmount() {
    this.stopObserving?.();
    this.stopAnimation?.();
  },
  methods: {
    card(): HTMLElement | undefined {
      const card = (this.$el as HTMLElement).previousElementSibling;
      return card instanceof HTMLElement ? card : undefined;
    },
    target(): RowResizeTarget | undefined {
      const card = this.card();
      return card === undefined ? undefined : KINDS[this.kind].target(card, this.$el as HTMLElement);
    },
    // Apply the saved height (clamped to the current limits) – only where the handle is shown
    // (player_home_fixed.less, game_end_columns.less), otherwise it could not be reset
    restore() {
      if (getComputedStyle(this.$el).display === 'none') {
        return;
      }
      const stored = loadStoredNumber(KINDS[this.kind].storageKey);
      if (stored !== undefined) {
        this.target()?.apply(stored);
      }
    },
    save(height: number | undefined) {
      saveStoredNumber(KINDS[this.kind].storageKey, height);
    },
    startResize(event: PointerEvent) {
      this.stopAnimation?.();
      const target = this.target();
      if (target !== undefined) {
        startRowResize(event, target, (height) => this.save(height));
      }
    },
    // Glides to the default height instead of jumping: measure the default once, then animate towards it
    resetResize() {
      const target = this.target();
      if (target === undefined) {
        return;
      }
      this.stopAnimation?.();
      this.save(undefined);
      const start = target.current();
      target.apply(undefined);
      const end = target.current();
      target.apply(start);
      this.stopAnimation = tween(start, end, (height) => target.apply(height), () => {
        this.stopAnimation = undefined;
        target.apply(undefined);
      });
    },
    // Up arrow moves the handle up, the card gets smaller
    nudgeResize(direction: number) {
      this.stopAnimation?.();
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
