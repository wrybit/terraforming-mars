<template>
  <div id="games-overview" class="games-overview-container admin-home">
    <AdminGate active="settings">
      <!-- Settings of the .env file, changeable here (serverSettings.ts) -->
      <ServerSettingsPanel />
      <!-- Words the lobby chat masks; saved at once -->
      <ChatWordsPanel />
    </AdminGate>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import AdminGate from '@/client/components/admin/AdminGate.vue';
import ServerSettingsPanel from '@/client/components/admin/ServerSettingsPanel.vue';
import ChatWordsPanel from '@/client/components/admin/ChatWordsPanel.vue';

export default defineComponent({
  name: 'AdminHome',
  components: {
    AdminGate,
    ServerSettingsPanel,
    ChatWordsPanel,
  },
});
</script>
