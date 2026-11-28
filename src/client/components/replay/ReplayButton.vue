<template>
  <!-- Opens the replay of the game: loads start, end and log (api/replay) and reconstructs every step right now,
       nothing is stored for it. Meanwhile a spinner turns in the button. -->
  <div class="replay-button">
    <button type="button" class="btn btn-rounded replay-button__button" :disabled="loading" :aria-busy="loading" @click="open">
      <span v-if="loading" class="replay-button__spinner" aria-hidden="true"></span>
      <svg v-else class="replay-button__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a8 8 0 1 1-7.4 5H2.5l3.1-3.6L8.8 9H6.7A6 6 0 1 0 12 6zm-1.5 4.5 5 3.5-5 3.5z" /></svg>
      <span v-i18n>Replay</span>
    </button>
    <p v-if="error !== undefined" class="replay-button__error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {paths} from '@/common/app/paths';
import {ParticipantId} from '@/common/Types';
import {ReplaySourceModel} from '@/common/models/ReplaySourceModel';
import {statusCode} from '@/common/http/statusCode';
import {translateTextWithParams} from '@/client/directives/i18n';
import {reconstructReplay} from './reconstructReplay';
import {replaySteps} from './replaySteps';
import {ReplayData} from './replayData';

const props = defineProps<{participantId: ParticipantId, gameId: string}>();
const emit = defineEmits<{(event: 'open', replay: ReplayData): void}>();
// Opened via the replay address (replay?id=…): load right away, as if the button was pressed
defineExpose({open});

const loading = ref(false);
const error = ref<string | undefined>(undefined);

// Says which game and why, so the reader knows what to do
function errorText(status: number): string {
  if (status === statusCode.notFound) {
    return translateTextWithParams('Replay of game ${0} not possible: the game is not saved on this server.', [props.gameId]);
  }
  if (status === statusCode.badRequest) {
    return translateTextWithParams('Replay of game ${0} not possible: the game is not finished yet.', [props.gameId]);
  }
  return translateTextWithParams('Replay of game ${0} could not be loaded (server error ${1}). Please try again later.', [props.gameId, String(status)]);
}

async function open(): Promise<void> {
  loading.value = true;
  error.value = undefined;
  try {
    const response = await fetch(`${paths.API_REPLAY}?id=${props.participantId}`);
    if (!response.ok) {
      error.value = errorText(response.status);
      return;
    }
    const source: ReplaySourceModel = await response.json();
    // Let the spinner turn before the reconstruction takes the main thread for a moment
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    const states = reconstructReplay(source);
    emit('open', {source, states, steps: replaySteps(source, states)});
  } catch {
    error.value = translateTextWithParams('Replay of game ${0} could not be loaded: no connection to the server. Please check the connection and try again.', [props.gameId]);
  } finally {
    loading.value = false;
  }
}
</script>
