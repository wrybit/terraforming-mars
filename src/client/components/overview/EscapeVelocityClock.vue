<template>
  <!-- Escape Velocity: one time display per player instead of the plain timer – a short bar of used against
       allowed thinking time, red with the VP penalty once over (escapeVelocityClock.ts) -->
  <span :class="['escape-velocity-clock', {'escape-velocity-clock--over': state.over}]"
    :title="$t('Thinking time') + ' ' + clockText(state.usedMs) + ' / ' + clockText(state.limitMs) + ' (Escape Velocity)'">
    <span class="escape-velocity-clock__bar"><i :style="{width: Math.round(state.share * 100) + '%'}"></i></span>
    <span class="escape-velocity-clock__text">{{ clockText(state.usedMs) }}<small> / {{ clockText(state.limitMs) }}</small></span>
    <b v-if="state.penalty > 0" class="escape-velocity-clock__penalty">−{{ state.penalty }} {{ $t('VP') }}</b>
  </span>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from 'vue';
import {TimerModel} from '@/common/models/TimerModel';
import {EscapeVelocityOptions} from '@/common/game/NewGameConfig';
import {clockText, escapeVelocityState} from './escapeVelocityClock';

const props = defineProps<{
  timer: TimerModel;
  actionsTaken: number;
  options: EscapeVelocityOptions;
  live: boolean;
}>();

// Ticks once a second while the player's timer runs
const now = ref(Date.now());
let interval: number | undefined;
onMounted(() => {
  interval = window.setInterval(() => {
    if (props.live && props.timer.running) {
      now.value = Date.now();
    }
  }, 1000);
});
onBeforeUnmount(() => window.clearInterval(interval));

const state = computed(() => {
  const usedMs = props.timer.sumElapsed + (props.timer.running ? now.value - props.timer.startedAt : 0);
  return escapeVelocityState(usedMs, props.actionsTaken, props.options);
});
</script>
