<template>
  <StatsTable class="stats-games" :columns="columns" :rows="games" :rowKey="rowKey" initialSort="date">
    <template #players="{row}">
      <span class="stats-game-players">
        <span v-for="player in row.summary.players" :key="player.name" class="stats-game-player" :class="[`player_translucent_bg_color_${player.color}`, {'stats-game-winner': player.isWinner, 'stats-game-other': isOther(row, player.name)}]">
          {{ player.name }} <strong>{{ player.victoryPoints }}</strong>
        </span>
      </span>
    </template>
    <template #board="{row}">
      <!-- One lookup per row; v-for over one value also narrows the type for the template -->
      <template v-for="board in [boardOf(row)]" :key="board ?? 'none'">
        <StatsEntityName v-if="board !== undefined" kind="board" :name="board"/>
        <span v-else class="stats-dim">–</span>
      </template>
    </template>
    <template #result="{row}">
      <a v-if="row.resultUrl !== undefined" :href="row.resultUrl" target="_blank" class="stats-link" v-i18n>Result</a>
    </template>
  </StatsTable>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {StatsGame} from '@/common/stats/StatsGame';
import StatsEntityName from './StatsEntityName.vue';
import StatsTable from './StatsTable.vue';
import {StatsColumn} from './statsTypes';
import {boardLabel, formatDate, formatDuration} from './statsLabels';
import {lineupOf, totalTimeSeconds} from './statsResults';
import {StatsBoardKey, statsBoardKey} from '@/common/stats/statsBoardKey';

// Every column sorts on click; the players column groups by lineup (names in alphabetical order)
const COLUMNS: ReadonlyArray<StatsColumn> = [
  {key: 'date', label: 'Date', text: true, firstAscending: false, value: (game: StatsGame) => game.summary.createdTimeMs, format: (game: StatsGame) => formatDate(game.summary.createdTimeMs)},
  {key: 'players', label: 'Players', text: true, value: (game: StatsGame) => lineupOf(game)},
  {key: 'generation', label: 'Gen', value: (game: StatsGame) => game.summary.generation || undefined, format: (game: StatsGame) => String(game.summary.generation || '–')},
  {key: 'time', label: 'Game length', value: (game: StatsGame) => totalTimeSeconds(game), format: (game: StatsGame) => formatDuration(totalTimeSeconds(game))},
  {key: 'board', label: 'Board', text: true, value: (game: StatsGame) => {
    const board = statsBoardKey(game.details);
    return board === undefined ? undefined : boardLabel(board);
  }},
  {key: 'result', label: '', sortable: false, value: () => undefined},
];

// Games of a detail page or the games tab, newest first, with a link to the results page
export default defineComponent({
  name: 'StatsGameList',
  components: {StatsEntityName, StatsTable},
  props: {
    games: {type: Array as PropType<ReadonlyArray<StatsGame>>, required: true},
    // Game ID → players the detail page is about; the others recede
    highlighted: {type: Map as PropType<Map<string, Array<string>>>, required: false},
  },
  computed: {
    columns(): ReadonlyArray<StatsColumn> {
      return COLUMNS;
    },
  },
  methods: {
    boardOf(game: StatsGame): StatsBoardKey | undefined {
      return statsBoardKey(game.details);
    },
    rowKey(game: StatsGame): string {
      return game.summary.id;
    },
    isOther(game: StatsGame, name: string): boolean {
      const names = this.highlighted?.get(game.summary.id);
      return names !== undefined && !names.includes(name);
    },
  },
});
</script>
