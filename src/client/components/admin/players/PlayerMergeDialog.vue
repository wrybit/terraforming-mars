<template>
  <!-- Confirmation before a merge: the name that goes is struck through, the one that stays is highlighted.
       "Swap" turns the direction around if the wrong name was dragged. -->
  <dialog ref="dialog" class="admin-players-dialog" @close="emit('cancel')">
    <form method="dialog" class="admin-players-dialog-body">
      <h2 v-i18n>Merge players?</h2>
      <div class="admin-players-compare">
        <div class="admin-players-side admin-players-side--goes">
          <span class="admin-players-side-label" v-i18n>is dropped</span>
          <s class="admin-players-side-name">{{ from.name }}</s>
          <span class="admin-players-side-count">{{ from.games }} <span v-i18n>games</span></span>
        </div>
        <span class="admin-players-arrow" aria-hidden="true">→</span>
        <div class="admin-players-side admin-players-side--stays">
          <span class="admin-players-side-label" v-i18n>stays</span>
          <strong class="admin-players-side-name">{{ to.name }}</strong>
          <span class="admin-players-side-count">{{ to.games }} → {{ to.games + from.games }} <span v-i18n>games</span></span>
        </div>
      </div>
      <ul class="admin-players-dialog-facts">
        <!-- Names stay out of the translated sentence: v-i18n would translate a player called "Green" -->
        <li v-i18n>From now on the statistics count the dropped name as the one that stays – also in future games.</li>
        <li v-i18n>The games themselves stay unchanged; the merge can be undone under "Merged".</li>
        <li v-if="sharedGames > 0" class="admin-players-dialog-warning" v-i18n="[String(sharedGames)]">Both names played together in ${0} games: there the player counts twice.</li>
      </ul>
      <menu class="admin-players-dialog-actions">
        <button type="button" class="btn btn-tone-quiet" @click="emit('swap')" v-i18n>⇄ Swap</button>
        <span class="admin-players-dialog-answers">
          <button type="button" class="btn btn-tone-quiet" @click="close" v-i18n>Cancel</button>
          <button type="button" class="btn btn-primary" :disabled="busy" @click="emit('confirm')" v-i18n>Merge</button>
        </span>
      </menu>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import dialogPolyfill from 'dialog-polyfill';
import {showModal, windowHasHTMLDialogElement} from '@/client/components/HTMLDialogElementCompatibility';
import {PlayerNameStats} from './playerNameStats';

defineProps<{
  from: PlayerNameStats,
  to: PlayerNameStats,
  sharedGames: number,
  busy: boolean,
}>();

const emit = defineEmits<{
  (event: 'confirm'): void;
  (event: 'cancel'): void;
  (event: 'swap'): void;
}>();

const dialog = ref<HTMLDialogElement | null>(null);

function close(): void {
  dialog.value?.close();
}

onMounted(() => {
  if (dialog.value === null) {
    return;
  }
  if (!windowHasHTMLDialogElement()) {
    dialogPolyfill.registerDialog(dialog.value);
  }
  showModal(dialog.value);
});

defineExpose({close});
</script>
