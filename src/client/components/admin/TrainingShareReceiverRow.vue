<template>
  <!-- Export tab: the receiver is fixed for every server, so it is shown read-only; the test tells the admin whether
       firewall or proxy of this server let the uploads through -->
  <section class="server-settings-section training-share-receiver">
    <div class="server-settings-row">
      <div class="server-settings-text">
        <label for="training-share-receiver" class="server-settings-label" v-i18n>Receiver</label>
        <span class="server-settings-description" v-i18n>Address the games are sent to, the same for every server. The test checks that this server gets through to it (firewall, proxy).</span>
      </div>
      <div class="server-settings-field">
        <div class="server-settings-input">
          <!-- The host is what firewall and proxy care about; the whole address does not fit the field -->
          <input id="training-share-receiver" type="text" readonly :value="receiverHost" :title="TRAINING_SHARE_RECEIVER_URL">
          <button type="button" class="btn btn-sm btn-tone-quiet" :disabled="testing" :aria-busy="testing" @click="test" v-i18n>Test connection</button>
        </div>
        <span v-if="result !== undefined" class="training-share-test" :class="result.ok ? 'training-share-test--ok' : 'training-share-test--failed'">{{ resultText }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {paths} from '@/common/app/paths';
import {TRAINING_SHARE_RECEIVER_URL, TrainingShareResult, TrainingShareTestRequest} from '@/common/trainingShare/TrainingShareModel';
import {describeFailure, failureOf, fetchOrFail} from '@/client/utils/requestFailure';
import {translateText} from '@/client/directives/i18n';

const receiverHost = new URL(TRAINING_SHARE_RECEIVER_URL).host;
const testing = ref(false);
const result = ref<TrainingShareResult | undefined>(undefined);

// Computed, not v-i18n: the reason comes from the server and is added to the translated sentence
const resultText = computed(() => {
  if (result.value === undefined) {
    return '';
  }
  return result.value.ok ? '✓ ' + translateText('The receiver can be reached.') : translateText('Not reachable:') + ' ' + result.value.message;
});

async function test(): Promise<void> {
  testing.value = true;
  result.value = undefined;
  try {
    const body: TrainingShareTestRequest = {test: true};
    result.value = await (await fetchOrFail(paths.API_ADMIN_TRAINING_SHARE, {method: 'POST', body: JSON.stringify(body)})).json();
  } catch (error) {
    result.value = {ok: false, message: describeFailure(failureOf(error))};
  } finally {
    testing.value = false;
  }
}
</script>
