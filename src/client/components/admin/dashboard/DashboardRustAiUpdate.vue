<template>
  <!-- Newer Rust AI on GitHub (the server looks every 6 hours): only there while one waits, installed only by the button.
       Same look as the server's own update notice above it. -->
  <div v-if="visible" class="server-dashboard-update">
    <div class="server-dashboard-actions">
      <div class="server-dashboard-update-status">
        <span class="server-dashboard-deploy-status" :class="{'server-dashboard-deploy-status-behind': status?.state === 'available'}">{{ stateText }}</span>
        <LoadingBar v-if="busy" class="server-dashboard-update-progress" />
      </div>
      <button v-if="status?.state === 'available'" type="button" class="btn btn-sm btn-primary" :disabled="busy" @click="install" v-i18n>Install now</button>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {RustAiUpdateStatus} from '@/common/ai/rustAiUpdate';
import {checkRustAiUpdate, loadRustAiUpdate} from '@/client/components/admin/rustAiUpdateRequests';
import {translateTextWithParams} from '@/client/directives/i18n';
import LoadingBar from '@/client/components/common/LoadingBar.vue';

type DataModel = {status: RustAiUpdateStatus | undefined, busy: boolean, acted: boolean};

export default defineComponent({
  name: 'DashboardRustAiUpdate',
  components: {LoadingBar},
  data(): DataModel {
    return {status: undefined, busy: false, acted: false};
  },
  async mounted() {
    this.status = await loadRustAiUpdate();
  },
  computed: {
    // A waiting version, and after the button the result of installing it
    visible(): boolean {
      return this.status?.state === 'available' || (this.acted && this.status !== undefined);
    },
    stateText(): string {
      const status = this.status;
      const version = status?.available ?? '';
      switch (status?.state) {
      case 'available': return translateTextWithParams('Rust AI ${0} is available', [version]);
      case 'installing': return translateTextWithParams('Installing version ${0}…', [version]);
      case 'updated': return translateTextWithParams('Updated to version ${0}', [version]);
      case 'failed': return translateTextWithParams('Update failed: ${0}', [status.error ?? '']);
      default: return '';
      }
    },
  },
  methods: {
    async install(): Promise<void> {
      this.busy = true;
      this.acted = true;
      if (this.status !== undefined) {
        this.status = {...this.status, state: 'installing'};
      }
      this.status = await checkRustAiUpdate(true) ?? await loadRustAiUpdate();
      this.busy = false;
    },
  },
});
</script>
