<template>
  <div class="dialog-frame" :style="{width: width + 'px'}">
    <div class="dialog-frame-head">
      <span class="dialog-frame-icon"><slot name="icon"></slot></span>
      <h2 class="dialog-frame-title">{{ title }}</h2>
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
// Gemeinsamer Rahmen der Seitenleisten-Dialoge mit Titel: Kopf (Symbol, Titel, ✕),
// scrollender Inhalt, optionale Fußzeile. Breite per Prop, damit jeder Dialog sein Raster füllt.
// Kein Kommentar im Template: ein Wurzelelement, damit die Klasse des Aufrufers ankommt.
defineProps<{
  title: string;
  width: number;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
}>();
</script>
