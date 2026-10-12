<template>
  <!-- Always rendered, only hidden while nobody is online: the line keeps its height, so the start menu above does not jump -->
  <p class="online-players" :class="{'online-players--hidden': !shown}" :aria-hidden="!shown">
    <span class="online-players-light" aria-hidden="true"></span>{{ shown ? label : '\u00a0' }}
  </p>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {activeParticipants} from '@/client/utils/serverStatus';
import {translateTextWithParams} from '@/client/directives/i18n';

// Start page footer, in the middle: how many are playing right now, with a green light that pulses.
// Players of running games with a game page open in the last minutes – the server counts them (activeParticipants.ts),
// every open page asks regularly (serverStatus.ts)
// Shown from the first player on; nobody online: nothing (an empty server is not worth mentioning)
const count = computed(() => activeParticipants.value);
const shown = computed(() => count.value !== undefined && count.value > 0);
// One player gets its own singular text, all other counts the plural one
const label = computed(() => count.value === 1 ? translateTextWithParams('1 player online', []) : translateTextWithParams('${0} players online', [String(count.value)]));
</script>
