<template>
  <!-- Small chart of the prophecy in the side box (Jens 25 Oct 2026, _mockups/dune/choam/prophezeiung-layout.html): one
       column per rate that can be prophesied, each what a prophecy on that rate brings (grey normal, green what the
       rate adds, orange the premium, every part with its number, the sum on top). The own column has a ring, the
       others are pale; a tap on a column names its rate. Short axis labels instead of text below. -->
  <svg class="prophecy-chart" :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="$t('What you get, per rate')">
    <text class="prophecy-chart__label" :transform="`translate(12 ${(T + H - B) / 2}) rotate(-90)`" text-anchor="middle">{{ yLabel }}</text>
    <line class="prophecy-chart__baseline" :x1="L" :x2="W - R" :y1="H - B" :y2="H - B"/>
    <g v-for="(column, index) in columns" :key="column.rate" :class="['prophecy-chart__column', {'prophecy-chart__column--other': column.rate !== rate}]"
      @click="$emit('pick', column.rate)">
      <rect class="prophecy-chart__hit" :x="L + slot * index" y="0" :width="slot" :height="H"/>
      <g v-for="part in column.parts" :key="part.kind">
        <rect :class="'prophecy-chart__part prophecy-chart__part--' + part.kind" :x="barX(index)" :y="part.top" :width="bar" :height="part.height"/>
        <text :class="'prophecy-chart__value prophecy-chart__value--' + part.kind" :x="barX(index) + bar / 2" :y="part.top + part.height / 2 + 4"
          text-anchor="middle">{{ part.label }}</text>
      </g>
      <text class="prophecy-chart__sum" :x="barX(index) + bar / 2" :y="column.top - 6" text-anchor="middle">{{ column.total }}</text>
      <text :class="['prophecy-chart__axis', {'prophecy-chart__axis--own': column.rate === rate}]" :x="barX(index) + bar / 2" :y="H - B + 15"
        text-anchor="middle">{{ column.rate }}</text>
      <text v-if="column.rate === nextRate" class="prophecy-chart__axis prophecy-chart__axis--next" :x="barX(index) + bar / 2" :y="H - B + 29"
        text-anchor="middle">G{{ nextGeneration }}</text>
    </g>
    <rect v-if="ownIndex !== -1" class="prophecy-chart__ring" :x="L + slot * ownIndex + 3" y="4" :width="slot - 6" :height="H - B + 25" rx="12"/>
    <text class="prophecy-chart__label" :x="(L + W - R) / 2" :y="H - 4" text-anchor="middle">{{ $t('Rate (Solari per unit)') }}</text>
  </svg>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {ExchangeGood, ExchangeSide} from '@/common/dune/smugglingExchange';
import {prophecyOutcome, prophecyRates} from '@/common/dune/prophecyOutcome';
import {translateText} from '@/client/directives/i18n';
import {RESOURCE_LABEL} from './choamGraphics';

// Each part at least as high as its number, so every number stands inside its part (small values a little taller)
const MIN_PART = 15;

type Part = {kind: 'base' | 'market' | 'premium', top: number, height: number, label: string};

export default defineComponent({
  name: 'ProphecyChart',
  props: {
    side: {type: String as PropType<ExchangeSide>, required: true},
    good: {type: String as PropType<ExchangeGood>, required: true},
    units: {type: Number, required: true},
    // The rate the prophecy names: its column gets the ring
    rate: {type: Number, required: true},
    // The forecast rate of the next generation, marked below its column
    nextRate: {type: Number, required: false, default: undefined},
    nextGeneration: {type: Number, required: true},
  },
  emits: ['pick'],
  data() {
    return {W: 320, H: 205, L: 30, R: 6, T: 26, B: 52};
  },
  computed: {
    rates(): Array<number> {
      return prophecyRates(this.side, this.good);
    },
    ownIndex(): number {
      return this.rates.indexOf(this.rate);
    },
    // At least three slots, so a single column does not fill the whole box
    slot(): number {
      return (this.W - this.L - this.R) / Math.max(3, this.rates.length);
    },
    bar(): number {
      return Math.min(46, this.slot * 0.62);
    },
    columns(): Array<{rate: number, parts: Array<Part>, total: number, top: number}> {
      const outcomes = this.rates.map((rate) => prophecyOutcome(this.side, this.good, this.units, rate));
      const top = Math.max(...outcomes.map((outcome) => outcome.total));
      const room = this.H - this.T - this.B;
      const heights = outcomes.map((outcome) => [outcome.base, outcome.market, outcome.premium]
        .map((value) => value > 0 ? Math.max(MIN_PART, value / top * room) : 0));
      // The minimum heights may make the highest column too tall: scale all down alike
      const scale = Math.min(1, room / Math.max(...heights.map((parts) => parts[0] + parts[1] + parts[2])));
      return outcomes.map((outcome, index) => {
        const parts: Array<Part> = [];
        let cursor = this.H - this.B;
        (['base', 'market', 'premium'] as const).forEach((kind, part) => {
          const height = heights[index][part] * scale;
          if (height <= 0) {
            return;
          }
          cursor -= height;
          parts.push({kind, top: cursor, height, label: kind === 'base' ? String(outcome[kind]) : '+' + outcome[kind]});
        });
        return {rate: this.rates[index], parts, total: outcome.total, top: cursor};
      });
    },
    yLabel(): string {
      return this.side === 'sell' ? 'Solari' : translateText(RESOURCE_LABEL[this.good]);
    },
  },
  methods: {
    barX(index: number): number {
      return this.L + this.slot * index + (this.slot - this.bar) / 2;
    },
  },
});
</script>
