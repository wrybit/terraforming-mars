<template>
  <section class="stats-card">
    <h2><span v-i18n>Games</span> <span class="stats-dim">· {{ sortedGames.length }}</span></h2>
    <StatsGameList :games="sortedGames"/>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {StatsGame} from '@/common/stats/StatsGame';
import StatsGameList from './StatsGameList.vue';

// "Games" tab: every game that matches the filters, newest first – same list as on a detail page
export default defineComponent({
  name: 'StatsGamesView',
  components: {StatsGameList},
  props: {
    games: {type: Array as PropType<ReadonlyArray<StatsGame>>, required: true},
  },
  computed: {
    sortedGames(): Array<StatsGame> {
      return [...this.games].sort((first, second) => second.summary.createdTimeMs - first.summary.createdTimeMs);
    },
  },
});
</script>
