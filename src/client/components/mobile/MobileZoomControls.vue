<template>
  <div class="mb-zoom-controls" @click.stop>
    <!-- Zoom-Leiste des großen Mars in der Mobil-Ansicht (wie im Mockup): kleiner, Stufe, größer, ganzer Planet -->
    <button type="button" class="mb-zoom-button" :aria-label="$t('Zoom out')" @click="$emit('zoom', 1 / step)">−</button>
    <span class="mb-zoom-level">{{ percent }} %</span>
    <button type="button" class="mb-zoom-button" :aria-label="$t('Zoom in')" @click="$emit('zoom', step)">+</button>
    <button type="button" class="mb-zoom-button mb-zoom-button--fit" @click="$emit('fit')">{{ $t('Whole planet') }}</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  // Zoom relativ zum ganzen Planeten in Prozent
  percent: number;
}>();

defineEmits<{
  (event: 'zoom', factor: number): void;
  (event: 'fit'): void;
}>();

// Faktor je Tap auf − bzw. +
const step = 1.25;
</script>
