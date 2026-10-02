<template>
  <div class="stats-chart">
    <svg v-if="points.length > 1" :viewBox="`0 0 ${width} ${height}`" role="img">
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
          :cy="y(dot.points)"
          :r="dot.won ? 5 : 3"
          :class="dot.won ? 'stats-chart-win' : `stats-chart-fill-${line.color}`">
          <title>{{ line.name }}: {{ dot.points }} · {{ dot.date }}</title>
        </circle>
      </g>
      <text v-for="label in xLabels" :key="label.index" :x="x(label.index)" :y="height - 4" text-anchor="middle" class="stats-chart-label">{{ label.text }}</text>
    </svg>
    <p v-else class="stats-note" v-i18n>Not enough games yet.</p>
    <div class="stats-legend">
      <span v-for="line in lines" :key="line.name"><i :class="`stats-chart-fill-${line.color}`"></i>{{ line.name }}</span>
      <span><i class="stats-chart-win stats-legend-dot"></i><span v-i18n>Win</span></span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {Color} from '@/common/Color';
import {StatsGame} from '@/common/stats/StatsGame';
import {formatDate} from './statsLabels';

type Dot = {index: number, points: number, won: boolean, date: string};

const STEP = 20;

// Siegpunkte der letzten Partien je Spieler; Siege als gelbe Punkte
export default defineComponent({
  name: 'StatsLineChart',
  inject: {
    playerColors: {default: () => new Map<string, Color>()},
  },
  props: {
    games: {type: Array as PropType<ReadonlyArray<StatsGame>>, required: true},
    names: {type: Array as PropType<ReadonlyArray<string>>, required: true},
    // Schmale Zeichenfläche auf dem Handy, damit die Schrift nicht winzig skaliert wird
    width: {type: Number, default: 640},
  },
  data() {
    return {height: 220, left: 34, right: 8, top: 8, bottom: 22};
  },
  computed: {
    points(): Array<number> {
      return this.games.flatMap((game) => game.summary.players.map((player) => player.victoryPoints));
    },
    minimum(): number {
      return Math.floor(Math.min(...this.points) / STEP) * STEP;
    },
    maximum(): number {
      return Math.max(this.minimum + STEP, Math.ceil(Math.max(...this.points) / STEP) * STEP);
    },
    ticks(): Array<number> {
      const ticks = [];
      for (let tick = this.minimum; tick <= this.maximum; tick += STEP) {
        ticks.push(tick);
      }
      return ticks;
    },
    lines(): Array<{name: string, color: Color, path: string, dots: Array<Dot>}> {
      return this.names.map((name) => {
        const dots: Array<Dot> = [];
        this.games.forEach((game, index) => {
          const player = game.summary.players.find((candidate) => candidate.name === name);
          if (player !== undefined) {
            dots.push({index, points: player.victoryPoints, won: player.isWinner, date: formatDate(game.summary.createdTimeMs)});
          }
        });
        return {
          name,
          color: (this.playerColors as Map<string, Color>).get(name) ?? 'neutral',
          path: dots.map((dot) => `${this.x(dot.index)},${this.y(dot.points)}`).join(' '),
          dots,
        };
      }).filter((line) => line.dots.length > 0);
    },
    xLabels(): Array<{index: number, text: string}> {
      // Nur jedes zweite/dritte Datum, sonst überlappen sie
      const every = this.width < 500 ? 3 : 2;
      return this.games
        .map((game, index) => ({index, text: formatDate(game.summary.createdTimeMs).slice(0, 5)}))
        .filter((label) => label.index % every === 0);
    },
  },
  methods: {
    x(index: number): number {
      return this.left + index * (this.width - this.left - this.right) / Math.max(1, this.games.length - 1);
    },
    y(value: number): number {
      return this.top + (this.height - this.top - this.bottom) * (1 - (value - this.minimum) / (this.maximum - this.minimum));
    },
  },
});
</script>
