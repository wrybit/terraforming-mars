<template>
  <!-- Floats over Mars instead of a text block above the page: the game end is the event, not a paragraph -->
  <div class="game-over-notice" role="status">
    <div class="game-over-notice__title" v-i18n>This game is over!</div>
    <a class="btn btn-submit btn-rounded game-over-notice__link" :href="resultsUrl" v-i18n>Go to game results</a>
    <div v-if="redirecting" class="game-over-notice__hint" v-i18n>You will be taken to the results in a moment</div>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from 'vue';
import {ParticipantId} from '@/common/Types';

const props = withDefaults(defineProps<{
  participantId: ParticipantId;
  // Time to read the notice before the results page opens
  redirectDelayMilliseconds?: number;
}>(), {
  redirectDelayMilliseconds: 4000,
});

const resultsUrl = computed(() => 'the-end?id=' + props.participantId);

// Redirect automatically only once per player: whoever looks back at the board later should be allowed to stay
const storageKey = computed(() => 'game-over-redirected-' + props.participantId);
const redirecting = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

function alreadyRedirected(): boolean {
  try {
    return sessionStorage.getItem(storageKey.value) !== null;
  } catch {
    // Without storage, rather redirect: the result matters more than the look back
    return false;
  }
}

function rememberRedirect(): void {
  try {
    sessionStorage.setItem(storageKey.value, '1');
  } catch {
    // Storage blocked (private mode): then just redirect on every open
  }
}

onMounted(() => {
  if (alreadyRedirected()) {
    return;
  }
  redirecting.value = true;
  timer = setTimeout(() => {
    rememberRedirect();
    window.location.assign(resultsUrl.value);
  }, props.redirectDelayMilliseconds);
});

onBeforeUnmount(() => {
  if (timer !== undefined) {
    clearTimeout(timer);
  }
});
</script>
