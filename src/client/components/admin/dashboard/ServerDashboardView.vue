<template>
  <!-- Small cards first, then charts, then commits; every card fills in as soon as its parts have arrived -->
  <div class="server-dashboard-view">
    <div class="server-dashboard-grid">
      <DashboardCard title="Server" size="server" :ready="has('machine', 'reachability', 'deploy')" :error="errorOf('machine', 'reachability', 'deploy')">
        <DashboardServerLogo :identity="dashboard.identity" />
        <DashboardFacts :facts="serverFacts" />
      </DashboardCard>
      <DashboardCard title="Processor" size="processor" :ready="has('machine')" :error="errorOf('machine')">
        <DashboardSplitBar v-if="dashboard.machineUsage !== undefined" label="Processor load" :segments="cpuParts" :total="100" unit="percent"
          :measuredAtMs="dashboard.machineUsage.measuredAtMs" />
        <DashboardMeter v-else label="Processor load" :used="dashboard.cpu.usagePercent" :total="100" unit="percent" />
        <DashboardFacts :facts="processorFacts" />
      </DashboardCard>
      <DashboardCard title="Memory" size="memory" :ready="has('machine')" :error="errorOf('machine')">
        <DashboardSplitBar label="Memory" :segments="memoryParts" :total="dashboard.memory.totalBytes" :measuredAtMs="dashboard.machineUsage?.measuredAtMs" />
        <DashboardMeter v-if="dashboard.memory.swapTotalBytes > 0" label="Swap" :used="dashboard.memory.swapTotalBytes - dashboard.memory.swapFreeBytes" :total="dashboard.memory.swapTotalBytes" />
      </DashboardCard>
      <DashboardCard title="Disk" size="disk" :ready="has('machine')" :error="errorOf('machine')">
        <DashboardSplitBar v-if="dashboard.disk !== undefined" label="Disk" :segments="diskParts" :total="dashboard.disk.totalBytes"
          :measuredAtMs="dashboard.disk.usage?.docker === undefined ? undefined : dashboard.disk.usage.measuredAtMs" />
      </DashboardCard>
      <DashboardCard title="Games" size="games" :ready="has('games', 'deploy')" :error="errorOf('games', 'deploy')">
        <DashboardOnlineCount :count="dashboard.playersOnline" />
        <DashboardFacts :facts="gameFacts" />
        <DashboardUpdateButton :dashboard="dashboard" @changed="$emit('changed')" />
      </DashboardCard>
      <DashboardCard title="Graphics" size="graphics" :ready="has('machine')" :error="errorOf('machine')">
        <DashboardGraphics :gpus="dashboard.gpus" :mainMemoryBytes="dashboard.memory.totalBytes" />
      </DashboardCard>
    </div>

    <div class="server-dashboard-grid server-dashboard-grid--wide">
      <DashboardCard title="Players per day" size="players" :ready="has('games')" :error="errorOf('games')">
        <StatsBarChart :bars="dayBars" axisLabel="Distinct human players with a move that day" />
      </DashboardCard>
      <DashboardCard title="Players per week" size="players" :ready="has('games')" :error="errorOf('games')">
        <StatsBarChart :bars="weekBars" axisLabel="Distinct human players with a move in that calendar week" />
      </DashboardCard>
      <DashboardCard title="Availability" size="availability" :ready="has('history')" :error="errorOf('history')">
        <StatsBarChart v-if="availabilityBars.length > 0" :bars="availabilityBars" axisLabel="Share of the day the server was running (%)" />
        <p v-else class="games-overview-note" v-i18n>First values after one minute of running</p>
        <h3 v-if="dashboard.serverStarts.length > 0" class="server-dashboard-subheading" v-i18n>Last server starts</h3>
        <ul class="server-dashboard-list">
          <li v-for="start in dashboard.serverStarts.slice(0, 8)" :key="start">{{ formatDateTime(start) }}</li>
        </ul>
      </DashboardCard>
    </div>

    <DashboardCard title="Players online by time of day" size="day" :ready="has('history')" :error="errorOf('history')">
      <DashboardDayOverlay v-if="dashboard.presence.length > 0" :profiles="dashboard.presence" />
      <p v-else class="games-overview-note" v-i18n>First values after one minute of running</p>
    </DashboardCard>

    <DashboardRustFallbacks v-if="dashboard.rustFallbacks !== undefined" :fallbacks="dashboard.rustFallbacks" />

    <DashboardCommits v-if="has('deploy')" :dashboard="dashboard" @changed="$emit('changed')" />
    <DashboardCard v-else title="Recent commits" size="commits" :ready="false" :error="errorOf('deploy')" />
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {ServerDashboard} from '@/common/admin/ServerDashboard';
import {DashboardSection, DashboardSectionData} from '@/common/admin/dashboardSections';
import DashboardCard from '@/client/components/admin/dashboard/DashboardCard.vue';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import StatsBarChart from '@/client/components/stats/StatsBarChart.vue';
import {StatsBar} from '@/client/components/stats/statsTypes';
import DashboardFacts from '@/client/components/admin/dashboard/DashboardFacts.vue';
import DashboardRustFallbacks from '@/client/components/admin/dashboard/DashboardRustFallbacks.vue';
import DashboardServerLogo from '@/client/components/admin/dashboard/DashboardServerLogo.vue';
import DashboardMeter from '@/client/components/admin/dashboard/DashboardMeter.vue';
import DashboardCommits from '@/client/components/admin/dashboard/DashboardCommits.vue';
import DashboardGraphics from '@/client/components/admin/dashboard/DashboardGraphics.vue';
import DashboardUpdateButton from '@/client/components/admin/dashboard/DashboardUpdateButton.vue';
import DashboardOnlineCount from '@/client/components/admin/dashboard/DashboardOnlineCount.vue';
import DashboardDayOverlay from '@/client/components/admin/dashboard/DashboardDayOverlay.vue';
import DashboardSplitBar from '@/client/components/admin/dashboard/DashboardSplitBar.vue';
import {cpuSegments, diskSegments, memorySegments, UsageSegment} from '@/client/components/admin/dashboard/usageSegments';
import {DashboardFact} from '@/client/components/admin/dashboard/dashboardTypes';
import {formatDateTime, formatDuration, periodBars} from '@/client/components/admin/dashboard/dashboardFormat';

export default defineComponent({
  name: 'ServerDashboardView',
  components: {DashboardCard, DashboardCommits, DashboardDayOverlay, DashboardFacts, DashboardGraphics, DashboardOnlineCount, DashboardMeter, DashboardRustFallbacks, DashboardServerLogo, DashboardSplitBar, DashboardUpdateButton, StatsBarChart},
  props: {
    // The parts that have arrived so far; a card waits for the ones it shows
    parts: {type: Object as PropType<Partial<DashboardSectionData>>, required: true},
    errors: {type: Object as PropType<Partial<Record<DashboardSection, string>>>, default: () => ({})},
  },
  emits: ['changed'],
  computed: {
    // Read only inside a card whose parts are there (has()), so every value read is present
    dashboard(): ServerDashboard {
      return Object.assign({}, ...Object.values(this.parts)) as ServerDashboard;
    },
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
        // Installed Rust AI: short version and the time of its release, commit in the tooltip
        ...(dashboard.rustAi === undefined ? [] : [{label: 'Rust AI', value: [dashboard.rustAi.version ?? dashboard.rustAi.commit ?? '–',
          dashboard.rustAi.generated === undefined ? undefined : formatDateTime(dashboard.rustAi.generated)].filter((part) => part !== undefined).join(' · '),
        title: dashboard.rustAi.commit}]),
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
      ];
    },
    dayBars(): Array<StatsBar> {
      return periodBars(this.dashboard.activity.days);
    },
    weekBars(): Array<StatsBar> {
      return periodBars(this.dashboard.activity.weeks, 'week');
    },
    availabilityBars(): Array<StatsBar> {
      return periodBars(this.dashboard.availability);
    },
  },
  methods: {
    has(...sections: Array<DashboardSection>): boolean {
      return sections.every((section) => this.parts[section] !== undefined);
    },
    // Only a card without values shows why: one with older values keeps them on screen
    errorOf(...sections: Array<DashboardSection>): string | undefined {
      return sections.map((section) => this.parts[section] === undefined ? this.errors[section] : undefined).find((error) => error !== undefined);
    },
    formatDateTime,
  },
});
</script>
