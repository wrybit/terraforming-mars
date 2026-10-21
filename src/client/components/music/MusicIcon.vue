<template>
  <!-- Icons of the music players (admin page, card under the setup menu), drawn in the text colour -->
  <svg class="music-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path v-if="name === 'play'" d="M8 5.5v13l11-6.5z" fill="currentColor"/>
    <g v-else-if="name === 'pause'" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></g>
    <rect v-else-if="name === 'stop'" x="6.5" y="6.5" width="11" height="11" rx="1.5" fill="currentColor"/>
    <g v-else-if="name === 'next'" fill="currentColor"><path d="M5 5.5v13l9.5-6.5z"/><rect x="15.5" y="5.5" width="3" height="13" rx="1"/></g>
    <g v-else-if="name === 'volume'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>
    </g>
    <g v-else fill="currentColor"><path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/><path d="M9 6l10-2v2.5L9 8.5z"/></g>
  </svg>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';

export type MusicIconName = 'play' | 'pause' | 'stop' | 'next' | 'volume' | 'note';

export default defineComponent({
  name: 'MusicIcon',
  props: {
    name: {type: String as PropType<MusicIconName>, required: true},
  },
});
</script>
