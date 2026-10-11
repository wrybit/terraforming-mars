<template>
  <div id="games-overview" class="games-overview-container admin-home">
    <AdminNav active="settings"/>
    <!-- Settings of the .env file, changeable here (serverSettings.ts) -->
    <ServerSettingsPanel :serverId="serverId"/>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import AdminNav from '@/client/components/admin/AdminNav.vue';
import ServerSettingsPanel from '@/client/components/admin/ServerSettingsPanel.vue';

export default defineComponent({
  name: 'AdminHome',
  components: {
    AdminNav,
    ServerSettingsPanel,
  },
  computed: {
    serverId(): string {
      return new URLSearchParams(window.location.search).get('serverId') || '';
    },
  },
});
</script>
