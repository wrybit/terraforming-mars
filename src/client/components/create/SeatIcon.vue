<template>
  <svg class="seat-icon" :width="size" :height="size" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path v-if="kind === 'human'" d="M12 1.6a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6zM12 9c-3.2 0-9.3 1-9.8 3.6-.3 1.7 2.6 2.1 5 2.3L5.3 20.6c-.3.8.3 1.6 1.2 1.6H10l2-3.6 2 3.6h3.5c.9 0 1.5-.8 1.2-1.6l-1.9-5.7c2.4-.2 5.3-.6 5-2.3C21.3 10 15.2 9 12 9z"/>
    <!-- Robot: eyes and mouth are cut out (even-odd), so the icon works on any background -->
    <path v-else-if="kind === 'ai'" fill-rule="evenodd"
      d="M11 2.5a1 1 0 1 1 2 0V6h3.5A3.5 3.5 0 0 1 20 9.5v6a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 15.5v-6A3.5 3.5 0 0 1 7.5 6H11zM9 10.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zm6 0a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM9 15.5v1.6h6v-1.6zM1 10.5a1 1 0 0 1 2 0v4a1 1 0 0 1-2 0zm20 0a1 1 0 0 1 2 0v4a1 1 0 0 1-2 0z"/>
    <path v-else fill-rule="evenodd" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM6 10.5v3h12v-3z"/>
  </svg>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {SeatIconKind} from './createGameChoices';

// Seat symbol: meeple for a human, small robot for an AI, "no entry" for no AI at all
export default defineComponent({
  name: 'SeatIcon',
  props: {
    kind: {
      type: String as PropType<SeatIconKind>,
      required: true,
    },
    size: {
      type: Number,
      default: 18,
    },
  },
});
</script>
