<template>
  <!-- Likely duplicates on a surface of their own above the list: one click opens the confirmation -->
  <div v-if="suggestions.length > 0" class="admin-players-suggestions">
    <span class="admin-players-suggestions-title" v-i18n>Possible duplicates</span>
    <div v-for="suggestion in suggestions" :key="suggestion.from" class="admin-players-suggestion">
      <span class="admin-players-pair">
        <span class="admin-players-pill">{{ suggestion.from }}</span>
        <span class="admin-players-arrow" aria-hidden="true">→</span>
        <span class="admin-players-pill">{{ suggestion.to }}</span>
      </span>
      <button type="button" class="btn btn-sm btn-tone-quiet" @click="emit('merge', suggestion)" v-i18n>Merge…</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {MergeSuggestion} from './similarPlayerNames';

defineProps<{
  suggestions: ReadonlyArray<MergeSuggestion>,
}>();

const emit = defineEmits<{
  (event: 'merge', suggestion: MergeSuggestion): void;
}>();
</script>
