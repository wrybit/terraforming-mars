<template>
  <!-- Rating buttons of the AI row under the mouse (analysis game); a click opens the rating dialog with that choice -->
  <div class="log-ai-rate-bar" role="group" :aria-label="$t('Rate AI decision')" data-test="log-ai-rate-bar"
    :style="{left: left + 'px', top: top + 'px'}">
    <button v-for="choice in choices" :key="choice.rating" type="button" class="log-ai-rate-bar__button"
      :title="$t(choice.label)" :aria-label="$t(choice.label)" :data-test="'log-ai-rate-' + choice.rating"
      @click.stop="emit('rate', choice.rating)">{{ emoji[choice.rating] }}</button>
  </div>
</template>

<script setup lang="ts">
import {AI_FEEDBACK_EMOJI, AiFeedbackRating} from '@/common/ai/AiFeedback';
import {AI_RATING_CHOICES} from './aiRatingChoices';

// Position in window coordinates (position: fixed): right behind the row's text, vertically centred
defineProps<{
  left: number;
  top: number;
}>();

const emit = defineEmits<{
  (event: 'rate', rating: AiFeedbackRating): void;
}>();

const emoji = AI_FEEDBACK_EMOJI;
// Order of the bar: the common ratings first, the flag last
const choices = [...AI_RATING_CHOICES].sort((a, b) => a.barOrder - b.barOrder);
</script>
