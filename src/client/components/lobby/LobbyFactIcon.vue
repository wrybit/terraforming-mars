<template>
  <!-- Small line icons of the lobby rows' facts (LobbyGameRow.vue); the text next to them says the value -->
  <svg class="lobby-fact-icon" viewBox="0 0 24 24" aria-hidden="true">
    <template v-if="kind === 'generation'"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" /><path d="M18 3v4h-4M6 21v-4h4" /></template>
    <template v-else-if="kind === 'players'"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></template>
    <!-- Pulse line: the last move of a human player -->
    <template v-else-if="kind === 'activity'"><path d="M3 12h4l3-7 4 14 3-7h4" /></template>
    <template v-else-if="kind === 'ai'"><rect x="5" y="7" width="14" height="12" rx="3" /><path d="M12 3v4M9 12h.01M15 12h.01" /></template>
    <template v-else><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" /></template>
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  kind: 'generation' | 'players' | 'ai' | 'time' | 'activity';
}>();
</script>
