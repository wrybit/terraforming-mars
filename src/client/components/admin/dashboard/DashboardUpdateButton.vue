<template>
  <!-- Update to the newest commit even while people play; only there while the server is behind -->
  <div v-if="visible" class="server-dashboard-update">
    <p v-if="message !== ''" class="server-dashboard-message server-dashboard-message--error">{{ message }}</p>
    <!-- Buttons always right; a second step names the players that get interrupted -->
    <div class="server-dashboard-actions">
      <span v-if="dashboard.updateRequest !== undefined" class="server-dashboard-deploy-status" v-i18n>Update requested – starting now</span>
      <template v-else-if="confirming">
        <span class="server-dashboard-updated">{{ playersOnlineText }}</span>
        <button type="button" class="btn btn-sm btn-tone-quiet" @click="confirming = false" v-i18n>Cancel</button>
        <button type="button" class="btn btn-sm btn-primary" :disabled="busy" @click="run" v-i18n>Yes, update</button>
      </template>
      <button v-else type="button" class="btn btn-sm btn-primary" :disabled="busy" @click="confirming = true" v-i18n>Update to latest</button>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {ServerDashboard} from '@/common/admin/ServerDashboard';
import {translateText} from '@/client/directives/i18n';
import {canRequestUpdate} from '@/client/components/admin/dashboard/deployState';
import {requestServerUpdate} from '@/client/components/admin/adminActions';

type DataModel = {
  confirming: boolean,
  busy: boolean,
  message: string,
};

export default defineComponent({
  name: 'DashboardUpdateButton',
  props: {
    dashboard: {type: Object as PropType<ServerDashboard>, required: true},
  },
  emits: ['changed'],
  data(): DataModel {
    return {confirming: false, busy: false, message: ''};
  },
  computed: {
    visible(): boolean {
      // A waiting request stays visible as status until the script restarts the server
      return canRequestUpdate(this.dashboard) || this.dashboard.updateRequest !== undefined || this.message !== '';
    },
    playersOnlineText(): string {
      return `${translateText('Players online now')}: ${this.dashboard.games.playersOnline}`;
    },
  },
  methods: {
    async run(): Promise<void> {
      this.busy = true;
      try {
        await requestServerUpdate();
        this.message = '';
        this.$emit('changed');
      } catch (error) {
        this.message = translateText('Could not request the update:') + ' ' + (error instanceof Error ? error.message : '');
      } finally {
        this.busy = false;
        this.confirming = false;
      }
    },
  },
});
</script>
