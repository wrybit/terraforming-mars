<template>
  <!-- Covers the whole page while the server restarts: no move can be started that would get lost -->
  <div v-if="phase !== 'none'" class="server-update-overlay" role="alertdialog" aria-modal="true">
    <div class="server-update-overlay__card" role="status">
      <template v-if="phase === 'updating'">
        <div class="server-update-overlay__title" v-i18n>The server is being updated</div>
        <LoadingBar class="server-update-overlay__progress"/>
        <div class="server-update-overlay__hint">
          <span v-i18n>Please wait a moment.</span>
          <span v-i18n>All moves are saved.</span>
        </div>
      </template>
      <template v-else>
        <svg class="server-update-overlay__check" width="56" height="56" viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="22"/>
          <path d="M14 25 l7 7 l13 -15"/>
        </svg>
        <div class="server-update-overlay__title" v-i18n>Server updated successfully</div>
        <button class="btn btn-submit btn-rounded server-update-overlay__reload" @click="reload" v-i18n>Reload</button>
        <div class="server-update-overlay__hint">
          <span v-i18n>All games are saved.</span>
          <span v-i18n>After reloading, play continues seamlessly.</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import LoadingBar from '@/client/components/common/LoadingBar.vue';
import {serverUpdatePhase} from '@/client/utils/serverStatus';

const phase = computed(() => serverUpdatePhase.value);

function reload(): void {
  window.location.reload();
}
</script>
