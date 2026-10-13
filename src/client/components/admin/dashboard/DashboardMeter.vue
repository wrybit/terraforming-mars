<template>
  <!-- Fill level with label and numbers; amber from 75 %, red from 90 % so a full disk or memory stands out -->
  <div class="dashboard-meter">
    <div class="dashboard-meter-head">
      <span class="dashboard-meter-label" v-i18n>{{ label }}</span>
      <span class="dashboard-meter-numbers">{{ text }}</span>
    </div>
    <div class="dashboard-meter-track" role="meter" :aria-valuenow="share" aria-valuemin="0" aria-valuemax="100" :aria-label="$t(label)">
      <div class="dashboard-meter-fill" :class="'dashboard-meter-fill--' + tone" :style="{width: share + '%'}"></div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {formatBytes, percent} from '@/client/components/admin/dashboard/dashboardFormat';
import {translateTextWithParams} from '@/client/directives/i18n';

export default defineComponent({
  name: 'DashboardMeter',
  props: {
    /** English, gets translated. */
    label: {type: String, required: true},
    used: {type: Number, required: true},
    total: {type: Number, required: true},
    /** 'bytes': "12.3 GB of 96.0 GB"; 'percent': the share only (e.g. processor load) */
    unit: {type: String as () => 'bytes' | 'percent', default: 'bytes'},
  },
  computed: {
    share(): number {
      return Math.min(100, percent(this.used, this.total));
    },
    tone(): 'normal' | 'warning' | 'critical' {
      return this.share >= 90 ? 'critical' : this.share >= 75 ? 'warning' : 'normal';
    },
    text(): string {
      if (this.unit === 'percent') {
        return `${this.share} %`;
      }
      return translateTextWithParams('${0} of ${1} (${2} %)', [formatBytes(this.used), formatBytes(this.total), String(this.share)]);
    },
  },
});
</script>
