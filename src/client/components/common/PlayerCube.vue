<template>
  <!-- Small cubes: pre-rendered picture from the sprite sheet (playerCubeSprite.ts), same look, a fraction of the GPU cost -->
  <span v-if="spriteCell !== undefined" :class="['player-cube', 'player-cube--sprite']" :style="spriteStyle" aria-hidden="true"></span>
  <!-- Player cube in CSS 3D (player_cube.less): translucent acrylic, light from the top left.
       All six faces are rendered: depending on the rotation others become visible, and the back ones shine through. -->
  <span v-else :class="['player-cube', 'player-cube--' + view, 'player-cube--' + color, {'player-cube--animated': animated}]" :style="cubeStyle" aria-hidden="true">
    <span class="player-cube-body">
      <!-- Shadows on the ground plane, inside the 3D scene so they share the cube's perspective and rotation
           (only shown in the top view, player_cube.less) -->
      <i class="player-cube-shadow player-cube-shadow--rim"></i>
      <!-- Cast shadow as the cube's base swept away from the light: layered copies that all overlap at the base
           (dark, hard) and only the last ones reach the tip (light, soft) -->
      <i v-for="step in CAST_SHADOW_STEPS" :key="'cast' + step" class="player-cube-shadow player-cube-shadow--cast"
        :style="{'--shadow-step': String((step - 1) / (CAST_SHADOW_STEPS - 1))}"></i>
      <i v-for="face in FACES" :key="face" :class="'player-cube-face player-cube-face--' + face"></i>
    </span>
  </span>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {Color} from '@/common/Color';
import {
  detailForSize, PLAYER_CUBE_SPRITE_URL, SPRITE_CELL_FACTOR, SPRITE_COLUMNS, SPRITE_ROWS, spriteCellOf,
} from '@/client/components/common/playerCubeSprite';

export type PlayerCubeView = 'iso' | 'slight' | 'top';

const props = withDefaults(defineProps<{
  color: Color;
  // iso: standing piece; slight: seen slightly from above; top: lying on a flat surface (e.g. a card)
  view?: PlayerCubeView;
  // Edge length in px
  size?: number;
  // Rotation around the cube's own vertical axis in degrees; the lighting is recalculated, not rotated along
  spin?: number;
  // Animate view changes (e.g. top -> slight when the color gets chosen) instead of switching instantly
  animated?: boolean;
}>(), {
  view: 'slight',
  size: 20,
  spin: undefined,
  animated: false,
});

const FACES = ['back', 'right', 'bottom', 'top', 'left', 'front'] as const;
const CAST_SHADOW_STEPS = 6;

// Animated view changes need the live 3D cube; everything else small comes from the sheet
const spriteCell = computed(() => props.animated ? undefined : spriteCellOf(props.color, props.view, props.size, props.spin));

const spriteStyle = computed(() => ({
  '--cube-size': props.size + 'px',
  '--sprite-image': `url(${PLAYER_CUBE_SPRITE_URL})`,
  '--sprite-cell-factor': String(SPRITE_CELL_FACTOR),
  '--sprite-columns': String(SPRITE_COLUMNS),
  '--sprite-rows': String(SPRITE_ROWS.length),
  '--sprite-column': String(spriteCell.value?.column ?? 0),
  '--sprite-row': String(spriteCell.value?.row ?? 0),
}));

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
