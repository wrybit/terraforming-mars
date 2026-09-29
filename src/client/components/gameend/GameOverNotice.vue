<template>
  <!-- Schwebt über dem Mars statt als Textblock über der Seite: das Spielende ist das Ereignis, nicht ein Absatz -->
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
  // Zeit, die Meldung zu lesen, bevor die Ergebnisseite öffnet
  redirectDelayMilliseconds?: number;
}>(), {
  redirectDelayMilliseconds: 4000,
});

const resultsUrl = computed(() => 'the-end?id=' + props.participantId);

// Nur einmal je Spieler automatisch weiterleiten: wer später zurück auf den Plan schaut, soll bleiben dürfen
const storageKey = computed(() => 'game-over-redirected-' + props.participantId);
const redirecting = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

function alreadyRedirected(): boolean {
  try {
    return sessionStorage.getItem(storageKey.value) !== null;
  } catch {
    // Ohne Speicher lieber weiterleiten: das Ergebnis ist wichtiger als der Blick zurück
    return false;
  }
}

function rememberRedirect(): void {
  try {
    sessionStorage.setItem(storageKey.value, '1');
  } catch {
    // Speicher gesperrt (privater Modus): dann eben bei jedem Öffnen weiterleiten
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
