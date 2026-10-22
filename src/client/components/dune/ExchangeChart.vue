<template>
  <!-- Rates of one board of the smuggling exchange above its resource tiles (exchangeChart.ts, Jens 20 Oct 2026):
       per resource a thin white line from the current generation (bottom, next to the tile) up into older ones, which
       fade out. Green or red area and point: the rate is better or worse for you than normal (dashed). Solari stay on
       their straight line. The generation stands in front with a short tick. Lines and areas stretch with the column
       (non-scaling strokes), the points are HTML so they stay round. -->
  <div class="exchange-chart" aria-hidden="true">
    <div class="exchange-chart__generations" :style="{height: height + 'px'}">
      <span v-for="row in chart.rows" :key="row.generation" class="exchange-chart__generation"
        :class="{'exchange-chart__generation--now': row.generation === generation}" :style="{top: row.top + 'px'}">G{{ row.generation }}</span>
    </div>
    <div class="exchange-chart__columns">
      <div v-for="column in chart.columns" :key="column.resource" class="exchange-chart__column" :style="{height: height + 'px'}">
        <svg class="exchange-chart__plot" :viewBox="'0 0 100 ' + height" preserveAspectRatio="none">
          <line class="exchange-chart__normal" :x1="column.normalX" :x2="column.normalX" y1="3" :y2="height - 3"/>
          <polygon v-for="(area, index) in column.areas" :key="index" :points="area.points"
            :class="'exchange-chart__area exchange-chart__area--' + area.mood"/>
          <polyline class="exchange-chart__line" :points="column.line"/>
        </svg>
        <span v-for="(point, index) in column.points" :key="index"
          :class="['exchange-chart__point', 'exchange-chart__point--' + point.mood, {'exchange-chart__point--current': point.current}]"
          :style="{left: point.x + '%', top: point.y + 'px'}"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {Resource} from '@/common/Resource';
import {ExchangeBoardModel} from '@/common/dune/smugglingExchange';
import {CHART_HEIGHT, exchangeChart} from './exchangeChart';

const props = defineProps<{
  // Resources in the order of the tiles below
  resources: ReadonlyArray<Resource>,
  board: ExchangeBoardModel,
  // Selling (you give): a high rate is good; buying (you get): a low one
  higherIsGood: boolean,
  // Current generation, the last entry of the history
  generation: number,
}>();

const height = CHART_HEIGHT;
const chart = computed(() => exchangeChart(props.resources, props.board, props.higherIsGood, props.generation));
</script>
