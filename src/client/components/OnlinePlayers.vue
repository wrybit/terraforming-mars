<template>
  <!-- Always rendered, only hidden below the threshold: the line keeps its height, so the start menu above does not jump -->
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
// Only shown from this many on: a nearly empty server is not worth mentioning
const MIN_SHOWN = 3;
const count = computed(() => activeParticipants.value);
const shown = computed(() => count.value !== undefined && count.value >= MIN_SHOWN);
const label = computed(() => translateTextWithParams('${0} players online', [String(count.value)]));
</script>
