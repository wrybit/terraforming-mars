<template>
  <div id="admin-ai" class="games-overview-container admin-home">
    <AdminGate active="ai">
      <!-- The AI settings of the .env file as a page of their own: live load, settings, what each AI program can play -->
      <ServerSettingsPanel :only="AI_GROUP" />
    </AdminGate>
  </div>
</template>

<script setup lang="ts">
import AdminGate from '@/client/components/admin/AdminGate.vue';
import ServerSettingsPanel, {AI_GROUP} from '@/client/components/admin/ServerSettingsPanel.vue';
</script>
