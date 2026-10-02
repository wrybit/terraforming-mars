<template>
  <section class="stats-card">
    <a :href="overviewHref" data-stats-link class="stats-link">← <span v-i18n>Overview</span></a>
    <h2 class="stats-top-title"><span v-i18n>{{ title }}</span> <span class="stats-dim">· Top {{ entries.length }}</span></h2>
    <p v-if="entries.length === 0" class="stats-note" v-i18n>No games for these filters.</p>
    <StatsShowcase v-else class="stats-showcase--grid" :kind="kind" :entries="entries"/>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import StatsShowcase from './StatsShowcase.vue';
import {EntityStats, mostPlayed} from './statsAggregate';
import {statsHref, StatsTopKind} from './statsNavigation';
import {StatsPlayerResult} from './statsResults';
import {SHOWCASE_TITLES, TOP_PAGE_SIZE} from './statsShowcase';

// Aufgeklappte Top-Liste der Übersicht: die 20 meistgespielten Karten bzw. Konzerne als Raster
export default defineComponent({
  name: 'StatsTopView',
  components: {StatsShowcase},
  props: {
    kind: {type: String as PropType<StatsTopKind>, required: true},
    results: {type: Array as PropType<ReadonlyArray<StatsPlayerResult>>, required: true},
  },
  computed: {
    entries(): Array<EntityStats> {
      return mostPlayed(this.results, this.kind, TOP_PAGE_SIZE);
    },
    title(): string {
      return SHOWCASE_TITLES[this.kind];
    },
    overviewHref(): string {
      return statsHref({type: 'tab', tab: 'overview'});
    },
  },
});
</script>
