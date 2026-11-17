<template>
  <!-- Move text; every card name shows the card itself on hover (a tap on touch) -->
  <span class="decision-move-text"><template v-for="(part, index) in parts" :key="index"><AiCardHover v-if="part.card !== undefined" :card="part.card" class="decision-move-text__card">{{ part.text }}</AiCardHover><template v-else>{{ part.text }}</template></template></span>
</template>

<script setup lang="ts">
import AiCardHover from '@/client/components/logpanel/aiAnalysis/AiCardHover.vue';
import {MovePart} from '@/client/components/decisionLog/decisionLogModel';

defineProps<{parts: ReadonlyArray<MovePart>}>();
</script>
