<template>
  <!-- Large name with logo at the top of the server card: which server this is, at a glance -->
  <div class="server-dashboard-logo">
    <img v-if="identity.imageUrl !== undefined && !broken" class="server-dashboard-logo-image" :src="identity.imageUrl" alt="" @error="broken = true">
    <span class="server-dashboard-logo-name">{{ identity.name }}</span>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {ServerDashboard} from '@/common/admin/ServerDashboard';

export default defineComponent({
  name: 'DashboardServerLogo',
  props: {
    identity: {type: Object as PropType<ServerDashboard['identity']>, required: true},
  },
  data() {
    // A missing image leaves only the name instead of a broken image icon
    return {broken: false};
  },
});
</script>
