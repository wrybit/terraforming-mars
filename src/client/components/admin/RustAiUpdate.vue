<template>
  <!-- Self-update of the Rust AI (api/admin/rust-ai-update): state of the last check and buttons to check or install now -->
  <div v-if="status !== undefined && status.state !== 'not-installed'" class="rust-ai-update">
    <span class="rust-ai-update-state">
      <span class="rust-ai-update-text" :class="{'rust-ai-update-text--problem': problem}">{{ stateText }}</span>
      <span v-if="checkedText !== ''" class="rust-ai-update-checked">{{ checkedText }}</span>
    </span>
    <span class="rust-ai-update-buttons">
      <button type="button" class="btn btn-sm btn-tone-quiet" :disabled="busy" @click="check(false)" v-i18n>Check now</button>
      <button v-if="status.state === 'available'" type="button" class="btn btn-sm btn-primary" :disabled="busy" @click="check(true)" v-i18n>Install now</button>
    </span>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {paths} from '@/common/app/paths';
import {RustAiUpdateStatus} from '@/common/ai/rustAiUpdate';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';

type DataModel = {status: RustAiUpdateStatus | undefined, busy: boolean};

export default defineComponent({
  name: 'RustAiUpdate',
  data(): DataModel {
    return {status: undefined, busy: false};
  },
  mounted() {
    void this.load();
  },
  computed: {
    problem(): boolean {
      const state = this.status?.state;
      return state === 'failed' || state === 'read-only';
    },
    // Computed, not v-i18n: the directive translates once, the state changes after a check
    stateText(): string {
      const status = this.status;
      const version = status?.available ?? '';
      switch (status?.state) {
      case 'checking': return translateText('Checking for a new version…');
      case 'installing': return translateTextWithParams('Installing version ${0}…', [version]);
      case 'up-to-date': return translateText('Up to date');
      case 'available': return translateTextWithParams('Version ${0} is available', [version]);
      case 'updated': return translateTextWithParams('Updated to version ${0}', [version]);
      case 'failed': return translateTextWithParams('Update failed: ${0}', [status.error ?? '']);
      case 'read-only': return translateText('The bot folder is read-only, so the AI cannot update itself. Docker: mount it without ":ro".');
      case 'no-package': return translateTextWithParams('No package of version ${0} for this system yet', [version]);
      default: return '';
      }
    },
    checkedText(): string {
      const checkedAt = this.status?.checkedAt;
      return checkedAt === undefined ? '' : translateTextWithParams('Last check: ${0}', [new Date(checkedAt).toLocaleString()]);
    },
  },
  methods: {
    async load(): Promise<void> {
      try {
        const response = await fetch(paths.API_ADMIN_RUST_AI_UPDATE);
        if (response.ok) {
          this.status = await response.json() as RustAiUpdateStatus;
        }
      } catch {
        // No answer: the line stays hidden
      }
    },
    async check(install: boolean): Promise<void> {
      this.busy = true;
      if (this.status !== undefined) {
        this.status = {...this.status, state: install ? 'installing' : 'checking'};
      }
      try {
        const response = await fetch(paths.API_ADMIN_RUST_AI_UPDATE, {method: 'POST', body: JSON.stringify({install})});
        if (response.ok) {
          this.status = await response.json() as RustAiUpdateStatus;
        }
      } catch {
        await this.load();
      } finally {
        this.busy = false;
      }
    },
  },
});
</script>
