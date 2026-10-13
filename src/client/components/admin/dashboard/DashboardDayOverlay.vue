<template>
  <!-- When people play: every day of the last weeks as a thin line over the 24 hours, on top of each other,
       the average as a bold line. Busy hours show up as a dense, high band. -->
  <div class="stats-chart dashboard-day-overlay">
    <svg :viewBox="`0 0 ${width} ${height}`" role="img">
      <g v-for="tick in ticks" :key="`tick-${tick}`">
        <line :x1="left" :x2="width - right" :y1="y(tick)" :y2="y(tick)" class="stats-chart-grid"/>
        <text :x="left - 6" :y="y(tick) + 4" text-anchor="end" class="stats-chart-label">{{ tick }}</text>
      </g>
      <polyline v-for="(profile, index) in profiles" :key="profile.start" :points="path(profile.hours)" fill="none"
        class="dashboard-day-overlay-day" :class="{'dashboard-day-overlay-day--recent': index >= profiles.length - 7}">
        <title>{{ dayTitle(profile.start) }}</title>
      </polyline>
      <polyline :points="path(average)" fill="none" class="dashboard-day-overlay-average"/>
      <text v-for="hour in hourLabels" :key="`hour-${hour}`" :x="x(hour)" :y="height - 4" text-anchor="middle" class="stats-chart-label">{{ hour }}</text>
    </svg>
    <div class="stats-legend">
      <span><i class="dashboard-day-overlay-swatch dashboard-day-overlay-swatch--recent"></i><span v-i18n>Last 7 days</span></span>
      <span><i class="dashboard-day-overlay-swatch"></i><span v-i18n>Weeks before</span></span>
      <span><i class="dashboard-day-overlay-swatch dashboard-day-overlay-swatch--average"></i><span v-i18n>Average</span></span>
      <span class="stats-dim" v-i18n>Distinct human players with a move per hour of the day</span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {DashboardDayProfile} from '@/common/admin/ServerDashboard';

const HOURS = 24;

export default defineComponent({
  name: 'DashboardDayOverlay',
  props: {
    profiles: {type: Array as PropType<ReadonlyArray<DashboardDayProfile>>, required: true},
  },
  data() {
    return {width: 640, height: 220, left: 30, right: 8, top: 12, bottom: 22, hourLabels: [0, 3, 6, 9, 12, 15, 18, 21]};
  },
  computed: {
    /** Mean per hour over the days that already had that hour (today stops at the current hour). */
    average(): Array<number> {
      return Array.from({length: HOURS}, (_, hour) => {
        const values = this.profiles.flatMap((profile) => hour < profile.hours.length ? [profile.hours[hour]] : []);
        return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
      });
    },
    maximum(): number {
      return Math.max(1, ...this.profiles.flatMap((profile) => profile.hours));
    },
    ticks(): Array<number> {
      // About four grid lines in whole players
      const step = Math.max(1, Math.ceil(this.maximum / 4));
      const ticks = [];
      for (let tick = 0; tick <= this.maximum; tick += step) {
        ticks.push(tick);
      }
      return ticks;
    },
  },
  methods: {
    x(hour: number): number {
      return this.left + (this.width - this.left - this.right) * hour / (HOURS - 1);
    },
    y(value: number): number {
      return this.height - this.bottom - (this.height - this.top - this.bottom) * value / this.maximum;
    },
    path(hours: ReadonlyArray<number>): string {
      return hours.map((value, hour) => `${this.x(hour)},${this.y(value)}`).join(' ');
    },
    dayTitle(start: string): string {
      const [year, month, day] = start.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString(undefined, {weekday: 'short', day: 'numeric', month: 'numeric'});
    },
  },
});
</script>
