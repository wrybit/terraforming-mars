<template>
  <!-- Five speed levels as rising bars close together: a higher bar is faster; the chosen one and those below it are
       lit. Each bar says its seconds per step (title, screen readers). -->
  <div class="replay-speed-bars" :class="{'replay-speed-bars--small': small}" role="group" :aria-label="$t('Speed')">
    <button v-for="(ms, index) in REPLAY_STEP_MS" :key="ms" type="button" class="replay-speed-bars__bar"
      :class="{'replay-speed-bars__bar--lit': index <= modelValue}" :aria-pressed="index === modelValue"
      :aria-label="secondsPerStep(ms)" :title="secondsPerStep(ms)" @click="$emit('update:modelValue', index)">
      <i :style="{height: barHeight(index) + 'px'}"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import {translateTextWithParams} from '@/client/directives/i18n';
import {REPLAY_STEP_MS, replaySeconds} from './replaySpeed';

const props = defineProps<{
  // Index in REPLAY_STEP_MS
  modelValue: number,
  // Thin bar: lower bars
  small?: boolean,
}>();
defineEmits<{(event: 'update:modelValue', speed: number): void}>();

const barHeight = (index: number) => props.small === true ? 6 + index * 3 : 10 + index * 6;
const secondsPerStep = (ms: number) => translateTextWithParams('${0} s per step', [replaySeconds(ms)]);
</script>
