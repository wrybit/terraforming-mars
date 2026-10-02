<template>
  <div class="stats-chart">
    <svg v-if="hasData" :viewBox="`0 0 ${width} ${height}`" role="img">
      <g v-for="tick in ticks" :key="tick">
        <line :x1="left" :x2="width - right" :y1="y(tick)" :y2="y(tick)" class="stats-chart-grid"/>
        <text :x="left - 6" :y="y(tick) + 4" text-anchor="end" class="stats-chart-label">{{ tick }}</text>
      </g>
      <g v-for="line in lines" :key="line.name">
        <polyline :points="line.path" fill="none" :class="`stats-chart-line stats-chart-stroke-${line.color}`"/>
        <circle
          v-for="dot in line.dots"
          :key="dot.index"
          :cx="x(dot.index)"
          :cy="y(dot.value)"
          :r="dot.highlight ? 5 : 3"
          :class="dot.highlight ? 'stats-chart-win' : `stats-chart-fill-${line.color}`">
          <title>{{ dot.title }}</title>
        </circle>
      </g>
      <text v-for="label in xLabels" :key="label.index" :x="x(label.index)" :y="height - 4" text-anchor="middle" class="stats-chart-label">{{ label.text }}</text>
    </svg>
    <p v-else class="stats-note" v-i18n>Not enough games yet.</p>
    <div class="stats-legend">
      <span v-for="line in lines" :key="line.name"><i :class="`stats-chart-fill-${line.color}`"></i><span v-i18n>{{ line.name }}</span></span>
      <span v-if="highlightLabel !== undefined"><i class="stats-chart-win stats-legend-dot"></i><span v-i18n>{{ highlightLabel }}</span></span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {StatsChartPoint, StatsChartSeries} from './statsTypes';

type Dot = StatsChartPoint & {index: number, value: number};

// Line chart for all of the statistics' time series (points of recent games, Ø per generation, global parameters)
export default defineComponent({
  name: 'StatsLineChart',
  props: {
    series: {type: Array as PropType<ReadonlyArray<StatsChartSeries>>, required: true},
    labels: {type: Array as PropType<ReadonlyArray<string>>, required: true},
    // Narrow drawing area on the phone, so the text isn't scaled tiny
    width: {type: Number, default: 640},
    step: {type: Number, default: 20},
    // Fixed upper bound (percent charts), otherwise from the data
    maximumValue: {type: Number, required: false},
    // Meaning of the highlighted points for the legend (English, gets translated)
    highlightLabel: {type: String, required: false},
  },
  data() {
    return {height: 220, left: 34, right: 8, top: 8, bottom: 22};
  },
  computed: {
    values(): Array<number> {
      return this.series.flatMap((line) => line.points.flatMap((point) => point.value === undefined ? [] : [point.value]));
    },
    hasData(): boolean {
      return this.labels.length > 1 && this.values.length > 1;
    },
    minimum(): number {
      return this.maximumValue !== undefined ? 0 : Math.floor(Math.min(...this.values) / this.step) * this.step;
    },
    maximum(): number {
      return this.maximumValue ?? Math.max(this.minimum + this.step, Math.ceil(Math.max(...this.values) / this.step) * this.step);
    },
    ticks(): Array<number> {
      const ticks = [];
      for (let tick = this.minimum; tick <= this.maximum; tick += this.step) {
        ticks.push(tick);
      }
      return ticks;
    },
    lines(): Array<{name: string, color: string, path: string, dots: Array<Dot>}> {
      return this.series.map((line) => {
        const dots = line.points
          .map((point, index) => ({...point, index}))
          .filter((point): point is Dot => point.value !== undefined);
        return {
          name: line.name,
          color: line.color,
          path: dots.map((dot) => `${this.x(dot.index)},${this.y(dot.value)}`).join(' '),
          dots,
        };
      }).filter((line) => line.dots.length > 0);
    },
    xLabels(): Array<{index: number, text: string}> {
      // Only every second/third label when it gets tight
      const every = Math.max(1, Math.ceil(this.labels.length / (this.width < 500 ? 6 : 12)));
      return this.labels
        .map((text, index) => ({index, text}))
        .filter((label) => label.index % every === 0);
    },
  },
  methods: {
    x(index: number): number {
      return this.left + index * (this.width - this.left - this.right) / Math.max(1, this.labels.length - 1);
    },
    y(value: number): number {
      return this.top + (this.height - this.top - this.bottom) * (1 - (value - this.minimum) / (this.maximum - this.minimum));
    },
  },
});
</script>
