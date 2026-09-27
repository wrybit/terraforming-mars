<template>
  <!-- Schlichte Strich-Icons für Tabs ohne Textlabel (Zuordnung in orOptionsShortLabels.ts) -->
  <svg class="or-tab-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <!-- Verkaufen: Handkarte plus Münze mit €-Zeichen (Patente gegen M€ verkaufen) -->
    <template v-if="icon === 'sell'">
      <rect x="2.5" y="2.5" width="11" height="16" rx="1.5"/>
      <circle cx="16" cy="16" r="6.5" fill="currentColor" stroke="none"/>
      <text x="16" y="19.6" text-anchor="middle" font-size="10" font-weight="bold" font-family="Arial, sans-serif"
        fill="#1d2030" stroke="none">€</text><!-- dunkles € auf heller Münze, unabhängig vom Tab-Zustand gut lesbar -->
    </template>
    <!-- Weitergeben: "Weiter zum Nächsten" wie bei Mediaplayern -->
    <template v-else-if="icon === 'pass-on'">
      <path d="M5 5l10 7-10 7z" fill="currentColor" stroke="none"/>
      <path d="M19 5v14"/>
    </template>
    <!-- Beenden: Tür mit Pfeil nach draußen (für diese Generation aussteigen) -->
    <template v-else-if="icon === 'end-generation'">
      <path d="M13 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h7"/>
      <path d="M10 12h11"/>
      <path d="m17 8 4 4-4 4"/>
    </template>
  </svg>
</template>

<script setup lang="ts">
import {TabIcon} from '@/client/components/orOptionsShortLabels';

defineProps<{
  icon: TabIcon;
}>();
</script>
