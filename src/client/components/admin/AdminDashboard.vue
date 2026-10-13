<template>
  <div id="admin-dashboard" class="games-overview-container admin-home">
    <AdminGate active="dashboard">
      <ServerDashboardPanel/>
    </AdminGate>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import AdminGate from '@/client/components/admin/AdminGate.vue';
import ServerDashboardPanel from '@/client/components/admin/dashboard/ServerDashboardPanel.vue';

export default defineComponent({
  name: 'AdminDashboard',
  components: {AdminGate, ServerDashboardPanel},
});
</script>
