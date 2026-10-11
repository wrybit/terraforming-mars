<template>
  <p v-if="count !== undefined" :class="['online-players', {'online-players--none': count === 0}]">
    <span class="online-players-light" aria-hidden="true"></span>{{ label }}
  </p>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {activeParticipants} from '@/client/utils/serverStatus';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';

// Start page footer, in the middle: how many are playing right now, with a green light that pulses.
// Players of running games with a game page open in the last minutes – the server counts them (activeParticipants.ts),
// every open page asks regularly (serverStatus.ts)
const count = computed(() => activeParticipants.value);
const label = computed(() => count.value === 1 ? translateText('1 player online') : translateTextWithParams('${0} players online', [String(count.value)]));
</script>
