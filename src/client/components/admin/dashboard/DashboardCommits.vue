<template>
  <!-- Commits of the deploy branch: the running one highlighted, with restart (the update button sits on the games card) -->
  <section class="games-overview-card">
    <div class="server-dashboard-commits-head">
      <h2 v-i18n>Recent commits</h2>
      <span v-if="statusText !== ''" class="server-dashboard-deploy-status" :class="{'server-dashboard-deploy-status-behind': (state.behind ?? 0) > 0}">{{ statusText }}</span>
      <!-- Buttons always right; a second step asks before players are interrupted -->
      <div class="server-dashboard-actions">
        <template v-if="confirming">
          <span class="server-dashboard-updated">{{ playersOnlineText }}</span>
          <button type="button" class="btn btn-sm btn-tone-quiet" @click="confirming = false" v-i18n>Cancel</button>
          <button type="button" class="btn btn-sm btn-primary" :disabled="busy" @click="run" v-i18n>Yes, restart</button>
        </template>
        <button v-else type="button" class="btn btn-sm btn-tone-quiet" :disabled="busy" @click="confirming = true" v-i18n>Restart server</button>
      </div>
    </div>
    <p v-if="message !== ''" class="server-dashboard-message" :class="{'server-dashboard-message--error': messageIsError}">{{ message }}</p>
    <p v-if="state.rows.length === 0" class="games-overview-note" v-i18n>No commit history in this build</p>
    <table v-else class="server-dashboard-commits">
      <tr v-for="row in state.rows" :key="row.commit.hash" :class="{'server-dashboard-commit-live': row.live}">
        <td class="server-dashboard-commit-time">{{ formatDateTime(row.commit.time) }}</td>
        <td class="server-dashboard-commit-hash"><code>{{ row.commit.hash }}</code></td>
        <td>{{ row.commit.title }}</td>
      </tr>
    </table>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {ServerDashboard} from '@/common/admin/ServerDashboard';
import {translateText} from '@/client/directives/i18n';
import {formatDateTime} from '@/client/components/admin/dashboard/dashboardFormat';
import {deployState, DeployState, deployStatusText} from '@/client/components/admin/dashboard/deployState';
import {restartServer} from '@/client/components/admin/adminActions';

// After this the restarted server answers again: then the dashboard loads anew
const RELOAD_AFTER_RESTART_MILLISECONDS = 12000;

type DataModel = {
  confirming: boolean,
  busy: boolean,
  message: string,
  messageIsError: boolean,
};

export default defineComponent({
  name: 'DashboardCommits',
  props: {
    dashboard: {type: Object as PropType<ServerDashboard>, required: true},
  },
  emits: ['changed'],
  data(): DataModel {
    return {confirming: false, busy: false, message: '', messageIsError: false};
  },
  computed: {
    state(): DeployState {
      return deployState(this.dashboard);
    },
    statusText(): string {
      return deployStatusText(this.dashboard);
    },
    playersOnlineText(): string {
      return `${translateText('Players online now')}: ${this.dashboard.games.playersOnline}`;
    },
  },
  methods: {
    formatDateTime,
    async run(): Promise<void> {
      this.busy = true;
      try {
        await restartServer();
        this.showMessage(translateText('The server restarts and is back in a few seconds.'), false);
        window.setTimeout(() => this.$emit('changed'), RELOAD_AFTER_RESTART_MILLISECONDS);
      } catch (error) {
        this.showMessage(translateText('Could not restart:') + ' ' + (error instanceof Error ? error.message : ''), true);
      } finally {
        this.busy = false;
        this.confirming = false;
      }
    },
    showMessage(text: string, isError: boolean): void {
      this.message = text;
      this.messageIsError = isError;
    },
  },
});
</script>
