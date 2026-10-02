<template>
  <div class="mb-zoom-controls" @click.stop>
    <!-- Zoom bar of the large Mars in the mobile view (like in the mockup): smaller, level, larger, whole planet -->
    <button type="button" class="mb-zoom-button" aria-label="−" @click="$emit('zoom', 1 / step)">−</button>
    <span class="mb-zoom-level">{{ percent }} %</span>
    <button type="button" class="mb-zoom-button" aria-label="+" @click="$emit('zoom', step)">+</button>
    <!-- Whole planet as an icon (frame around the planet): no own texts besides the existing translations -->
    <button type="button" class="mb-zoom-button mb-zoom-button--fit" aria-label="100 %" @click="$emit('fit')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><circle cx="12" cy="12" r="4.5"/></svg>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  // Zoom relative to the whole planet in percent
  percent: number;
}>();

defineEmits<{
  (event: 'zoom', factor: number): void;
  (event: 'fit'): void;
}>();

// Factor per tap on − or +
const step = 1.25;
</script>
