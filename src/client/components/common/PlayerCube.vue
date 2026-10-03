<template>
  <!-- Player cube in CSS 3D (player_cube.less): translucent acrylic, light from the top left.
       All six faces are rendered: depending on the rotation others become visible, and the back ones shine through. -->
  <span :class="['player-cube', 'player-cube--' + view, 'player-cube--' + color]" :style="cubeStyle" aria-hidden="true">
    <span class="player-cube-body">
      <!-- Shadows on the ground plane, inside the 3D scene so they share the cube's perspective and rotation
           (only shown in the top view, player_cube.less) -->
      <i class="player-cube-shadow player-cube-shadow--rim"></i>
      <i class="player-cube-shadow player-cube-shadow--cast"></i>
      <i v-for="face in FACES" :key="face" :class="'player-cube-face player-cube-face--' + face"></i>
    </span>
  </span>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {Color} from '@/common/Color';

export type PlayerCubeView = 'iso' | 'slight' | 'top';

const props = withDefaults(defineProps<{
  color: Color;
  // iso: standing piece; slight: seen slightly from above; top: lying on a flat surface (e.g. a card)
  view?: PlayerCubeView;
  // Edge length in px
  size?: number;
  // Rotation around the cube's own vertical axis in degrees; the lighting is recalculated, not rotated along
  spin?: number;
}>(), {
  view: 'slight',
  size: 20,
  spin: undefined,
});

const FACES = ['back', 'right', 'bottom', 'top', 'left', 'front'] as const;

// Hard 1px edges and sharp highlights look far too strong on small cubes:
// 0.2 for small cubes up to 1 from about 64px, all reflections are scaled by it
function detailForSize(size: number): number {
  return Math.min(1, Math.max(0.2, (size - 14) / 50));
}

const cubeStyle = computed(() => {
  const style: Record<string, string> = {
    '--cube-size': props.size + 'px',
    '--detail': String(detailForSize(props.size)),
  };
  // Only when given: the iso and slight views bring their own turn
  if (props.spin !== undefined) {
    style['--cube-turn'] = props.spin + 'deg';
  }
  return style;
});
</script>
