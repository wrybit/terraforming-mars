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
import {tuneAmbientAnimations} from '@/client/utils/ambientMotion';

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
  computed: {
    // The parents compute a new array on every game update (same content: the particles are seeded). Restarting
    // re-measures every path and recreates two Web Animations per dot, about 250 ms of main thread per update;
    // only a real change of the particles needs that.
    signature(): string {
      return JSON.stringify(this.particles);
    },
  },
  watch: {
    signature() {
      this.$nextTick(() => this.start());
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
      // First all paths are measured, then all animations made: measuring needs the styles up to date and every new
      // animation outdates them, so alternating both recalculated the styles of the whole page once per particle
      // (most of a 200 ms frame after a move that changes a scale, Jens 23 Oct 2026)
      const tracks = this.particles.map((particle) => trackPoints(particle.path, particle.transform));
      this.particles.forEach((particle, index) => {
        const dot = dots[index];
        const points = tracks[index];
        if (dot === undefined || !supportsWebAnimations(dot) || points.length === 0) {
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
      // On the shared clock and paused while the page is idle (ambientMotion.ts)
      tuneAmbientAnimations();
    },
  },
});
</script>
