<template>
  <div class="stats-chart">
    <svg v-if="bars.length > 0" :viewBox="`0 0 ${width} ${height}`" role="img">
      <g v-for="tick in ticks" :key="`tick-${tick}`">
        <line :x1="left" :x2="width" :y1="y(tick)" :y2="y(tick)" class="stats-chart-grid"/>
        <text :x="left - 6" :y="y(tick) + 4" text-anchor="end" class="stats-chart-label">{{ tick }}</text>
      </g>
      <g v-for="(bar, index) in bars" :key="bar.label">
        <title>{{ bar.title ?? `${bar.label}: ${bar.value}` }}</title>
        <rect :x="barX(index)" :y="y(bar.value)" :width="slot * 0.64" :height="y(0) - y(bar.value)" rx="3" class="stats-chart-bar"/>
        <rect v-if="(bar.highlight ?? 0) > 0" :x="barX(index)" :y="y(bar.highlight ?? 0)" :width="slot * 0.64" :height="y(0) - y(bar.highlight ?? 0)" rx="3" class="stats-chart-bar-highlight"/>
        <text v-if="bar.value > 0" :x="center(index)" :y="y(bar.value) - 4" text-anchor="middle" class="stats-chart-value">{{ bar.value }}</text>
        <text v-if="showLabel(index)" :x="center(index)" :y="height - 4" text-anchor="middle" class="stats-chart-label">{{ bar.label }}</text>
      </g>
    </svg>
    <div v-if="axisLabel !== undefined || highlightLabel !== undefined" class="stats-legend">
      <span v-if="axisLabel !== undefined" class="stats-dim" v-i18n>{{ axisLabel }}</span>
      <span v-if="highlightLabel !== undefined"><i class="stats-chart-bar-highlight"></i><span v-i18n>{{ highlightLabel }}</span></span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {StatsBar} from './statsTypes';

// Höchstens so viele Achsenbeschriftungen unten; bei vielen Säulen wird nur jede n-te beschriftet
const MAX_X_LABELS = 16;

// Säulen mit Hilfslinien, optional mit hervorgehobenem Anteil (z. B. Siege) unten in der Säule
export default defineComponent({
  name: 'StatsBarChart',
  props: {
    bars: {type: Array as PropType<ReadonlyArray<StatsBar>>, required: true},
    width: {type: Number, default: 640},
    /** Erklärt die x-Achse, z. B. „Siegpunkte“ (Englisch, wird übersetzt). */
    axisLabel: {type: String, default: undefined},
    /** Legende für den hervorgehobenen Anteil (Englisch, wird übersetzt). */
    highlightLabel: {type: String, default: undefined},
  },
  data() {
    return {height: 200, top: 16, bottom: 22, left: 30};
  },
  computed: {
    slot(): number {
      return (this.width - this.left) / Math.max(1, this.bars.length);
    },
    step(): number {
      // „Glatte“ Schrittweite (1, 2, 5, 10 …) für etwa vier Hilfslinien
      const raw = Math.max(1, ...this.bars.map((bar) => bar.value)) / 4;
      const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
      const nice = [1, 2, 5, 10].find((factor) => factor * magnitude >= raw) ?? 10;
      return Math.max(1, nice * magnitude);
    },
    maximum(): number {
      return Math.ceil(Math.max(1, ...this.bars.map((bar) => bar.value)) / this.step) * this.step;
    },
    ticks(): Array<number> {
      const ticks = [];
      for (let tick = 0; tick <= this.maximum; tick += this.step) {
        ticks.push(tick);
      }
      return ticks;
    },
  },
  methods: {
    y(value: number): number {
      return this.height - this.bottom - (this.height - this.top - this.bottom) * value / this.maximum;
    },
    barX(index: number): number {
      return this.left + index * this.slot + this.slot * 0.18;
    },
    center(index: number): number {
      return this.left + index * this.slot + this.slot / 2;
    },
    showLabel(index: number): boolean {
      return index % Math.ceil(this.bars.length / MAX_X_LABELS) === 0;
    },
  },
});
</script>
