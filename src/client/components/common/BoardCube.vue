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
  // Edge length in px; 14 matches the footprint of the old flat board sprite
  size?: number;
  // Stable rotation per spot (e.g. the space id): a real piece never lies perfectly straight,
  // but the same cube must not turn on every redraw
  spinSeed?: string;
}>(), {
  view: 'top',
  size: 14,
  spinSeed: undefined,
});

// String hash (FNV-1a) with a final bit mix: plain FNV-1a gives neighboring space ids ("10", "11", "12")
// almost the same angle. A cube looks the same every 90°, so 0…89 already covers every distinct turn.
function spinFromSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) % 90;
}

const spin = computed(() => props.spinSeed === undefined ? undefined : spinFromSeed(props.spinSeed));
const symbol = computed(() => playerSymbol(props.color));
</script>
