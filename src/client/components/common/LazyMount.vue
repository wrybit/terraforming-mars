<template>
  <!-- Until it comes near the visible area only the placeholder (same size), then the real content for good -->
  <div ref="root">
    <slot v-if="near"></slot>
    <slot v-else name="placeholder"></slot>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {observeNearViewport, unobserveNearViewport} from '@/client/utils/nearViewport';
import {revealWhenLoaded} from '@/client/components/cardlist/cardReveal';

// Renders its content only once it comes near the visible area (nearViewport.ts): long lists (card list)
// then only build what can be seen, plus a margin above and below
export default defineComponent({
  name: 'LazyMount',
  props: {
    // Content stays hidden until its pictures are loaded, then fades in with its neighbours (cardReveal.ts)
    reveal: {type: Boolean, default: false},
  },
  emits: ['shown'],
  data() {
    return {near: false};
  },
  mounted() {
    observeNearViewport(this.$refs.root as Element, () => {
      this.near = true;
      this.$nextTick(async () => {
        if (this.reveal) {
          await revealWhenLoaded(this.$refs.root as HTMLElement);
        }
        this.$emit('shown');
      });
    });
  },
  beforeUnmount() {
    unobserveNearViewport(this.$refs.root as Element);
  },
});
</script>
