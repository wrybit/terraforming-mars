<template>
  <div class="stats-chart">
    <svg v-if="bars.length > 0" :viewBox="`0 0 ${width} ${height}`" role="img">
      <g v-for="(bar, index) in bars" :key="bar.label">
        <rect :x="index * slot + slot * 0.18" :y="barTop(bar.value)" :width="slot * 0.64" :height="height - bottom - barTop(bar.value)" rx="4" class="stats-chart-bar">
          <title>{{ bar.label }}: {{ bar.value }}</title>
        </rect>
        <text v-if="bar.value > 0" :x="index * slot + slot / 2" :y="barTop(bar.value) - 4" text-anchor="middle" class="stats-chart-value">{{ bar.value }}</text>
        <text :x="index * slot + slot / 2" :y="height - 4" text-anchor="middle" class="stats-chart-label">{{ bar.label }}</text>
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {StatsBar} from './statsTypes';

// Einfache Säulen, z. B. Partien je Generationenzahl
export default defineComponent({
  name: 'StatsBarChart',
  props: {
    bars: {type: Array as PropType<ReadonlyArray<StatsBar>>, required: true},
    width: {type: Number, default: 640},
  },
  data() {
    return {height: 200, top: 16, bottom: 22};
  },
  computed: {
    slot(): number {
      return this.width / Math.max(1, this.bars.length);
    },
    maximum(): number {
      return Math.max(1, ...this.bars.map((bar) => bar.value));
    },
  },
  methods: {
    barTop(value: number): number {
      return this.height - this.bottom - (this.height - this.top - this.bottom) * value / this.maximum;
    },
  },
});
</script>
