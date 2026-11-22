<template>
  <!-- Play/pause as a square button. While playing, a line runs once around its own edge per step: the countdown to
       the next step. The line lies inside the button, so it is exactly as big as the buttons next to it. -->
  <button type="button" class="replay-play" :class="{'replay-play--playing': playing}"
    :style="{'--replay-play-size': size + 'px', '--replay-step-ms': stepMs + 'ms'}"
    :aria-label="label" :title="label" @click="$emit('toggle')">
    <svg class="replay-play__icon" viewBox="0 0 24 24" aria-hidden="true"><path :d="playing ? PAUSE_ICON : PLAY_ICON" /></svg>
    <slot></slot>
    <svg class="replay-play__countdown" :viewBox="`0 0 ${size} ${size}`" aria-hidden="true">
      <rect class="replay-play__track" v-bind="edge" pathLength="100" />
      <!-- A new key per step starts the line anew -->
      <rect v-if="playing" :key="runKey" class="replay-play__run" v-bind="edge" pathLength="100" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import {computed} from 'vue';

const props = defineProps<{
  playing: boolean,
  label: string,
  // Edge length in px, and corner radius like the buttons next to it
  size: number,
  radius: number,
  stepMs: number,
  // Changes with every step
  runKey: number,
}>();
defineEmits<{(event: 'toggle'): void}>();

const PLAY_ICON = 'M8 5v14l11-7z';
const PAUSE_ICON = 'M6 19h4V5H6zm8-14v14h4V5z';
// Half the line width inside the edge, so the line ends flush with the button's outline
const INSET = 1.25;
const edge = computed(() => ({
  x: INSET, y: INSET, width: props.size - 2 * INSET, height: props.size - 2 * INSET, rx: Math.max(0, props.radius - INSET),
}));
</script>
