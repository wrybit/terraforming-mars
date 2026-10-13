<template>
  <!-- One group of the games overview (gameGroups.ts): heading with the number of games, the table right below -->
  <section class="games-overview-card" :class="'games-overview-group--' + groupKey">
    <h2><span v-i18n>{{ title }}</span> <span class="games-overview-lineup-games">{{ games.length }} {{ $t(games.length === 1 ? 'game' : 'games') }}</span></h2>
    <!-- Group-wide actions (e.g. bulk delete of open games) between heading and table -->
    <div v-if="$slots.actions !== undefined" class="games-overview-bulk"><slot name="actions"></slot></div>
    <div class="games-overview-scroll">
      <table class="games-overview-table">
        <thead>
          <tr>
            <th></th>
            <th v-i18n>Game</th>
            <th v-i18n>Gen</th>
            <!-- Finished games can no longer be watched, only their result shown -->
            <th>{{ $t(groupKey === 'finished' ? 'Result' : 'Spectator') }}</th>
            <th v-for="(column, index) in columns" :key="index">{{ columnLabel(column) }}</th>
            <th class="games-overview-actions"></th>
          </tr>
        </thead>
        <tbody>
          <GameOverview v-for="summary in games" :key="summary.id" :summary="summary" :columns="columns" :isDeleting="deletingIds.includes(summary.id)" @delete="$emit('delete', $event)"/>
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
import {translateTextWithParams} from '@/client/directives/i18n';

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
  methods: {
    // "Player 1" … "Player 6", "AI 1" … "AI 5"
    columnLabel(column: PlayerColumn): string {
      return translateTextWithParams(column.kind === 'human' ? 'Player ${0}' : 'AI ${0}', [String(column.seat + 1)]);
    },
  },
});
</script>
