<template>
  <span><template v-for="(segment, index) in segments" :key="index"><mark v-if="segment.style === 'rule'">{{ segment.text }}</mark><span v-else-if="segment.style === 'opponent'" class="card-text-opponent">{{ segment.text }}</span><template v-else>{{ segment.text }}</template></template></span>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {TextSegment} from '@/client/cards/parseCardTextMarkup';

// Already translated card text with its highlights (rule words, opponent words); see parseCardTextMarkup.ts
export default defineComponent({
  name: 'CardTextSegments',
  props: {
    segments: {
      type: Array as PropType<ReadonlyArray<TextSegment>>,
      required: true,
    },
  },
});
</script>
