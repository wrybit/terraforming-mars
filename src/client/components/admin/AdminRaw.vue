<template>
  <div id="admin-raw" class="games-overview-container admin-home">
    <AdminGate active="raw">
      <!-- All raw data of the server, one card each, below each other -->
      <RawDataCard v-for="source in sources" :key="source.path" :label="source.label" :path="source.path" :kind="source.kind"/>
    </AdminGate>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {paths} from '@/common/app/paths';
import AdminGate from '@/client/components/admin/AdminGate.vue';
import RawDataCard, {RawDataKind} from '@/client/components/admin/RawDataCard.vue';

type RawDataSource = {label: string, path: string, kind: RawDataKind};

const RAW_DATA_SOURCES: ReadonlyArray<RawDataSource> = [
  {label: 'Statistics data', path: paths.API_STATS, kind: 'json'},
  {label: 'List of games', path: paths.API_GAMES, kind: 'json'},
  {label: 'Visitor addresses', path: paths.API_IPS, kind: 'json'},
  {label: 'Server metrics', path: paths.API_METRICS, kind: 'text'},
  {label: 'Memory snapshot (large download)', path: paths.API_HEAP_SNAPSHOT, kind: 'download'},
];

export default defineComponent({
  name: 'AdminRaw',
  components: {AdminGate, RawDataCard},
  data() {
    return {sources: RAW_DATA_SOURCES};
  },
});
</script>
