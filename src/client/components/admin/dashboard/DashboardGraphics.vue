<template>
  <!-- Every graphics adapter: name, load and memory as meters, the rest as facts -->
  <div class="server-dashboard-gpus">
    <p v-if="gpus.length === 0" class="games-overview-note" v-i18n>No graphics adapter found</p>
    <div v-for="(gpu, index) in gpus" :key="index" class="server-dashboard-gpu">
      <h3 class="server-dashboard-subheading">{{ gpu.name }}</h3>
      <DashboardMeter v-if="gpu.busyPercent !== undefined" label="Graphics load" :used="gpu.busyPercent" :total="100" unit="percent"/>
      <DashboardMeter v-if="gpu.videoMemory !== undefined" label="Video memory" :used="gpu.videoMemory.usedBytes" :total="gpu.videoMemory.totalBytes"/>
      <DashboardFacts :facts="facts(gpu)"/>
      <p v-if="gpu.kind === 'virtual'" class="games-overview-note" v-i18n>Display adapter of the virtual machine: it does not compute graphics.</p>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {DashboardGpu} from '@/common/admin/ServerDashboard';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import DashboardFacts from '@/client/components/admin/dashboard/DashboardFacts.vue';
import DashboardMeter from '@/client/components/admin/dashboard/DashboardMeter.vue';
import {DashboardFact} from '@/client/components/admin/dashboard/dashboardTypes';
import {formatBytes} from '@/client/components/admin/dashboard/dashboardFormat';

const KIND_LABELS: Record<DashboardGpu['kind'], string> = {
  integrated: 'Integrated in the processor',
  dedicated: 'Own graphics card',
  virtual: 'Virtual',
};

export default defineComponent({
  name: 'DashboardGraphics',
  components: {DashboardFacts, DashboardMeter},
  props: {
    gpus: {type: Array as PropType<ReadonlyArray<DashboardGpu>>, required: true},
    /** Main memory of the machine: an integrated chip takes its graphics memory from there */
    mainMemoryBytes: {type: Number, required: true},
  },
  methods: {
    facts(gpu: DashboardGpu): Array<DashboardFact> {
      const facts: Array<DashboardFact> = [{label: 'Type', value: translateText(KIND_LABELS[gpu.kind])}];
      if (gpu.kind === 'integrated') {
        facts.push({label: 'Graphics memory', value: translateTextWithParams('${0} (shared with RAM)', [formatBytes(this.mainMemoryBytes)])});
      }
      if (gpu.clockMhz !== undefined) {
        facts.push({label: 'Clock (now / max)', value: `${gpu.clockMhz.current} / ${gpu.clockMhz.max} MHz`});
      }
      if (gpu.driver !== undefined) {
        facts.push({label: 'Driver', value: gpu.driver});
      }
      return facts;
    },
  },
});
</script>
