<template>
  <!-- Words the lobby chat masks (server/lobby/chatWords.ts): one per line; a save applies at once, no restart -->
  <section class="games-overview-card chat-words-card">
    <h2 v-i18n>Chat: blocked words</h2>
    <p class="games-overview-note" v-i18n>One word per line. A word is also masked at the start of longer words ("arsch" also in "Arschloch", not in "Barsch"). Links to other websites are always blocked.</p>
    <p v-if="status === 'loading'" class="games-overview-note" v-i18n>Loading…</p>
    <template v-else>
      <textarea v-model="text" class="create-game-text-input chat-words-input" rows="12" spellcheck="false" :aria-label="$t('Chat: blocked words')"></textarea>
      <div class="server-settings-actions chat-words-actions">
        <p class="server-settings-message" :class="{'server-settings-message--error': messageIsError}">{{ message }}</p>
        <button type="button" class="btn btn-tone-quiet" :disabled="busy" @click="text = defaults.join('\n')" v-i18n>Reset to default</button>
        <button type="button" class="btn btn-primary" :disabled="busy || !dirty" @click="save" v-i18n>Save</button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import {paths} from '@/common/app/paths';
import {ChatWordsModel} from '@/common/lobby/LobbyChatModel';
import {describeFailure, failureOf, fetchOrFail} from '@/client/utils/requestFailure';
import {translateText} from '@/client/directives/i18n';

const status = ref<'loading' | 'done'>('loading');
const text = ref('');
const saved = ref('');
const defaults = ref<Array<string>>([]);
const busy = ref(false);
const message = ref('');
const messageIsError = ref(false);
const dirty = computed(() => text.value.trim() !== saved.value);

function apply(model: ChatWordsModel): void {
  text.value = model.words.join('\n');
  saved.value = text.value;
  defaults.value = model.defaults;
}

async function load(): Promise<void> {
  try {
    apply(await (await fetchOrFail(paths.API_ADMIN_CHAT_WORDS)).json());
  } catch (error) {
    message.value = describeFailure(failureOf(error));
    messageIsError.value = true;
  }
  status.value = 'done';
}

async function save(): Promise<void> {
  busy.value = true;
  try {
    const response = await fetchOrFail(paths.API_ADMIN_CHAT_WORDS, {method: 'POST', body: JSON.stringify({words: text.value.split('\n')})});
    apply(await response.json());
    message.value = translateText('Saved. The chat uses the list right away.');
    messageIsError.value = false;
  } catch (error) {
    message.value = translateText('Could not save:') + ' ' + describeFailure(failureOf(error));
    messageIsError.value = true;
  } finally {
    busy.value = false;
  }
}

onMounted(load);
</script>
