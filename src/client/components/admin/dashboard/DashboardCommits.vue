<template>
  <!-- Commits of the deploy branch: the running one highlighted, with update (when behind) and restart -->
  <section class="games-overview-card">
    <div class="server-dashboard-commits-head">
      <h2 v-i18n>Recent commits</h2>
      <span v-if="statusText !== ''" class="server-dashboard-deploy-status" :class="{'server-dashboard-deploy-status-behind': (state.behind ?? 0) > 0}">{{ statusText }}</span>
      <!-- Buttons always right; a second step asks before players are interrupted -->
      <div class="server-dashboard-actions">
        <template v-if="confirming !== undefined">
          <span class="server-dashboard-updated">{{ playersOnlineText }}</span>
          <button type="button" class="btn btn-sm btn-tone-quiet" @click="confirming = undefined" v-i18n>Cancel</button>
          <button v-if="confirming === 'update'" type="button" class="btn btn-sm btn-primary" :disabled="busy" @click="run" v-i18n>Yes, update</button>
          <button v-else type="button" class="btn btn-sm btn-primary" :disabled="busy" @click="run" v-i18n>Yes, restart</button>
        </template>
        <template v-else>
          <button v-if="canUpdate" type="button" class="btn btn-sm btn-primary" :disabled="busy" @click="confirming = 'update'" v-i18n>Update to latest</button>
          <button type="button" class="btn btn-sm btn-tone-quiet" :disabled="busy" @click="confirming = 'restart'" v-i18n>Restart server</button>
        </template>
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
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {formatDateTime} from '@/client/components/admin/dashboard/dashboardFormat';
import {deployState, DeployState} from '@/client/components/admin/dashboard/deployState';
import {requestServerUpdate, restartServer} from '@/client/components/admin/adminActions';

// After this the restarted server answers again: then the dashboard loads anew
const RELOAD_AFTER_RESTART_MILLISECONDS = 12000;

type DataModel = {
  confirming: 'update' | 'restart' | undefined,
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
    return {confirming: undefined, busy: false, message: '', messageIsError: false};
  },
  computed: {
    state(): DeployState {
      return deployState(this.dashboard);
    },
    statusText(): string {
      if (this.dashboard.updateRequest !== undefined) {
        return translateText('Update requested – starts within a minute');
      }
      const behind = this.state.behind;
      if (behind === undefined) {
        return '';
      }
      if (behind === 0) {
        return translateText('Up to date');
      }
      // Running build older than the whole list: at least that many
      const count = this.state.rows.some((row) => row.live) ? String(behind) : `${behind}+`;
      return translateTextWithParams('${0} commits behind', [count]);
    },
    canUpdate(): boolean {
      return (this.state.behind ?? 0) > 0 && this.dashboard.updateRequest === undefined;
    },
    playersOnlineText(): string {
      return `${translateText('Players online now')}: ${this.dashboard.games.playersOnline}`;
    },
  },
  methods: {
    formatDateTime,
    async run(): Promise<void> {
      const action = this.confirming;
      this.busy = true;
      try {
        if (action === 'update') {
          await requestServerUpdate();
          this.message = '';
          this.$emit('changed');
        } else {
          await restartServer();
          this.showMessage(translateText('The server restarts and is back in a few seconds.'), false);
          window.setTimeout(() => this.$emit('changed'), RELOAD_AFTER_RESTART_MILLISECONDS);
        }
      } catch (error) {
        const prefix = action === 'update' ? translateText('Could not request the update:') : translateText('Could not restart:');
        this.showMessage(prefix + ' ' + (error instanceof Error ? error.message : ''), true);
      } finally {
        this.busy = false;
        this.confirming = undefined;
      }
    },
    showMessage(text: string, isError: boolean): void {
      this.message = text;
      this.messageIsError = isError;
    },
  },
});
</script>
