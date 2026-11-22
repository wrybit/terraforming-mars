<template>
  <div :class="['mb-task-head', tone !== undefined ? 'mb-task-head--' + tone : '']">
    <!-- Header of a mobile screen with cards (task view, all cards): back button, title and count on the left;
         on the right the card list's filter and sorting (CardFilterBar moves itself into .mb-task-tools) -->
    <button v-if="back" type="button" class="mb-icon-button" :aria-label="$t('Back')" @click="$emit('back')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
    </button>
    <span class="mb-task-title">{{ title }}</span>
    <span v-if="sub !== undefined && sub !== ''" class="mb-task-sub">{{ sub }}</span>
    <div class="mb-task-tools"></div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string;
  sub?: string | number;
  // Colour of the task (e.g. success, heat); undefined: neutral
  tone?: string;
  // Without back button on screens reached through the footer bar
  back?: boolean;
}>(), {sub: undefined, tone: undefined, back: true});

defineEmits<{(event: 'back'): void}>();
</script>
