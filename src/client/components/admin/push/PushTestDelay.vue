<template>
  <!-- Delay of the test messages (pushTestDelay.ts): time to switch to another app before the message comes -->
  <label class="push-delay">
    <span class="push-delay-label">{{ label }}</span>
    <input v-model.number="pushTestDelaySeconds" type="range" class="push-delay-range"
      :min="PUSH_TEST_DELAY_MIN" :max="PUSH_TEST_DELAY_MAX" step="1">
    <span class="push-delay-hint" v-i18n>Time to switch to another app before the message is sent.</span>
  </label>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {translateTextWithParams} from '@/client/directives/i18n';
import {PUSH_TEST_DELAY_MAX, PUSH_TEST_DELAY_MIN, pushTestDelaySeconds} from './pushTestDelay';

const label = computed(() => translateTextWithParams('Delay of test messages: ${0} s', [String(pushTestDelaySeconds.value)]));
</script>
