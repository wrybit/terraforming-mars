<template>
  <!-- Feedback (Admin → Settings → Feedback): the overlay with key O, menu entry and shaking, only when switched on -->
  <FeedbackOverlay v-if="feedbackConfig.enabled" :view="view" />
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted} from 'vue';
import {ViewModel} from '@/common/models/PlayerModel';
import FeedbackOverlay from './FeedbackOverlay.vue';
import {feedbackConfig, loadFeedbackConfig} from './feedbackAvailability';
import {feedbackOpen, openFeedback} from './feedbackState';
import {listenForShake} from './feedbackShake';

defineProps<{
  view: ViewModel | undefined;
}>();

// Shaking the phone opens the feedback (no key there)
let stopShake: () => void = () => undefined;
onMounted(async () => {
  await loadFeedbackConfig();
  if (feedbackConfig.value.enabled) {
    stopShake = listenForShake(() => {
      if (!feedbackOpen.value) {
        openFeedback();
      }
    });
  }
});
onBeforeUnmount(() => stopShake());
</script>
