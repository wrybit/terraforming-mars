<template>
  <!-- Spice fields below Arrakis (arrakisSpiceFields.ts): the field tile, one cell per field and the count on a flat arc;
       all placed, the cells merge into a loaded bar with flowing particles and a check in a hexagon -->
  <svg class="arrakis-scales arrakis-spice" width="720" height="720" viewBox="0 0 720 720" role="img" :aria-label="label">
    <defs>
      <filter :id="glowId" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.16" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffb35c"/>
        <stop offset="1" stop-color="#c4501a"/>
      </linearGradient>
      <path :id="textPathId" :d="barPath"/>
    </defs>
    <image :transform="at(layout.icon)" href="assets/themes/dune/graphics/tile-spicefield.svg"
      :x="-ICON_SIZE / 2" :y="-ICON_SIZE / 2" :width="ICON_SIZE" :height="ICON_SIZE"/>
    <template v-if="complete">
      <path class="arrakis-spice__glow arrakis-scales__pulse" :style="motion('spice-glow', 2.2)" :d="barPath" :stroke-width="(BAR_HEIGHT + 8.66) * row.scale" :filter="glowUrl"/>
      <path class="arrakis-spice__rim" :d="barPath" :stroke-width="(BAR_HEIGHT + 2.16) * row.scale"/>
      <path class="arrakis-spice__bar" :d="barPath" :stroke-width="BAR_HEIGHT * row.scale"/>
      <!-- Particles stream from left to right through the full bar, each with its own pace and blink -->
      <circle v-for="(flow, index) in barParticles" :key="'particle' + index" :r="flow.radius" :fill="whiteTo('#ffd08a', flow.colourShare)">
        <animateMotion :dur="seconds(flow.travel)" :begin="seconds(-flow.travelBegin)" repeatCount="indefinite" :path="flow.path"/>
        <animate attributeName="opacity" values=".1;1;.1" :dur="seconds(flow.blink)" :begin="seconds(-flow.blinkBegin)" repeatCount="indefinite"/>
      </circle>
      <text class="arrakis-spice__done" :style="{fontSize: 9.38 * row.scale + 'px', letterSpacing: 1.44 * row.scale + 'px'}"><textPath :href="'#' + textPathId" startOffset="50%" text-anchor="middle" dominant-baseline="central">{{ doneText }}</textPath></text>
      <g :transform="at(layout.check)">
        <g class="arrakis-scales__breathe" :style="motion('spice-check', 2.4)">
          <path class="arrakis-spice__cell arrakis-spice__cell--check" :d="hexagon(CHECK_HEX)" :fill="gradientUrl" :filter="glowUrl"/>
          <path class="arrakis-spice__tick" d="M -5.05 0 l 3.54 3.54 l 6.57 -7.07"/>
        </g>
      </g>
    </template>
    <template v-else>
      <g v-for="(cell, index) in cells" :key="'cell' + index" :transform="at(cell.distance)">
        <template v-if="cell.filled">
          <path class="arrakis-spice__cell" :d="hexagon(CELL_WIDTH)" :fill="gradientUrl" :filter="glowUrl"/>
          <!-- Sparks rise from every filled cell, each on its own clock -->
          <circle v-for="(spark, sparkIndex) in sparksOf(cell)" :key="'spark' + sparkIndex" :cx="spark.dx" cy="0" :r="spark.radius" :fill="whiteTo('#ffb35c', spark.colourShare)">
            <animate attributeName="cy" :values="'0;' + (-spark.rise).toFixed(2)" :dur="seconds(spark.duration)" :begin="seconds(-spark.riseBegin)" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;1;0" :dur="seconds(spark.duration)" :begin="seconds(-spark.fadeBegin)" repeatCount="indefinite"/>
          </circle>
        </template>
        <!-- The next open field blinks softly: that is where it goes on -->
        <path v-else :class="['arrakis-spice__cell', 'arrakis-spice__cell--open', {'arrakis-spice__cell--next arrakis-spice__blink': cell.next}]"
          :style="cell.next ? motion('spice-next', 1.6) : undefined" :d="hexagon(CELL_WIDTH)"/>
      </g>
      <text class="arrakis-spice__count" :transform="at(layout.count)" x="0" y="0.72">{{ count }}<tspan class="arrakis-spice__max">/{{ fields }}</tspan></text>
    </template>
  </svg>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {BAR_HEIGHT, CELL_WIDTH, CHECK_HEX, ICON_SIZE, SpiceLayout, SpiceRow, hexagon, onSpiceArc, spiceArc, spiceLayout, spiceRow} from './arrakisSpiceFields';
import {MotionStyle, desync, seededRandom, whiteTo} from './arrakisMotion';
import {translateTextWithParams} from '@/client/directives/i18n';
import {prefersReducedMotion} from '@/client/utils/motion';

type Cell = {distance: number, filled: boolean, next: boolean, index: number};
type Spark = {dx: number, radius: number, colourShare: number, rise: number, duration: number, riseBegin: number, fadeBegin: number};
type BarParticle = {path: string, radius: number, colourShare: number, travel: number, travelBegin: number, blink: number, blinkBegin: number};

// Seed of the sparks and bar particles, as in the mockup
const SEED = 41;
let instances = 0;

export default defineComponent({
  name: 'ArrakisSpiceFields',
  props: {
    large: {
      type: Boolean,
      default: false,
    },
    count: {
      type: Number,
      required: true,
    },
    fields: {
      type: Number,
      required: true,
    },
  },
  data() {
    instances++;
    return {uid: instances};
  },
  computed: {
    ICON_SIZE(): number {
      return ICON_SIZE;
    },
    CELL_WIDTH(): number {
      return CELL_WIDTH;
    },
    CHECK_HEX(): number {
      return CHECK_HEX;
    },
    BAR_HEIGHT(): number {
      return BAR_HEIGHT;
    },
    row(): SpiceRow {
      return spiceRow(this.large);
    },
    layout(): SpiceLayout {
      return spiceLayout(this.fields, this.row.scale);
    },
    // Bar height at the row's size
    barHeight(): number {
      return BAR_HEIGHT * this.row.scale;
    },
    complete(): boolean {
      return this.count >= this.fields;
    },
    still(): boolean {
      return prefersReducedMotion();
    },
    glowId(): string {
      return 'arrakis-spice-glow-' + this.uid;
    },
    glowUrl(): string {
      return `url(#${this.glowId})`;
    },
    gradientId(): string {
      return 'arrakis-spice-gradient-' + this.uid;
    },
    gradientUrl(): string {
      return `url(#${this.gradientId})`;
    },
    textPathId(): string {
      return 'arrakis-spice-text-' + this.uid;
    },
    // The bar: its round ends reach half its height beyond the path, so the path is that much shorter
    barPath(): string {
      return spiceArc(this.row, this.layout.cellsLeft + this.barHeight / 2, this.layout.cellsRight - this.barHeight / 2);
    },
    label(): string {
      return `${this.count}/${this.fields}`;
    },
    doneText(): string {
      return translateTextWithParams('All ${0} spice fields', [String(this.fields)]).toLocaleUpperCase();
    },
    cells(): Array<Cell> {
      return this.layout.cells.map((distance, index) => ({distance, index, filled: index < this.count, next: index === this.count}));
    },
    // Two sparks per filled cell, drawn from one fixed sequence in cell order
    sparks(): Array<Array<Spark>> {
      const random = seededRandom(SEED);
      return this.cells.map((cell) => {
        if (!cell.filled) {
          return [];
        }
        return [0, 1].map(() => {
          const duration = 1.4 + random() * 1.8;
          const dx = (random() - 0.5) * 10.1;
          const radius = 0.58 + random() * 1.01;
          const colourShare = random();
          const rise = 15.87 + random() * 7.22;
          return {duration, dx, radius, colourShare, rise, riseBegin: random() * duration, fadeBegin: random() * duration};
        });
      });
    },
    barParticles(): Array<BarParticle> {
      if (this.still) {
        return [];
      }
      const random = seededRandom(SEED);
      const scale = this.row.scale;
      const from = this.layout.cellsLeft + this.barHeight / 2;
      const to = this.layout.cellsRight - this.barHeight / 2;
      return Array.from({length: 26}, () => {
        const offset = (random() - 0.5) * (BAR_HEIGHT - 5.77) * scale;
        const travel = 2 + random() * 3;
        const blink = 0.6 + random() * 1.4;
        const radius = (0.58 + random() * 1.44) * scale;
        const colourShare = random();
        return {path: spiceArc(this.row, from, to, offset), radius, colourShare, travel, travelBegin: random() * travel, blink, blinkBegin: random() * blink};
      });
    },
  },
  methods: {
    hexagon,
    whiteTo,
    at(distance: number): string {
      return onSpiceArc(this.row, distance);
    },
    motion(key: string, baseSeconds: number): MotionStyle {
      return desync(key, baseSeconds);
    },
    seconds(value: number): string {
      return value.toFixed(2) + 's';
    },
    sparksOf(cell: Cell): ReadonlyArray<Spark> {
      return this.still ? [] : this.sparks[cell.index];
    },
  },
});
</script>
