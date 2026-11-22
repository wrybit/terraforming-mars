<template>
  <span class="rust-ai-mark" v-glass-tooltip="$t('New β can do this')" :aria-label="$t('New β can do this')" role="img">
    <SeatIcon kind="ai" />
  </span>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import SeatIcon from './SeatIcon.vue';
import {glassTooltip} from '@/client/directives/GlassTooltip';

// Mark behind a setting the new AI can play: the robot of the AI seat row, sized like the text next to it
export default defineComponent({
  name: 'RustAiMark',
  components: {SeatIcon},
  directives: {glassTooltip},
});
</script>
