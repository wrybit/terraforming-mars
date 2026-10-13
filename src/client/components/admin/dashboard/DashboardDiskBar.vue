<template>
  <!-- The disk as one bar split by purpose, the legend below in the same order and colors: what fills the disk
       is visible at a glance, the exact sizes are right next to their color -->
  <div class="dashboard-disk">
    <div class="dashboard-meter-head">
      <span class="dashboard-meter-label" v-i18n>Disk</span>
      <span class="dashboard-meter-numbers" :class="{'dashboard-tone--critical': usedShare >= 90}">{{ usedText }}</span>
    </div>
    <div class="dashboard-disk-bar" role="img" :aria-label="usedText">
      <div v-for="segment in segments" :key="segment.key" class="dashboard-disk-segment" :class="'dashboard-disk-segment--' + segment.key"
        :style="{width: share(segment.bytes) + '%'}" :title="`${$t(segment.label)}: ${formatBytes(segment.bytes)}`"></div>
    </div>
    <dl class="dashboard-facts dashboard-disk-legend">
      <template v-for="segment in segments" :key="segment.key">
        <dt><i class="dashboard-disk-swatch" :class="'dashboard-disk-segment--' + segment.key"></i><span v-i18n>{{ segment.label }}</span></dt>
        <dd>{{ formatBytes(segment.bytes) }}</dd>
      </template>
    </dl>
    <p v-if="measuredText !== undefined" class="dashboard-disk-note">{{ measuredText }}</p>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {DashboardDisk} from '@/common/admin/ServerDashboard';
import {translateTextWithParams} from '@/client/directives/i18n';
import {formatBytes, formatDateTime, percent} from '@/client/components/admin/dashboard/dashboardFormat';
import {DiskSegment, diskSegments} from '@/client/components/admin/dashboard/diskSegments';

export default defineComponent({
  name: 'DashboardDiskBar',
  props: {
    disk: {type: Object as PropType<DashboardDisk>, required: true},
  },
  computed: {
    segments(): Array<DiskSegment> {
      return diskSegments(this.disk);
    },
    usedShare(): number {
      return percent(this.disk.totalBytes - this.disk.freeBytes, this.disk.totalBytes);
    },
    usedText(): string {
      return translateTextWithParams('${0} of ${1} (${2} %)', [formatBytes(this.disk.totalBytes - this.disk.freeBytes), formatBytes(this.disk.totalBytes), String(this.usedShare)]);
    },
    /** The parts are measured outside the server every few minutes: their age next to them */
    measuredText(): string | undefined {
      const usage = this.disk.usage;
      return usage?.docker === undefined ? undefined : translateTextWithParams('Parts measured at ${0}', [formatDateTime(usage.measuredAtMs)]);
    },
  },
  methods: {
    formatBytes,
    share(bytes: number): number {
      return this.disk.totalBytes <= 0 ? 0 : bytes * 100 / this.disk.totalBytes;
    },
  },
});
</script>
