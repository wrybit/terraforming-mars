<template>
  <p v-if="count !== undefined && count >= MIN_SHOWN" class="online-players">
    <span class="online-players-light" aria-hidden="true"></span>{{ label }}
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
const label = computed(() => translateTextWithParams('${0} players online', [String(count.value)]));
</script>
