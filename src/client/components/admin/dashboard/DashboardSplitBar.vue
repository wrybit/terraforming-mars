<template>
  <!-- One bar split into parts, the legend below in the same order and colors: what fills it is visible at a
       glance, the exact values sit right next to their color -->
  <div class="dashboard-split">
    <div class="dashboard-meter-head">
      <span class="dashboard-meter-label" v-i18n>{{ label }}</span>
      <span class="dashboard-meter-numbers" :class="{'dashboard-tone--critical': usedShare >= 90}">{{ summary }}</span>
    </div>
    <div class="dashboard-split-bar" role="img" :aria-label="summary">
      <div v-for="segment in segments" :key="segment.kind" class="dashboard-split-segment" :class="'dashboard-split-segment--' + segment.kind"
        :style="{width: share(segment.value) + '%'}" :title="`${$t(segment.label)}: ${format(segment.value)}`"></div>
    </div>
    <dl class="dashboard-facts">
      <template v-for="segment in segments" :key="segment.kind">
        <dt><i class="dashboard-split-swatch" :class="'dashboard-split-segment--' + segment.kind"></i><span v-i18n>{{ segment.label }}</span></dt>
        <dd>{{ format(segment.value) }}</dd>
      </template>
    </dl>
    <p v-if="measuredAtMs !== undefined" class="dashboard-split-note">{{ measuredText }}</p>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {translateTextWithParams} from '@/client/directives/i18n';
import {formatBytes, formatDateTime, percent} from '@/client/components/admin/dashboard/dashboardFormat';
import {UsageSegment} from '@/client/components/admin/dashboard/usageSegments';

export default defineComponent({
  name: 'DashboardSplitBar',
  props: {
    /** English, gets translated. */
    label: {type: String, required: true},
    segments: {type: Array as PropType<ReadonlyArray<UsageSegment>>, required: true},
    /** Sum of all parts (disk or memory size, 100 for the processor) */
    total: {type: Number, required: true},
    unit: {type: String as PropType<'bytes' | 'percent'>, default: 'bytes'},
    /** When the parts were measured outside the server; shown below the legend */
    measuredAtMs: {type: Number, default: undefined},
  },
  computed: {
    used(): number {
      return this.segments.filter((segment) => segment.kind !== 'free' && segment.kind !== 'cache').reduce((sum, segment) => sum + segment.value, 0);
    },
    usedShare(): number {
      return percent(this.used, this.total);
    },
    summary(): string {
      if (this.unit === 'percent') {
        return `${this.usedShare} %`;
      }
      return translateTextWithParams('${0} of ${1} (${2} %)', [formatBytes(this.used), formatBytes(this.total), String(this.usedShare)]);
    },
    measuredText(): string {
      return translateTextWithParams('Parts measured at ${0}', [formatDateTime(this.measuredAtMs ?? 0)]);
    },
  },
  methods: {
    format(value: number): string {
      return this.unit === 'percent' ? `${value.toFixed(1)} %` : formatBytes(value);
    },
    share(value: number): number {
      return this.total <= 0 ? 0 : value * 100 / this.total;
    },
  },
});
</script>
