<template>
  <!-- Simple line icons for tabs without a text label (mapping in orOptionsShortLabels.ts) -->
  <svg class="or-tab-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <!-- Pass: "skip to next" like in media players -->
    <template v-if="icon === 'pass-on'">
      <path d="M5 5l10 7-10 7z" fill="currentColor" stroke="none"/>
      <path d="M19 5v14"/>
    </template>
    <!-- End: door with an arrow pointing out (drop out for this generation) -->
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
