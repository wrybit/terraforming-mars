<template>
  <div class="dialog-frame" :style="{width: width + 'px'}">
    <div class="dialog-frame-head">
      <span class="dialog-frame-icon"><slot name="icon"></slot></span>
      <h2 class="dialog-frame-title">{{ title }}</h2>
      <slot name="actions"></slot>
      <button type="button" class="dialog-frame-close" :aria-label="$t('Close')" @click="emit('close')">✕</button>
    </div>
    <div class="dialog-frame-body">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="dialog-frame-foot">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
// Shared frame of the titled sidebar dialogs: header (icon, title, optional actions, ✕), scrolling content,
// optional footer. Width as a prop so every dialog fills its grid.
// No comment in the template: a single root element, so the caller's class is applied.
defineProps<{
  title: string;
  width: number;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
}>();
</script>
