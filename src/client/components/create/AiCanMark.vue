<template>
  <span class="ai-can-mark" v-glass-tooltip="$t('The AI can do this')" :aria-label="$t('The AI can do this')" role="img">
    <SeatIcon kind="ai" />
  </span>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import SeatIcon from './SeatIcon.vue';
import {glassTooltip} from '@/client/directives/GlassTooltip';

// Mark behind a setting the AI can play: the robot of the AI seat row, sized like the text next to it
export default defineComponent({
  name: 'AiCanMark',
  components: {SeatIcon},
  directives: {glassTooltip},
});
</script>
