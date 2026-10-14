<template>
  <!-- Ratings of an AI row, right below it: emoji, who, comment -->
  <ul v-if="entries.length > 0" class="log-ai-ratings" data-test="log-ai-ratings">
    <li v-for="entry in entries" :key="entry.color" class="log-ai-rating">
      <span class="log-ai-rating-emoji" aria-hidden="true">{{ emoji[entry.rating] }}</span>
      <span :class="'log-row-name log-row-name--' + entry.color">{{ entry.name }}</span>
      <span v-if="entry.text !== ''" class="log-ai-rating-text">{{ entry.text }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import {AI_FEEDBACK_EMOJI, AiFeedbackEntry} from '@/common/ai/AiFeedback';

// Ratings of one AI row in the log of an analysis game (everyone sees everyone's ratings)
defineProps<{
  entries: ReadonlyArray<AiFeedbackEntry>;
}>();

const emoji = AI_FEEDBACK_EMOJI;
</script>
