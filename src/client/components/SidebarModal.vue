<template>
  <!-- Shared modal shell for the sidebar dialogs (language, info, help, settings):
       centred box with border, shadow and background over a dimmed page.
       Teleported to body so the sidebar and column overflow don't clip the box. -->
  <Teleport to="body">
    <div v-if="open" class="sidebar-modal-backdrop" @click.self="$emit('close')">
      <div class="sidebar-modal" role="dialog" aria-modal="true" :class="{'sidebar-modal--wide': wide, 'sidebar-modal--bare': bare, 'sidebar-modal--framed': framed}">
        <button v-if="!bare && !framed" type="button" class="sidebar-modal-close" :aria-label="$t('Close')" @click="$emit('close')">✕</button>
        <slot></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, watch} from 'vue';
import {closeOtherOverlays, registerOverlay} from '@/client/utils/overlayCoordinator';

const props = defineProps<{
  open: boolean;
  // Wider for extensive content (help)
  wide?: boolean;
  // Content brings its own header, close button and scrolling (help overlay):
  // fixed height, no padding, full-screen sheet on phones
  bare?: boolean;
  // Content is a DialogFrame (header with title and ✕, scrolling content, footer): box without padding
  framed?: boolean;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
}>();

function closeOnEscape(event: KeyboardEvent) {
  if (props.open && event.key === 'Escape') {
    emit('close');
  }
}

// Every sidebar dialog is its own overlay (overlayCoordinator.ts)
const overlayKey = 'sidebar-modal-' + Math.random().toString(36).slice(2);
let unregisterOverlay: (() => void) | undefined;

watch(() => props.open, (open) => {
  if (open) {
    closeOtherOverlays(overlayKey);
  }
});

onMounted(() => {
  window.addEventListener('keydown', closeOnEscape);
  unregisterOverlay = registerOverlay(overlayKey, () => {
    if (props.open) {
      emit('close');
    }
  });
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', closeOnEscape);
  unregisterOverlay?.();
});
</script>
