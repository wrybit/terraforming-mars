<template>
  <section class="stats-card">
    <h2><span v-i18n>Games</span> <span class="stats-dim">· {{ games.length }}</span></h2>
    <StatsGameList :games="games"/>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {StatsGame} from '@/common/stats/StatsGame';
import StatsGameList from './StatsGameList.vue';

// "Games" tab: every game that matches the filters – same list as on a detail page (newest first, sortable)
export default defineComponent({
  name: 'StatsGamesView',
  components: {StatsGameList},
  props: {
    games: {type: Array as PropType<ReadonlyArray<StatsGame>>, required: true},
  },
});
</script>
