<template>
  <!-- Pin (like a map pin, tip at the bottom) or area, each with its number; same look on the screenshot and in the list -->
  <svg v-if="kind === 'pin'" class="feedback-marker-icon" :width="30 * scale" :height="40 * scale" viewBox="0 0 30 40" aria-hidden="true">
    <path d="M15 39C15 39 2 23.5 2 14a13 13 0 0 1 26 0c0 9.5-13 25-13 25z" class="feedback-marker-icon__shape" />
    <text x="15" y="18.5" text-anchor="middle" class="feedback-marker-icon__number">{{ number }}</text>
  </svg>
  <svg v-else class="feedback-marker-icon" :width="30 * scale" :height="24 * scale" viewBox="0 0 30 24" aria-hidden="true">
    <rect x="1.5" y="1.5" width="27" height="21" rx="4" class="feedback-marker-icon__shape feedback-marker-icon__shape--area" />
    <text x="15" y="16.5" text-anchor="middle" class="feedback-marker-icon__number">{{ number }}</text>
  </svg>
</template>

<script setup lang="ts">
import {FeedbackMarkerKind} from '@/common/feedback/FeedbackReport';

withDefaults(defineProps<{
  kind: FeedbackMarkerKind;
  number: number;
  scale?: number;
}>(), {
  scale: 1,
});
</script>
