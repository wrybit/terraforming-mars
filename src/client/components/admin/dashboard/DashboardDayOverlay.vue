<template>
  <!-- When people are online: every recorded day as a thin line over the 24 hours in 5-minute steps, all on top
       of each other; today stands out, the average is bold. Busy times show up as a dense, high band. -->
  <div class="stats-chart dashboard-day-overlay">
    <svg :viewBox="`0 0 ${width} ${height}`" role="img">
      <g v-for="tick in ticks" :key="`tick-${tick}`">
        <line :x1="left" :x2="width - right" :y1="y(tick)" :y2="y(tick)" class="stats-chart-grid"/>
        <text :x="left - 6" :y="y(tick) + 4" text-anchor="end" class="stats-chart-label">{{ tick }}</text>
      </g>
      <line v-for="hour in hourLabels" :key="`hour-line-${hour}`" :x1="x(hour * slotsPerHour)" :x2="x(hour * slotsPerHour)" :y1="top" :y2="y(0)" class="stats-chart-grid"/>
      <polyline v-for="(profile, index) in profiles" :key="profile.start" :points="path(profile.slots)" fill="none"
        class="dashboard-day-overlay-day" :class="{'dashboard-day-overlay-day--today': index === profiles.length - 1}">
        <title>{{ dayTitle(profile.start) }}</title>
      </polyline>
      <polyline :points="path(average)" fill="none" class="dashboard-day-overlay-average"/>
      <text v-for="hour in hourLabels" :key="`hour-${hour}`" :x="x(hour * slotsPerHour)" :y="height - 4" text-anchor="middle" class="stats-chart-label">{{ hour }}:00</text>
    </svg>
    <div class="stats-legend">
      <span><i class="dashboard-day-overlay-swatch"></i><span>{{ dayCountText }}</span></span>
      <span><i class="dashboard-day-overlay-swatch dashboard-day-overlay-swatch--today"></i><span v-i18n>Today</span></span>
      <span><i class="dashboard-day-overlay-swatch dashboard-day-overlay-swatch--average"></i><span v-i18n>Average</span></span>
      <span class="stats-dim" v-i18n>Players with an open game page, in 5-minute steps</span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {DashboardDayProfile} from '@/common/admin/ServerDashboard';
import {translateTextWithParams} from '@/client/directives/i18n';

const SLOTS_PER_DAY = 288;

export default defineComponent({
  name: 'DashboardDayOverlay',
  props: {
    profiles: {type: Array as PropType<ReadonlyArray<DashboardDayProfile>>, required: true},
  },
  data() {
    return {width: 960, height: 240, left: 30, right: 12, top: 12, bottom: 22, slotsPerHour: 12, hourLabels: [0, 3, 6, 9, 12, 15, 18, 21]};
  },
  computed: {
    /** Mean per slot over the days that already had that slot (today stops at the current time). */
    average(): Array<number> {
      return Array.from({length: SLOTS_PER_DAY}, (_, slot) => {
        const values = this.profiles.flatMap((profile) => slot < profile.slots.length ? [profile.slots[slot]] : []);
        return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
      });
    },
    maximum(): number {
      return Math.max(1, ...this.profiles.flatMap((profile) => profile.slots));
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
    dayCountText(): string {
      return translateTextWithParams('One line per day (${0} days)', [String(this.profiles.length)]);
    },
  },
  methods: {
    x(slot: number): number {
      return this.left + (this.width - this.left - this.right) * slot / SLOTS_PER_DAY;
    },
    y(value: number): number {
      return this.height - this.bottom - (this.height - this.top - this.bottom) * value / this.maximum;
    },
    path(slots: ReadonlyArray<number>): string {
      // Point in the middle of each 5-minute slot
      return slots.map((value, slot) => `${this.x(slot + 0.5).toFixed(1)},${this.y(value).toFixed(1)}`).join(' ');
    },
    dayTitle(start: string): string {
      const [year, month, day] = start.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString(undefined, {weekday: 'short', day: 'numeric', month: 'numeric'});
    },
  },
});
</script>
