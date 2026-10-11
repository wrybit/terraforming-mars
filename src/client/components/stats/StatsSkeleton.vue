<template>
  <!-- While the statistics load: the boxes of the page are already there (empty), a loading bar in the middle of the
       screen; the content then fills the same places instead of the page building up piece by piece -->
  <div class="stats-stack stats-skeleton" aria-busy="true">
    <template v-if="overview">
      <section class="stats-card">
        <h2 v-i18n>{{ titles.glance }}</h2>
        <div class="stats-kpis">
          <div v-for="index in kpiCount" :key="index" class="stats-kpi stats-skeleton-kpi"></div>
        </div>
      </section>
      <div class="stats-columns">
        <section v-for="title in showcaseTitles" :key="title" class="stats-card">
          <h2><span v-i18n>{{ title }}</span> <span class="stats-dim">→ Top 20</span></h2>
          <div class="stats-skeleton-cards">
            <div v-for="index in showcaseSize" :key="index" class="stats-skeleton-card"></div>
          </div>
        </section>
      </div>
      <section class="stats-card">
        <h2 v-i18n>{{ titles.lineups }}</h2>
        <div class="stats-skeleton-block stats-skeleton-block--short"></div>
      </section>
      <div class="stats-columns">
        <section v-for="title in chartTitles" :key="title" class="stats-card">
          <h2 v-i18n>{{ title }}</h2>
          <div class="stats-skeleton-block stats-skeleton-block--chart"></div>
        </section>
      </div>
    </template>
    <section v-else class="stats-card">
      <div class="stats-skeleton-block stats-skeleton-block--tall"></div>
    </section>
    <div class="stats-skeleton-loader">
      <span v-i18n>Loading…</span>
      <LoadingBar/>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import LoadingBar from '@/client/components/common/LoadingBar.vue';
import {OVERVIEW_KPI_COUNT, OVERVIEW_TITLES} from './statsOverviewSections';
import {SHOWCASE_SIZE, SHOWCASE_TITLES} from './statsShowcase';

// Placeholder of the statistics page while the games load (StatsPage.vue)
export default defineComponent({
  name: 'StatsSkeleton',
  components: {LoadingBar},
  props: {
    // Overview tab: its boxes; any other view: one empty box
    overview: {type: Boolean, default: false},
  },
  data() {
    return {
      titles: OVERVIEW_TITLES,
      kpiCount: OVERVIEW_KPI_COUNT,
      showcaseSize: SHOWCASE_SIZE,
      showcaseTitles: [SHOWCASE_TITLES.card, SHOWCASE_TITLES.corporation],
      chartTitles: [OVERVIEW_TITLES.recent, OVERVIEW_TITLES.generations, OVERVIEW_TITLES.points, OVERVIEW_TITLES.globals],
    };
  },
});
</script>
