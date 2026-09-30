<template>
  <div class="mb-zoom-controls" @click.stop>
    <!-- Zoom-Leiste des großen Mars in der Mobil-Ansicht (wie im Mockup): kleiner, Stufe, größer, ganzer Planet -->
    <button type="button" class="mb-zoom-button" aria-label="−" @click="$emit('zoom', 1 / step)">−</button>
    <span class="mb-zoom-level">{{ percent }} %</span>
    <button type="button" class="mb-zoom-button" aria-label="+" @click="$emit('zoom', step)">+</button>
    <!-- Ganzer Planet als Symbol (Rahmen um den Planeten): keine eigenen Texte neben den vorhandenen Übersetzungen -->
    <button type="button" class="mb-zoom-button mb-zoom-button--fit" aria-label="100 %" @click="$emit('fit')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><circle cx="12" cy="12" r="4.5"/></svg>
    </button>
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
