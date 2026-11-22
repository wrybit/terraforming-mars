<template>
  <section class="games-overview-card dashboard-rust-fallbacks">
    <!-- Decisions the TypeScript AI made for the Rust AI: count of the last day large (warning color above zero),
         the newest cases below as a table -->
    <h2 v-i18n>Rust AI fallbacks</h2>
    <div class="dashboard-online" :class="{'dashboard-rust-fallbacks--some': fallbacks.last24h > 0}">
      <span class="dashboard-online-label" v-i18n>Last 24 hours</span>
      <span class="dashboard-online-count">{{ fallbacks.last24h }}</span>
    </div>
    <table v-if="fallbacks.recent.length > 0" class="dashboard-rust-fallbacks-table">
      <thead>
        <tr>
          <th v-i18n>Time</th>
          <th v-i18n>Game</th>
          <th v-i18n>Gen</th>
          <th v-i18n>Decision</th>
          <th v-i18n>Reason</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(entry, index) in fallbacks.recent" :key="index">
          <td>{{ formatDateTime(entry.timeMs) }}</td>
          <td class="dashboard-rust-fallbacks-game">{{ entry.gameId }}</td>
          <td>{{ entry.generation }}</td>
          <td>{{ entry.decision }}</td>
          <td>{{ entry.reason }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {RustFallbackSummary} from '@/common/admin/RustFallback';
import {formatDateTime} from '@/client/components/admin/dashboard/dashboardFormat';

export default defineComponent({
  name: 'DashboardRustFallbacks',
  props: {
    fallbacks: {type: Object as PropType<RustFallbackSummary>, required: true},
  },
  methods: {
    formatDateTime,
  },
});
</script>
