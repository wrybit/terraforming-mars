<template>
  <!-- Player marker on a board or track: the acrylic PlayerCube in a fixed box, so the existing position classes
       (board-cube, board-cube-coOwner, colony-cube, ...) keep working. The colorblind symbol sits on top of it. -->
  <span :class="['board-cube-acrylic', 'board-cube--' + color]">
    <PlayerCube :color="color" :view="view" :size="size" :spin="spin"/>
    <span v-if="symbol !== ''" class="board-cube-acrylic__symbol">{{ symbol }}</span>
    <span v-if="$slots.default" class="board-cube-acrylic__label"><slot></slot></span>
  </span>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {Color} from '@/common/Color';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import {playerSymbol} from '@/client/utils/playerSymbol';

const props = withDefaults(defineProps<{
  color: Color;
  // top: lying on a board (default); slight: next to text in lists and tables
  view?: 'top' | 'slight';
  // Edge length in px
  size?: number;
  // Stable rotation per spot (e.g. the space id): a real piece never lies perfectly straight,
  // but the same cube must not turn on every redraw
  spinSeed?: string;
}>(), {
  view: 'top',
  size: 17,
  spinSeed: undefined,
});

// Simple string hash (FNV-1a) mapped to 0…359 degrees
function spinFromSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 360;
}

const spin = computed(() => props.spinSeed === undefined ? undefined : spinFromSeed(props.spinSeed));
const symbol = computed(() => playerSymbol(props.color));
</script>
