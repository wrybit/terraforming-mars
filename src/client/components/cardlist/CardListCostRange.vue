<template>
  <div class="card-list-cost-range">
    <div class="card-list-cost-range-track">
      <span class="card-list-cost-range-fill" :style="fillStyle"></span>
      <input type="range" :min="0" :max="highest" :value="low" :aria-label="$t('Minimum cost')" @input="changeLow">
      <input type="range" :min="0" :max="highest" :value="high" :aria-label="$t('Maximum cost')" @input="changeHigh">
    </div>
    <div class="card-list-cost-range-values">
      <span class="card-list-cost-range-coin">{{ low }}</span>
      <span>–</span>
      <span class="card-list-cost-range-coin">{{ high }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

// Preisbereich mit zwei Griffen (zwei übereinanderliegende Schieberegler). Ein Griff am Rand heißt "keine Grenze"
// und wird als undefined gemeldet – so bleibt die Adresszeile ohne Preisfilter kurz.
export default defineComponent({
  name: 'CardListCostRange',
  emits: ['update:costMin', 'update:costMax'],
  props: {
    costMin: {type: Number, required: false},
    costMax: {type: Number, required: false},
    // Höchster Kartenpreis
    highest: {type: Number, required: true},
  },
  computed: {
    low(): number {
      return this.costMin ?? 0;
    },
    high(): number {
      return this.costMax ?? this.highest;
    },
    fillStyle(): Record<string, string> {
      const percent = (value: number) => `${(value / Math.max(this.highest, 1)) * 100}%`;
      return {left: percent(this.low), right: `calc(100% - ${percent(this.high)})`};
    },
  },
  methods: {
    valueOf(event: Event): number {
      return Number((event.target as HTMLInputElement).value);
    },
    // Griffe dürfen sich nicht überholen
    changeLow(event: Event): void {
      const value = Math.min(this.valueOf(event), this.high);
      (event.target as HTMLInputElement).value = String(value);
      this.$emit('update:costMin', value <= 0 ? undefined : value);
    },
    changeHigh(event: Event): void {
      const value = Math.max(this.valueOf(event), this.low);
      (event.target as HTMLInputElement).value = String(value);
      this.$emit('update:costMax', value >= this.highest ? undefined : value);
    },
  },
});
</script>
