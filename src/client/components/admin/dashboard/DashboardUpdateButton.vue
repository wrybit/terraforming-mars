<template>
  <!-- Update to the newest commit even while people play; only there while the server is behind -->
  <div v-if="visible" class="server-dashboard-update">
    <p v-if="message !== ''" class="server-dashboard-message server-dashboard-message--error">{{ message }}</p>
    <!-- Buttons always right; a second step names the players that get interrupted -->
    <div class="server-dashboard-actions">
      <!-- Left: how far behind and how old the running commit is; buttons stay right -->
      <div class="server-dashboard-update-status">
        <span class="server-dashboard-deploy-status" :class="{'server-dashboard-deploy-status-behind': !inProgress}">{{ statusText }}</span>
        <!-- While the script works: the same running bar as the update notice of the players -->
        <LoadingBar v-if="inProgress" class="server-dashboard-update-progress"/>
        <!-- Why the server is still behind: refused, build failed or waiting for the players -->
        <span v-if="problem !== undefined" class="server-dashboard-deploy-problem" :class="{'server-dashboard-deploy-problem--blocking': problem.blocking}">{{ problem.text }}</span>
        <span v-if="problem?.command !== undefined" class="server-dashboard-updated"><span v-i18n>Approve on the Mac:</span> <code>{{ problem.command }}</code></span>
        <span v-if="liveTimeText !== ''" class="server-dashboard-updated">{{ liveTimeText }}</span>
      </div>
      <template v-if="!inProgress">
        <template v-if="confirming">
          <span class="server-dashboard-updated">{{ playersOnlineText }}</span>
          <button type="button" class="btn btn-sm btn-tone-quiet" @click="confirming = false" v-i18n>Cancel</button>
          <button type="button" class="btn btn-sm btn-primary" :disabled="busy" @click="run" v-i18n>Yes, update</button>
        </template>
        <button v-else type="button" class="btn btn-sm btn-primary" :disabled="busy" @click="confirming = true" v-i18n>Update to latest</button>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {ServerDashboard} from '@/common/admin/ServerDashboard';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {canRequestUpdate, deployProblem, DeployProblem, deployStatusText, liveCommitTime, updateInProgress} from '@/client/components/admin/dashboard/deployState';
import LoadingBar from '@/client/components/common/LoadingBar.vue';
import {formatDateTime} from '@/client/components/admin/dashboard/dashboardFormat';
import {requestServerUpdate} from '@/client/components/admin/adminActions';

type DataModel = {
  confirming: boolean,
  busy: boolean,
  message: string,
};

export default defineComponent({
  name: 'DashboardUpdateButton',
  components: {LoadingBar},
  props: {
    dashboard: {type: Object as PropType<ServerDashboard>, required: true},
  },
  emits: ['changed'],
  data(): DataModel {
    return {confirming: false, busy: false, message: ''};
  },
  computed: {
    visible(): boolean {
      // A running update stays visible as status until the script restarts the server
      return canRequestUpdate(this.dashboard) || this.inProgress || this.message !== '';
    },
    inProgress(): boolean {
      return updateInProgress(this.dashboard);
    },
    problem(): DeployProblem | undefined {
      return deployProblem(this.dashboard);
    },
    statusText(): string {
      return deployStatusText(this.dashboard);
    },
    liveTimeText(): string {
      const time = liveCommitTime(this.dashboard);
      return time === undefined ? '' : translateTextWithParams('Running commit from ${0}', [formatDateTime(time)]);
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
