<template>
  <!-- One group of the games overview (gameGroups.ts): heading with the number of games, the table right below -->
  <section class="games-overview-card" :class="'games-overview-group--' + groupKey">
    <h2><span v-i18n>{{ title }}</span> <span class="games-overview-lineup-games">{{ games.length }} {{ $t(games.length === 1 ? 'game' : 'games') }}</span></h2>
    <!-- Group-wide actions (e.g. bulk delete of open games) between heading and table -->
    <div v-if="$slots.actions !== undefined" class="games-overview-bulk"><slot name="actions"></slot></div>
    <!-- covered: the table is wider than the card and rows still pass under the sticky delete column,
         only then does it get its shadow. The column width follows the delete button (its longest text),
         the minimum table width follows the content of the columns still shown (columnFit.ts). -->
    <div ref="scroll" class="games-overview-scroll" :class="{'games-overview-scroll--covered': isCovered}"
      :style="layoutStyle" @scroll.passive="updateLayout">
      <table class="games-overview-table">
        <thead>
          <tr>
            <!-- Classes as on the cells: same width and alignment, the label stays above its content -->
            <th class="games-overview-status"></th>
            <th class="games-overview-game" v-i18n>Game</th>
            <th class="games-overview-generation" v-i18n>Gen</th>
            <!-- Finished games can no longer be watched, only their result shown -->
            <th>{{ spectatorLabel }}</th>
            <th v-for="column in shownColumns" :key="column.kind + column.seat">{{ columnLabel(column) }}</th>
            <th class="games-overview-actions"></th>
          </tr>
        </thead>
        <tbody>
          <GameOverview v-for="summary in games" :key="summary.id" :summary="summary" :columns="shownColumns" :isDeleting="deletingIds.includes(summary.id)" @delete="$emit('delete', $event)"/>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {AdminGameSummary} from '@/common/admin/AdminGameSummary';
import GameOverview from '@/client/components/admin/GameOverview.vue';
import {PlayerColumn} from '@/client/components/admin/playerColumns';
import {GameGroupKey} from '@/client/components/admin/gameGroups';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {ColumnFit, ColumnFitMeasure, fitColumns} from '@/client/components/admin/columnFit';

// Space between a column's widest content and its neighbour, so chips and labels never touch
const columnBreathingRoom = 8;

export default defineComponent({
  name: 'GamesTableCard',
  components: {GameOverview},
  props: {
    groupKey: {type: String as PropType<GameGroupKey>, required: true},
    title: {type: String, required: true},
    games: {type: Array as PropType<ReadonlyArray<AdminGameSummary>>, required: true},
    columns: {type: Array as PropType<ReadonlyArray<PlayerColumn>>, required: true},
    deletingIds: {type: Array as PropType<ReadonlyArray<string>>, required: true},
  },
  emits: ['delete'],
  data() {
    return {
      isCovered: false,
      actionsWidth: undefined as number | undefined,
      fitMeasure: undefined as ColumnFitMeasure | undefined,
      resizeObserver: undefined as ResizeObserver | undefined,
    };
  },
  computed: {
    spectatorLabel(): string {
      return translateText(this.groupKey === 'finished' ? 'Result' : 'Spectator');
    },
    // Before anything is measured (and in tests) all columns stay
    fit(): ColumnFit | undefined {
      return this.fitMeasure === undefined ? undefined : fitColumns(this.columns, this.games, this.fitMeasure);
    },
    shownColumns(): ReadonlyArray<PlayerColumn> {
      return this.fit?.columns ?? this.columns;
    },
    layoutStyle(): Record<string, string> {
      const style: Record<string, string> = {};
      if (this.actionsWidth !== undefined) {
        style['--games-overview-actions-width'] = this.actionsWidth + 'px';
      }
      if (this.fit !== undefined) {
        style['--games-overview-min-width'] = this.fit.minWidth + 'px';
      }
      return style;
    },
  },
  mounted() {
    // Card width (window), table width (names) and button width (language, web font) can change at any time
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.updateLayout());
      this.observeLayout();
    }
    this.updateLayout();
  },
  updated() {
    // New rows bring new buttons: observe them too
    this.observeLayout();
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
  },
  methods: {
    scrollElement(): HTMLElement | undefined {
      return this.$refs.scroll as HTMLElement | undefined;
    },
    observeLayout() {
      const scroll = this.scrollElement();
      if (this.resizeObserver === undefined || scroll === undefined) {
        return;
      }
      this.resizeObserver.observe(scroll);
      scroll.querySelectorAll('table, .games-overview-delete').forEach((element) => this.resizeObserver?.observe(element));
    },
    updateLayout() {
      const scroll = this.scrollElement();
      if (scroll === undefined) {
        return;
      }
      // One pixel tolerance: browsers round scroll positions on zoomed or HiDPI screens
      const hiddenRight = scroll.scrollWidth - scroll.clientWidth - scroll.scrollLeft;
      this.isCovered = hiddenRight > 1;
      const button = scroll.querySelector<HTMLElement>('.games-overview-delete');
      if (button !== null && button.offsetWidth > 0) {
        this.actionsWidth = button.offsetWidth;
      }
      this.measureColumns(scroll);
    },
    // Only values that do not depend on which columns are shown: otherwise dropping a column
    // could change the measure and bring it back (flicker)
    measureColumns(scroll: HTMLElement) {
      const table = scroll.querySelector('table');
      const head = table?.querySelector('thead tr');
      if (table === null || table === undefined || head === null || head === undefined || scroll.clientWidth === 0) {
        return;
      }
      const fixedWidth = ['status', 'game', 'generation', 'actions']
        .map((name) => head.querySelector<HTMLElement>('.games-overview-' + name)?.offsetWidth ?? 0)
        .reduce((sum, width) => sum + width, 0);
      // Labels of all columns, also the dropped ones, measured as text in the font of the head
      const labels = [this.spectatorLabel, ...this.columns.map((column) => this.columnLabel(column))];
      const labelWidths = labels.map((label) => textWidth(label, head.querySelector('th')));
      // Chips have their own width (spectator: its text, players: fixed in the stylesheet)
      const chipWidths = Array.from(table.querySelectorAll<HTMLElement>('tbody .games-overview-chip')).map((chip) => chip.offsetWidth);
      const measure = {
        available: scroll.clientWidth,
        fixedWidth,
        columnWidth: Math.max(0, ...labelWidths, ...chipWidths) + columnBreathingRoom,
        spacing: parseFloat(getComputedStyle(table).borderSpacing) || 0,
      };
      // Only replace on a real change: every replacement renders the table again
      if (JSON.stringify(measure) !== JSON.stringify(this.fitMeasure)) {
        this.fitMeasure = measure;
      }
    },
    // "Player 1" … "Player 6", "AI 1" … "AI 5"
    columnLabel(column: PlayerColumn): string {
      return translateTextWithParams(column.kind === 'human' ? 'Player ${0}' : 'AI ${0}', [String(column.seat + 1)]);
    },
  },
});

// Width of a text in the font of the given element; 0 where the browser cannot measure (tests)
let measuringContext: CanvasRenderingContext2D | null | undefined;
function textWidth(text: string, element: Element | null): number {
  if (element === null) {
    return 0;
  }
  if (measuringContext === undefined) {
    try {
      measuringContext = document.createElement('canvas').getContext('2d');
    } catch {
      measuringContext = null;
    }
  }
  if (measuringContext === null) {
    return 0;
  }
  measuringContext.font = getComputedStyle(element).font;
  return measuringContext.measureText(text).width;
}
</script>
