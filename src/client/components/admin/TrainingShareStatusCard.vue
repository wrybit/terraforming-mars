<template>
  <!-- Export tab: what was shared so far, as plain information under the settings; problems in red -->
  <section v-if="status !== undefined && status.mode !== ''" class="training-share-status">
    <h3 class="ai-support-overview-title" v-i18n>Shared so far</h3>
    <dl class="training-share-facts">
      <dt v-i18n>Games shared</dt>
      <dd>{{ status.sharedGameIds.length }}</dd>
      <template v-if="lastSharedText !== ''">
        <dt v-i18n>Last shared</dt>
        <dd>{{ lastSharedText }}</dd>
      </template>
      <template v-if="status.pendingGameIds.length > 0">
        <dt v-i18n>Waiting for upload</dt>
        <dd>{{ status.pendingGameIds.length }}</dd>
      </template>
      <template v-if="status.serverKeyStart !== undefined">
        <dt v-i18n>Key of this server</dt>
        <dd><code>{{ status.serverKeyStart }}…</code></dd>
      </template>
    </dl>
    <p v-if="status.lastError !== undefined" class="training-share-problem">{{ problemText }}</p>
  </section>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import {paths} from '@/common/app/paths';
import {TrainingShareStatus} from '@/common/trainingShare/TrainingShareModel';
import {fetchOrFail} from '@/client/utils/requestFailure';
import {formatDateTime} from '@/client/components/admin/dashboard/dashboardFormat';
import {translateTextWithParams} from '@/client/directives/i18n';

const status = ref<TrainingShareStatus | undefined>(undefined);

const lastSharedText = computed(() => status.value?.lastSharedAtMs === undefined ? '' : formatDateTime(status.value.lastSharedAtMs));

// Computed, not v-i18n: the message comes from the server, game and time are filled in
const problemText = computed(() => {
  const problem = status.value?.lastError;
  return problem === undefined ? '' : translateTextWithParams('Last problem (${0}, ${1}):', [problem.gameId, formatDateTime(problem.atMs)]) + ' ' + problem.message;
});

onMounted(async () => {
  try {
    status.value = await (await fetchOrFail(paths.API_ADMIN_TRAINING_SHARE)).json();
  } catch {
    // The card stays hidden; the settings above still work
    status.value = undefined;
  }
});
</script>
