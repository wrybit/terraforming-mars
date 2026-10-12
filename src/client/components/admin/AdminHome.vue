<template>
  <div id="games-overview" class="games-overview-container admin-home">
    <AdminGate active="settings">
      <!-- Settings of the .env file, changeable here (serverSettings.ts) -->
      <ServerSettingsPanel/>
    </AdminGate>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import AdminGate from '@/client/components/admin/AdminGate.vue';
import ServerSettingsPanel from '@/client/components/admin/ServerSettingsPanel.vue';

export default defineComponent({
  name: 'AdminHome',
  components: {
    AdminGate,
    ServerSettingsPanel,
  },
});
</script>
