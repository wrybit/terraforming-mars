<template>
  <!-- Gemeinsame Modal-Hülle für die Dialoge der Seitenleiste (Sprache, Info, Hilfe, Einstellungen):
       zentrierte Box mit Rahmen, Schatten und Hintergrund über abgedunkelter Seite.
       Teleport in body, damit Seitenleiste und Spalten-Overflow die Box nicht beschneiden. -->
  <Teleport to="body">
    <div v-if="open" class="sidebar-modal-backdrop" @click.self="$emit('close')">
      <div class="sidebar-modal" role="dialog" aria-modal="true" :class="{'sidebar-modal--wide': wide}">
        <button type="button" class="sidebar-modal-close" :aria-label="$t('Close')" @click="$emit('close')">✕</button>
        <slot></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted} from 'vue';

const props = defineProps<{
  open: boolean;
  // Breiter für umfangreiche Inhalte (Hilfe)
  wide?: boolean;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
}>();

function closeOnEscape(event: KeyboardEvent) {
  if (props.open && event.key === 'Escape') {
    emit('close');
  }
}

onMounted(() => window.addEventListener('keydown', closeOnEscape));
onBeforeUnmount(() => window.removeEventListener('keydown', closeOnEscape));
</script>
