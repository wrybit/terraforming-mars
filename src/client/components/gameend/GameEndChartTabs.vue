<template>
  <!-- Both history charts of the results page in one tab box instead of stacked: saves height in the right column -->
  <div class="game-end-charts">
    <div class="or-tabs" role="tablist">
      <button v-for="tab in tabs" :key="tab.id" type="button" role="tab"
        :aria-selected="tab.id === selected"
        :class="['or-tab', 'or-tab--view', {'or-tab--active': tab.id === selected}]"
        :data-test="'chart-tab-' + tab.id"
        @click.prevent="selected = tab.id">
        <span class="or-tab-title" v-i18n>{{ tab.title }}</span>
      </button>
    </div>
    <div v-docked-tab class="or-tab-panel or-tab-panel--view" role="tabpanel">
      <!-- v-if instead of v-show: Chart.js measures the canvas on setup; hidden, it would have no size -->
      <VictoryPointChart v-if="selected === 'victoryPoints'" key="victoryPoints"
        :datasets="victoryPointDatasets"
        :generation="generation"
        :animation="true"
        :id="'victory-point-chart'"/>
      <VictoryPointChart v-else key="globalParameters"
        :datasets="globalParameterDatasets"
        :generation="generation"
        :animation="true"
        :id="'global-parameter-chart'"
        :yAxisLabel="'% completed'"
        :yAxisStep="25"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import VictoryPointChart, {DataSet} from '@/client/components/gameend/VictoryPointChart.vue';
import {vDockedTab} from '@/client/directives/DockedTab';

type ChartTab = 'victoryPoints' | 'globalParameters';

defineProps<{
  victoryPointDatasets: ReadonlyArray<DataSet>;
  globalParameterDatasets: ReadonlyArray<DataSet>;
  generation: number;
}>();

const tabs: ReadonlyArray<{id: ChartTab, title: string}> = [
  {id: 'victoryPoints', title: 'Victory Points'},
  {id: 'globalParameters', title: 'Global parameters'},
];

const selected = ref<ChartTab>('victoryPoints');
</script>
