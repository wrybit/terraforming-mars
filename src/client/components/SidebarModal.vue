<template>
  <!-- Gemeinsame Modal-Hülle für die Dialoge der Seitenleiste (Sprache, Info, Hilfe, Einstellungen):
       zentrierte Box mit Rahmen, Schatten und Hintergrund über abgedunkelter Seite.
       Teleport in body, damit Seitenleiste und Spalten-Overflow die Box nicht beschneiden. -->
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
  // Breiter für umfangreiche Inhalte (Hilfe)
  wide?: boolean;
  // Inhalt bringt Kopf, Schließen-Button und eigenes Scrollen selbst mit (Hilfe-Overlay):
  // feste Höhe, kein Innenabstand, am Handy als Vollbild-Blatt von unten
  bare?: boolean;
  // Inhalt ist ein DialogFrame (Kopf mit Titel und ✕, scrollender Inhalt, Fußzeile): Box ohne Innenabstand
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

// Jeder Seitenleisten-Dialog ist ein eigenes Overlay (overlayCoordinator.ts)
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
