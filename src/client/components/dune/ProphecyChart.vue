<template>
  <!-- What a prophecy brings at each rate the guild can set (Jens 25 Oct 2026, _mockups/dune/choam/prophezeiung-rechner.html):
       one stacked bar per rate, grey what the normal rate gives, green what the rate adds, orange the bet premium, each
       part with its number and the sum on top. Selling in Solari for the units, buying in units for the budget, so both
       grow towards the better rate on the right. Rates that do not reach the limit say "waits". -->
  <svg class="prophecy-chart" :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="$t('What you get, per rate')">
    <g v-for="tick in ticks" :key="'t' + tick">
      <line class="prophecy-chart__grid" :x1="L" :x2="W - R" :y1="y(tick)" :y2="y(tick)"/>
      <text class="prophecy-chart__axis" :x="L - 8" :y="y(tick) + 4" text-anchor="end">{{ tick }}</text>
    </g>
    <g v-for="(column, index) in columns" :key="column.rate">
      <rect v-if="column.rate === nextRate" class="prophecy-chart__next" :x="L + slot * index + 2" :y="T" :width="slot - 4" :height="H - T - B" rx="6"/>
      <template v-if="column.parts.length > 0">
        <g v-for="part in column.parts" :key="part.kind">
          <rect :class="'prophecy-chart__part prophecy-chart__part--' + part.kind" :x="barX(index)" :y="part.top" :width="bar" :height="part.height"/>
          <text :class="'prophecy-chart__value prophecy-chart__value--' + part.kind" :x="barX(index) + bar / 2" :y="part.top + part.height / 2 + 4"
            text-anchor="middle">{{ part.label }}</text>
        </g>
        <text class="prophecy-chart__sum" :x="barX(index) + bar / 2" :y="column.top - 6" text-anchor="middle">{{ column.total }}</text>
      </template>
      <text v-else class="prophecy-chart__wait" :x="L + slot * index + slot / 2" :y="y(0) - 10" text-anchor="middle">{{ $t('waits') }}</text>
      <text class="prophecy-chart__axis" :x="L + slot * index + slot / 2" :y="H - B + 24" text-anchor="middle">{{ column.rate }}</text>
      <text v-if="column.rate === nextRate" class="prophecy-chart__axis prophecy-chart__axis--next" :x="L + slot * index + slot / 2" :y="H - B + 48"
        text-anchor="middle">G{{ nextGeneration }}</text>
    </g>
    <line class="prophecy-chart__normal" :x1="L" :x2="W - R" :y1="y(normalTotal)" :y2="y(normalTotal)"/>
    <text class="prophecy-chart__normal-label" :x="L + 4" :y="y(normalTotal) - 6">{{ normalLabel }}</text>
    <text class="prophecy-chart__axis" :x="(L + W - R) / 2" :y="H - 8" text-anchor="middle">{{ $t('Rate per unit') }}</text>
    <text class="prophecy-chart__axis" x="14" :y="(T + H - B) / 2" text-anchor="middle" :transform="`rotate(-90 14 ${(T + H - B) / 2})`">{{ yLabel }}</text>
  </svg>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {ExchangeGood, ExchangeSide, NORMAL_SELL} from '@/common/dune/smugglingExchange';
import {prophecyBudget, prophecyOutcome, prophecyRates} from '@/common/dune/prophecyOutcome';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {RESOURCE_LABEL} from './choamGraphics';

// Each part at least as high as its number, so every number stands inside its part (small values a little taller)
const MIN_PART = 22;

type Part = {kind: 'base' | 'market' | 'premium', top: number, height: number, label: string};

export default defineComponent({
  name: 'ProphecyChart',
  props: {
    side: {type: String as PropType<ExchangeSide>, required: true},
    good: {type: String as PropType<ExchangeGood>, required: true},
    units: {type: Number, required: true},
    // The forecast rate of the next generation, highlighted
    nextRate: {type: Number, required: false, default: undefined},
    nextGeneration: {type: Number, required: true},
  },
  data() {
    return {W: 640, H: 340, L: 48, R: 12, T: 30, B: 84};
  },
  computed: {
    rates(): Array<number> {
      return prophecyRates(this.side, this.good);
    },
    // What the normal rate gives: the Solari for the units (selling), the units for the budget (buying)
    normalTotal(): number {
      return this.side === 'sell' ? this.units * NORMAL_SELL[this.good] : this.units;
    },
    highest(): number {
      return Math.max(this.normalTotal, ...this.rates.map((rate) => prophecyOutcome(this.side, this.good, this.units, rate)?.total ?? 0));
    },
    // About 5 grid lines with round steps
    step(): number {
      return this.side === 'sell' ? Math.max(5, Math.ceil(this.highest / 25) * 5) : Math.max(1, Math.ceil(this.highest / 5));
    },
    top(): number {
      return Math.ceil(this.highest / this.step) * this.step;
    },
    ticks(): Array<number> {
      const ticks: Array<number> = [];
      for (let tick = 0; tick <= this.top; tick += this.step) {
        ticks.push(tick);
      }
      return ticks;
    },
    slot(): number {
      return (this.W - this.L - this.R) / this.rates.length;
    },
    bar(): number {
      return Math.min(40, this.slot * 0.55);
    },
    columns(): Array<{rate: number, parts: Array<Part>, total: number, top: number}> {
      return this.rates.map((rate) => {
        const outcome = prophecyOutcome(this.side, this.good, this.units, rate);
        if (outcome === undefined) {
          return {rate, parts: [], total: 0, top: this.y(0)};
        }
        const parts: Array<Part> = [];
        let cursor = this.y(0);
        for (const [kind, value] of [['base', outcome.base], ['market', outcome.market], ['premium', outcome.premium]] as const) {
          if (value <= 0) {
            continue;
          }
          const height = Math.max(MIN_PART, this.y(0) - this.y(value));
          cursor -= height;
          parts.push({kind, top: cursor, height, label: kind === 'base' ? String(value) : '+' + value});
        }
        return {rate, parts, total: outcome.total, top: cursor};
      });
    },
    unitName(): string {
      return translateText(RESOURCE_LABEL[this.good]);
    },
    normalLabel(): string {
      return translateTextWithParams('normal: ${0}', [String(this.normalTotal) + ' ' + (this.side === 'sell' ? 'Solari' : this.unitName)]);
    },
    yLabel(): string {
      return this.side === 'sell' ? translateText('Solari, incl. premium') :
        translateTextWithParams('${0} for ${1} Solari, incl. premium', [this.unitName, String(prophecyBudget(this.good, this.units))]);
    },
  },
  methods: {
    y(value: number): number {
      return this.T + (1 - value / this.top) * (this.H - this.T - this.B);
    },
    barX(index: number): number {
      return this.L + this.slot * index + (this.slot - this.bar) / 2;
    },
  },
});
</script>
