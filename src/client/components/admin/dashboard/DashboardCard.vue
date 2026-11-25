<template>
  <!-- One card of the dashboard: title at once; until its values are there a spinner in the card's final size -->
  <section class="games-overview-card dashboard-card" :class="ready ? undefined : ['dashboard-card--loading', 'dashboard-card--' + size]" :aria-busy="!ready">
    <h2 v-i18n>{{ title }}</h2>
    <slot v-if="ready"></slot>
    <p v-else-if="error !== undefined" class="games-overview-note games-overview-note--error dashboard-card-error" v-i18n="[error]">Not loaded (${0}). Next attempt in 30 seconds.</p>
    <LoadingSpinner v-else />
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import LoadingSpinner from '@/client/components/common/LoadingSpinner.vue';

// Height of the filled card, so the page does not jump when the values arrive (admin_dashboard.less)
export type DashboardCardSize = 'server' | 'processor' | 'memory' | 'disk' | 'games' | 'graphics' | 'players' | 'availability' | 'day' | 'commits';

export default defineComponent({
  name: 'DashboardCard',
  components: {LoadingSpinner},
  props: {
    title: {type: String, required: true},
    // The parts this card shows have arrived (dashboardSections.ts)
    ready: {type: Boolean, required: true},
    size: {type: String as PropType<DashboardCardSize>, required: true},
    // Why the parts did not arrive in the last round (e.g. "HTTP 502")
    error: {type: String, default: undefined},
  },
});
</script>
