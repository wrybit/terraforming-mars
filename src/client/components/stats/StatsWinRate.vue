<template>
  <span class="stats-win-rate" :title="title">
    <span class="stats-win-rate-value">{{ percent }}</span>
    <span class="stats-win-rate-track">
      <span class="stats-win-rate-fill" :style="{width: `${Math.min(1, winRate) * 100}%`}"></span>
      <span class="stats-win-rate-expected" :style="{left: `${expected * 100}%`}"></span>
    </span>
  </span>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {formatPercent} from './statsLabels';
import {translateText} from '@/client/directives/i18n';

// Win rate as a bar; the line shows the rate by pure chance (1 ÷ player count)
export default defineComponent({
  name: 'StatsWinRate',
  props: {
    winRate: {type: Number, required: true},
    expected: {type: Number, required: true},
  },
  computed: {
    percent(): string {
      return formatPercent(this.winRate);
    },
    title(): string {
      return `${translateText('Chance by luck alone')}: ${formatPercent(this.expected)}`;
    },
  },
});
</script>
