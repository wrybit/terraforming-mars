<template>
  <!-- Values of one dashboard answer: small cards first, then charts, then commits -->
  <div class="server-dashboard-view">
    <div class="server-dashboard-grid">
      <section class="games-overview-card">
        <h2 v-i18n>Server</h2>
        <DashboardServerLogo :identity="dashboard.identity"/>
        <DashboardFacts :facts="serverFacts"/>
      </section>
      <section class="games-overview-card">
        <h2 v-i18n>Processor</h2>
        <DashboardSplitBar v-if="dashboard.machineUsage !== undefined" label="Processor load" :segments="cpuParts" :total="100" unit="percent"
          :measuredAtMs="dashboard.machineUsage.measuredAtMs"/>
        <DashboardMeter v-else label="Processor load" :used="dashboard.cpu.usagePercent" :total="100" unit="percent"/>
        <DashboardFacts :facts="processorFacts"/>
      </section>
      <section class="games-overview-card">
        <h2 v-i18n>Memory</h2>
        <DashboardSplitBar label="Memory" :segments="memoryParts" :total="dashboard.memory.totalBytes" :measuredAtMs="dashboard.machineUsage?.measuredAtMs"/>
        <DashboardMeter v-if="dashboard.memory.swapTotalBytes > 0" label="Swap" :used="dashboard.memory.swapTotalBytes - dashboard.memory.swapFreeBytes" :total="dashboard.memory.swapTotalBytes"/>
      </section>
      <section class="games-overview-card">
        <h2 v-i18n>Disk</h2>
        <DashboardSplitBar v-if="dashboard.disk !== undefined" label="Disk" :segments="diskParts" :total="dashboard.disk.totalBytes"
          :measuredAtMs="dashboard.disk.usage?.docker === undefined ? undefined : dashboard.disk.usage.measuredAtMs"/>
      </section>
      <section class="games-overview-card">
        <h2 v-i18n>Games</h2>
        <DashboardFacts :facts="gameFacts"/>
      </section>
      <section class="games-overview-card">
        <h2 v-i18n>Graphics</h2>
        <ul v-if="dashboard.gpus.length > 0" class="server-dashboard-list">
          <li v-for="(gpu, index) in dashboard.gpus" :key="index">{{ gpu }}</li>
        </ul>
        <p v-else class="games-overview-note" v-i18n>No graphics adapter found</p>
      </section>
    </div>

    <div class="server-dashboard-grid server-dashboard-grid--wide">
      <section class="games-overview-card">
        <h2 v-i18n>Players per day</h2>
        <StatsBarChart :bars="dayBars" axisLabel="Distinct human players with a move that day"/>
      </section>
      <section class="games-overview-card">
        <h2 v-i18n>Players per week</h2>
        <StatsBarChart :bars="weekBars" axisLabel="Week starting on"/>
      </section>
      <section class="games-overview-card">
        <h2 v-i18n>Availability</h2>
        <StatsBarChart v-if="availabilityBars.length > 0" :bars="availabilityBars" axisLabel="Share of the day the server was running (%)"/>
        <p v-else class="games-overview-note" v-i18n>First values after one minute of running</p>
        <h3 v-if="dashboard.serverStarts.length > 0" class="server-dashboard-subheading" v-i18n>Last server starts</h3>
        <ul class="server-dashboard-list">
          <li v-for="start in dashboard.serverStarts.slice(0, 8)" :key="start">{{ formatDateTime(start) }}</li>
        </ul>
      </section>
    </div>

    <section class="games-overview-card">
      <h2 v-i18n>Players online by time of day</h2>
      <DashboardDayOverlay v-if="dashboard.presence.length > 0" :profiles="dashboard.presence"/>
      <p v-else class="games-overview-note" v-i18n>First values after one minute of running</p>
    </section>

    <section class="games-overview-card">
      <h2 v-i18n>Recent commits</h2>
      <p v-if="dashboard.commits.length === 0" class="games-overview-note" v-i18n>No commit history in this build</p>
      <table v-else class="server-dashboard-commits">
        <tr v-for="commit in dashboard.commits" :key="commit.hash">
          <td class="server-dashboard-commit-time">{{ formatDateTime(commit.time) }}</td>
          <td class="server-dashboard-commit-hash"><code>{{ commit.hash }}</code></td>
          <td>{{ commit.title }}</td>
        </tr>
      </table>
    </section>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {ServerDashboard} from '@/common/admin/ServerDashboard';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import StatsBarChart from '@/client/components/stats/StatsBarChart.vue';
import {StatsBar} from '@/client/components/stats/statsTypes';
import DashboardFacts from '@/client/components/admin/dashboard/DashboardFacts.vue';
import DashboardServerLogo from '@/client/components/admin/dashboard/DashboardServerLogo.vue';
import DashboardMeter from '@/client/components/admin/dashboard/DashboardMeter.vue';
import DashboardDayOverlay from '@/client/components/admin/dashboard/DashboardDayOverlay.vue';
import DashboardSplitBar from '@/client/components/admin/dashboard/DashboardSplitBar.vue';
import {cpuSegments, diskSegments, memorySegments, UsageSegment} from '@/client/components/admin/dashboard/usageSegments';
import {DashboardFact} from '@/client/components/admin/dashboard/dashboardTypes';
import {formatDateTime, formatDuration, periodBars} from '@/client/components/admin/dashboard/dashboardFormat';

export default defineComponent({
  name: 'ServerDashboardView',
  components: {DashboardDayOverlay, DashboardFacts, DashboardMeter, DashboardServerLogo, DashboardSplitBar, StatsBarChart},
  props: {
    dashboard: {type: Object as PropType<ServerDashboard>, required: true},
  },
  computed: {
    serverFacts(): Array<DashboardFact> {
      const dashboard = this.dashboard;
      const reachability = dashboard.reachability;
      return [
        {label: 'Host name', value: dashboard.host.hostname},
        {label: 'Operating system', value: dashboard.host.operatingSystem},
        {label: 'Architecture', value: dashboard.host.architecture},
        {label: 'Node.js', value: dashboard.host.nodeVersion},
        {label: 'Game server running for', value: formatDuration(dashboard.host.serverUptimeSeconds)},
        {label: 'Machine running for', value: formatDuration(dashboard.host.systemUptimeSeconds)},
        {label: 'Version', value: `${dashboard.build.head} · ${formatDateTime(dashboard.build.builtAt)}`},
        reachability.ok ?
          {label: 'Public address', value: translateTextWithParams('Reachable (${0} ms)', [String(reachability.latencyMs)]), tone: 'good', title: reachability.url} :
          {label: 'Public address', value: translateText('Not reachable'), tone: 'critical',
            title: `${reachability.url}: ${reachability.error ?? `HTTP ${reachability.statusCode}`}`},
      ];
    },
    processorFacts(): Array<DashboardFact> {
      const cpu = this.dashboard.cpu;
      return [
        {label: 'Model', value: cpu.model},
        {label: 'Cores', value: String(cpu.cores)},
        {label: 'Load (1 / 5 / 15 min)', value: cpu.loadAverage.map((load) => load.toFixed(2)).join(' / ')},
        {label: 'Temperature', value: cpu.temperatureCelsius === undefined ? translateText('No sensor') : `${cpu.temperatureCelsius.toFixed(1)} °C`},
      ];
    },
    cpuParts(): Array<UsageSegment> {
      return this.dashboard.machineUsage === undefined ? [] : cpuSegments(this.dashboard.machineUsage);
    },
    memoryParts(): Array<UsageSegment> {
      return memorySegments(this.dashboard.memory, this.dashboard.machineUsage);
    },
    diskParts(): Array<UsageSegment> {
      return this.dashboard.disk === undefined ? [] : diskSegments(this.dashboard.disk);
    },
    gameFacts(): Array<DashboardFact> {
      const games = this.dashboard.games;
      return [
        {label: 'Running games', value: String(games.running)},
        {label: 'Finished games', value: String(games.finished)},
        {label: 'Players online now', value: String(games.playersOnline), tone: games.playersOnline > 0 ? 'good' : undefined},
      ];
    },
    dayBars(): Array<StatsBar> {
      return periodBars(this.dashboard.activity.days);
    },
    weekBars(): Array<StatsBar> {
      return periodBars(this.dashboard.activity.weeks);
    },
    availabilityBars(): Array<StatsBar> {
      return periodBars(this.dashboard.availability);
    },
  },
  methods: {
    formatDateTime,
  },
});
</script>
