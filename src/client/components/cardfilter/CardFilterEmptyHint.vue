<template>
  <!-- Instead of an empty area when the filter leaves no card: short hint and a way back -->
  <div class="card-filter-empty">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 5h18l-7 8.5V19l-4 2v-7.5z"/>
    </svg>
    <span v-i18n>No card matches these filters.</span>
    <AppButton size="small" title="Reset filters" @click="$emit('reset')"/>
  </div>
</template>

<script setup lang="ts">
import AppButton from '@/client/components/common/AppButton.vue';

defineEmits<{
  reset: [];
}>();
</script>
