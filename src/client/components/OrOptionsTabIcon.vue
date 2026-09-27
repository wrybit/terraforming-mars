<template>
  <!-- Schlichte Strich-Icons für Tabs ohne Textlabel (Zuordnung in orOptionsShortLabels.ts) -->
  <svg class="or-tab-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <!-- Verkaufen: Preisschild -->
    <template v-if="icon === 'sell'">
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/>
      <circle cx="7.5" cy="7.5" r="1.5"/>
    </template>
    <!-- Weitergeben: Pfeil zum Strich (Zug an den Nächsten) -->
    <template v-else-if="icon === 'pass-on'">
      <path d="M4 12h12"/>
      <path d="m11 6 6 6-6 6"/>
      <path d="M20 5v14"/>
    </template>
    <!-- Beenden: Zielflagge (Generation passen) -->
    <template v-else-if="icon === 'end-generation'">
      <path d="M5 21V4"/>
      <path d="M5 4h11l-2 4 2 4H5"/>
    </template>
  </svg>
</template>

<script setup lang="ts">
import {TabIcon} from '@/client/components/orOptionsShortLabels';

defineProps<{
  icon: TabIcon;
}>();
</script>
