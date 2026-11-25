<template>
  <!-- Machine, games and deployment at a glance (like phpSysInfo): every part loads on its own and refreshes -->
  <div class="server-dashboard">
    <div v-if="unreachable" class="games-overview-card">
      <p class="games-overview-note" v-i18n>The server is not answering right now – probably it is just restarting.</p>
      <div class="server-dashboard-actions"><button type="button" class="btn btn-tone-quiet" @click="load" v-i18n>Try again</button></div>
    </div>
    <template v-else>
      <div class="server-dashboard-actions">
        <span class="server-dashboard-updated">{{ updatedText }}</span>
        <button type="button" class="btn btn-sm btn-tone-quiet" :disabled="loading" @click="load" v-i18n>Refresh</button>
      </div>

      <ServerDashboardView :parts="parts" :errors="errors" @changed="load" />
    </template>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {DASHBOARD_SECTIONS, DashboardSection, DashboardSectionData, dashboardSectionPath} from '@/common/admin/dashboardSections';
import {translateTextWithParams} from '@/client/directives/i18n';
import ServerDashboardView from '@/client/components/admin/dashboard/ServerDashboardView.vue';
import {updateInProgress} from '@/client/components/admin/dashboard/deployState';

// Live values (load, memory, players online) change quickly; every 30 s keeps them fresh without load on the server
const REFRESH_MILLISECONDS = 30 * 1000;
// While an update runs every step (picked up, building, refused) should show within a few seconds
const UPDATE_REFRESH_MILLISECONDS = 5 * 1000;

type DataModel = {
  parts: Partial<DashboardSectionData>,
  // Why a part failed in the last round (e.g. "HTTP 502"); its cards say so instead of spinning on
  errors: Partial<Record<DashboardSection, string>>,
  loading: boolean,
  // No part has ever arrived and the last round failed completely
  unreachable: boolean,
  updatedAtMs: number | undefined,
  timer: number | undefined,
};

async function fetchSection<K extends DashboardSection>(section: K): Promise<DashboardSectionData[K]> {
  const response = await fetch(dashboardSectionPath(section), {cache: 'no-store'});
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export default defineComponent({
  name: 'ServerDashboardPanel',
  components: {ServerDashboardView},
  data(): DataModel {
    return {parts: {}, errors: {}, loading: false, unreachable: false, updatedAtMs: undefined, timer: undefined};
  },
  mounted() {
    void this.load();
  },
  beforeUnmount() {
    window.clearTimeout(this.timer);
  },
  computed: {
    updatedText(): string {
      return this.updatedAtMs === undefined ? '' : translateTextWithParams('Updated at ${0}', [new Date(this.updatedAtMs).toLocaleTimeString()]);
    },
  },
  methods: {
    // All parts at once; each one fills its cards the moment it arrives, a slow part holds back no other
    async load(): Promise<void> {
      this.loading = true;
      this.unreachable = false;
      const results = await Promise.allSettled(DASHBOARD_SECTIONS.map(async (section) => {
        try {
          const data = await fetchSection(section);
          this.parts = {...this.parts, [section]: data};
          this.errors = {...this.errors, [section]: undefined};
        } catch (error) {
          this.errors = {...this.errors, [section]: error instanceof Error ? error.message : String(error)};
          throw error;
        }
      }));
      // A failed part keeps its last values on screen: a short restart should not blank the dashboard
      const anyArrived = results.some((result) => result.status === 'fulfilled');
      this.unreachable = !anyArrived && Object.keys(this.parts).length === 0;
      if (anyArrived) {
        this.updatedAtMs = Date.now();
      }
      this.loading = false;
      this.scheduleNextLoad();
    },
    // One timer only: a click on "Refresh" restarts the wait instead of adding a second refresh cycle
    scheduleNextLoad(): void {
      window.clearTimeout(this.timer);
      const busy = this.parts.deploy !== undefined && updateInProgress(this.parts.deploy);
      this.timer = window.setTimeout(() => void this.load(), busy ? UPDATE_REFRESH_MILLISECONDS : REFRESH_MILLISECONDS);
    },
  },
});
</script>
