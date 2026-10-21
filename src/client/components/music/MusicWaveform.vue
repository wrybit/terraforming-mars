<template>
  <!-- Waveform of a track (musicWaveforms.ts): the played part lit, a click jumps there; arrow keys jump 5 % -->
  <div class="music-waveform" role="slider" tabindex="0" :aria-label="label"
    aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(progress * 100)" :aria-valuetext="valueText"
    @click="seekAt" @keydown.left.prevent="step(-0.05)" @keydown.right.prevent="step(0.05)">
    <svg :viewBox="`0 0 ${peaks.length * 3} 40`" preserveAspectRatio="none" aria-hidden="true">
      <rect v-for="(peak, index) in peaks" :key="index" :x="index * 3" :y="20 - barHeight(peak) / 2" width="2" :height="barHeight(peak)" rx="1"
        :class="['music-waveform__bar', {'music-waveform__bar--played': (index + 0.5) / peaks.length <= progress}]"/>
    </svg>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {formatTrackTime} from '@/client/music/trackTime';

export default defineComponent({
  name: 'MusicWaveform',
  props: {
    peaks: {type: Array as PropType<ReadonlyArray<number>>, required: true},
    /** Share played, 0..1 */
    progress: {type: Number, required: true},
    duration: {type: Number, required: true},
    label: {type: String, required: true},
  },
  emits: ['seek'],
  computed: {
    valueText(): string {
      return `${formatTrackTime(this.progress * this.duration)} / ${formatTrackTime(this.duration)}`;
    },
  },
  methods: {
    // Quiet passages still get a visible stub, so the line never breaks
    barHeight(peak: number): number {
      return Math.max(3, peak * 38);
    },
    seekAt(event: MouseEvent): void {
      const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this.$emit('seek', Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)));
    },
    step(delta: number): void {
      this.$emit('seek', Math.min(1, Math.max(0, this.progress + delta)));
    },
  },
});
</script>
