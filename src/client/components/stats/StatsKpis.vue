<template>
  <div class="stats-kpis">
    <div v-for="tile in tiles" :key="tile.label" class="stats-kpi">
      <div class="stats-kpi-label" v-i18n>{{ tile.label }}</div>
      <div class="stats-kpi-value">{{ tile.value }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {StatsKpi} from './statsTypes';

// Kennzahlen-Kacheln (Übersicht, Detailseiten)
export default defineComponent({
  name: 'StatsKpis',
  props: {
    tiles: {type: Array as PropType<ReadonlyArray<StatsKpi>>, required: true},
  },
});
</script>
