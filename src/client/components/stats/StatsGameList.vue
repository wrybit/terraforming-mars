<template>
  <div class="stats-table-scroll">
    <table class="stats-table stats-games">
      <thead>
        <tr>
          <th class="stats-table-text" v-i18n>Date</th>
          <th class="stats-table-text" v-i18n>Players</th>
          <th v-i18n>Gen</th>
          <th class="stats-table-text" v-i18n>Board</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="game in games" :key="game.summary.id">
          <td class="stats-table-text">{{ formatDate(game.summary.createdTimeMs) }}</td>
          <td class="stats-table-text">
            <span class="stats-game-players">
              <span v-for="player in game.summary.players" :key="player.name" class="stats-game-player" :class="[`player_translucent_bg_color_${player.color}`, {'stats-game-winner': player.isWinner, 'stats-game-other': isOther(game, player.name)}]">
                {{ player.name }} <strong>{{ player.victoryPoints }}</strong>
              </span>
            </span>
          </td>
          <td>{{ game.summary.generation || '–' }}</td>
          <td class="stats-table-text">
            <StatsEntityName v-if="game.details?.boardName !== undefined" kind="board" :name="game.details.boardName"/>
            <span v-else class="stats-dim">–</span>
          </td>
          <td><a v-if="game.resultUrl !== undefined" :href="game.resultUrl" target="_blank" class="stats-link" v-i18n>Result</a></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {StatsGame} from '@/common/stats/StatsGame';
import StatsEntityName from './StatsEntityName.vue';
import {formatDate} from './statsLabels';

// Games of a detail page, newest first, with a link to the results page
export default defineComponent({
  name: 'StatsGameList',
  components: {StatsEntityName},
  props: {
    games: {type: Array as PropType<ReadonlyArray<StatsGame>>, required: true},
    // Game ID → players the detail page is about; the others recede
    highlighted: {type: Map as PropType<Map<string, Array<string>>>, required: false},
  },
  methods: {
    formatDate,
    isOther(game: StatsGame, name: string): boolean {
      const names = this.highlighted?.get(game.summary.id);
      return names !== undefined && !names.includes(name);
    },
  },
});
</script>
