<template>
  <!-- One moving part of the Arrakis vector art (breathing value or check, blinking cell, pulsing glow) as its own small
       HTML layer above the board SVG, in the same 720 px board space: the browser animates the layer on the compositor
       and draws the SVG inside it once. Animated inside the board SVG, the whole SVG with its glow filters was drawn
       anew in every frame (about 260 ms of main thread per second while nothing happened, Jens 23 Oct 2026).
       Filters and gradients stay in the board SVG; url(#id) finds them anywhere in the document. -->
  <div :class="['arrakis-motion-part', motionClass]" :style="boxStyle" aria-hidden="true">
    <svg class="arrakis-motion-part__art" :width="width" :height="height" :viewBox="`${x} ${y} ${width} ${height}`">
      <slot/>
    </svg>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {MotionStyle} from './arrakisMotion';

export default defineComponent({
  name: 'ArrakisMotionPart',
  props: {
    // Box of the part in board px (720 px board space); a breathing part scales around its centre
    x: {type: Number, required: true},
    y: {type: Number, required: true},
    width: {type: Number, required: true},
    height: {type: Number, required: true},
    // Animation class of arrakis_scales.less (arrakis-scales__breathe, arrakis-scales__pulse, arrakis-spice__blink)
    motionClass: {type: String, required: true},
    // Own duration and phase (arrakisMotion.ts desync)
    motion: {type: Object as PropType<MotionStyle>, required: true},
  },
  computed: {
    boxStyle(): Record<string, string> {
      return {left: this.x + 'px', top: this.y + 'px', width: this.width + 'px', height: this.height + 'px', ...this.motion};
    },
  },
});
</script>
