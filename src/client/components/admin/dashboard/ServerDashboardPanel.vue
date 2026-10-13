<template>
  <!-- Machine, games and deployment at a glance (like phpSysInfo); loads the values and refreshes them -->
  <div class="server-dashboard">
    <p v-if="dashboard === undefined && status === 'loading'" class="games-overview-note" v-i18n>Loading…</p>
    <div v-else-if="dashboard === undefined" class="games-overview-card">
      <p class="games-overview-note" v-i18n>The server is not answering right now – probably it is just restarting.</p>
      <div class="server-dashboard-actions"><button type="button" class="btn btn-tone-quiet" @click="load" v-i18n>Try again</button></div>
    </div>
    <template v-else>
      <div class="server-dashboard-actions">
        <span class="server-dashboard-updated">{{ updatedText }}</span>
        <button type="button" class="btn btn-sm btn-tone-quiet" :disabled="status === 'loading'" @click="load" v-i18n>Refresh</button>
      </div>

      <ServerDashboardView :dashboard="dashboard"/>
    </template>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {paths} from '@/common/app/paths';
import {ServerDashboard} from '@/common/admin/ServerDashboard';
import {translateTextWithParams} from '@/client/directives/i18n';
import ServerDashboardView from '@/client/components/admin/dashboard/ServerDashboardView.vue';

// Live values (load, memory, players online) change quickly; every 30 s keeps them fresh without load on the server
const REFRESH_MILLISECONDS = 30 * 1000;

type DataModel = {
  dashboard: ServerDashboard | undefined,
  status: 'loading' | 'ready' | 'unreachable',
  timer: number | undefined,
};

export default defineComponent({
  name: 'ServerDashboardPanel',
  components: {ServerDashboardView},
  data(): DataModel {
    return {dashboard: undefined, status: 'loading', timer: undefined};
  },
  mounted() {
    void this.load();
    this.timer = window.setInterval(() => void this.load(), REFRESH_MILLISECONDS);
  },
  beforeUnmount() {
    window.clearInterval(this.timer);
  },
  computed: {
    updatedText(): string {
      return this.dashboard === undefined ? '' : translateTextWithParams('Updated at ${0}', [new Date(this.dashboard.generatedAtMs).toLocaleTimeString()]);
    },
  },
  methods: {
    async load(): Promise<void> {
      this.status = 'loading';
      try {
        const response = await fetch(paths.API_ADMIN_DASHBOARD, {cache: 'no-store'});
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        this.dashboard = await response.json();
        this.status = 'ready';
      } catch {
        // Keep the last values on screen: a short restart should not blank the dashboard
        this.status = 'unreachable';
      }
    },
  },
});
</script>
