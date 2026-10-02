<template>
  <span :class="['mb-turn-button', {'mb-turn-button--idle': !acting}]">
    <!-- Round turn button with a rocket: in the footer and on the edge of the turn sheet (it slides up with it there).
         On your turn purple with a pulse and badge "Action x/y", otherwise gray without a badge. Comment inside, so the root stays one element (class passthrough) -->
    <MobileGlyph name="rocket" :stroke-width="2"/>
    <span v-if="actionNumber !== undefined" class="mb-turn-count">{{ actionNumber }}/{{ actionsPerTurn }}</span>
  </span>
</template>

<script setup lang="ts">
import MobileGlyph from '@/client/components/mobile/MobileGlyph.vue';

defineProps<{
  acting: boolean;
  actionNumber: number | undefined;
  actionsPerTurn: number;
}>();
</script>
