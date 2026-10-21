<template>
  <!-- Particles of the Arrakis scales and spice fields as HTML dots over the SVG (same 720 px board space): their
       transform and opacity animations run on the compositor and cost the main thread nothing while scrolling -->
  <div class="arrakis-particles" aria-hidden="true">
    <span v-for="(particle, index) in particles" :key="index" class="arrakis-particles__dot"
      :style="{width: particle.radius * 2 + 'px', height: particle.radius * 2 + 'px', margin: -particle.radius + 'px', background: particle.colour}"></span>
  </div>
</template>

<script lang="ts">
import {defineComponent, markRaw, PropType} from 'vue';
import {trackPoints} from './particleTrack';
import {supportsWebAnimations} from '@/client/utils/motion';

/** One particle: its path in board px (with the SVG transform of its group), size, colour and two own clocks (seconds) */
export type ParticleFlow = {
  path: string,
  transform?: string,
  radius: number,
  colour: string,
  travel: number,
  travelBegin: number,
  blink: number,
  blinkBegin: number,
  /** Opacity at the start, middle and end of each blink */
  opacity: [number, number, number],
};

export default defineComponent({
  name: 'ArrakisParticles',
  props: {
    particles: {
      type: Array as PropType<ReadonlyArray<ParticleFlow>>,
      required: true,
    },
  },
  data() {
    // markRaw: native Animation and observer objects must not be wrapped in Vue proxies (their methods need the original)
    return {
      animations: markRaw([]) as Array<Animation>,
      visible: true,
      observer: undefined as IntersectionObserver | undefined,
    };
  },
  watch: {
    particles: {
      handler() {
        this.$nextTick(() => this.start());
      },
    },
  },
  mounted() {
    this.start();
    // Off screen or in the hidden copy of the board (column and zoom view) the particles stand still
    if (typeof IntersectionObserver === 'function') {
      this.observer = markRaw(new IntersectionObserver((entries) => {
        this.visible = entries.some((entry) => entry.isIntersecting);
        this.applyVisibility();
      }));
      this.observer.observe(this.$el as Element);
    }
  },
  beforeUnmount() {
    this.observer?.disconnect();
    this.stop();
  },
  methods: {
    stop(): void {
      this.animations.forEach((animation) => animation.cancel());
      this.animations = markRaw([]);
    },
    start(): void {
      this.stop();
      // In DOM order: a ref array in v-for does not keep the order of the list
      const dots = Array.from((this.$el as HTMLElement).querySelectorAll<HTMLElement>('.arrakis-particles__dot'));
      this.particles.forEach((particle, index) => {
        const dot = dots[index];
        if (dot === undefined || !supportsWebAnimations(dot)) {
          return;
        }
        const points = trackPoints(particle.path, particle.transform);
        if (points.length === 0) {
          return;
        }
        // Negative delays: every particle is already on its way when the board appears, as with SMIL's negative begin
        this.animations.push(dot.animate(points.map((point) => ({transform: `translate(${point.x.toFixed(2)}px, ${point.y.toFixed(2)}px)`})),
          {duration: particle.travel * 1000, delay: -particle.travelBegin * 1000, iterations: Infinity, easing: 'linear'}));
        this.animations.push(dot.animate(particle.opacity.map((opacity) => ({opacity})),
          {duration: particle.blink * 1000, delay: -particle.blinkBegin * 1000, iterations: Infinity, easing: 'linear'}));
      });
      this.applyVisibility();
    },
    applyVisibility(): void {
      this.animations.forEach((animation) => this.visible ? animation.play() : animation.pause());
    },
  },
});
</script>
