<template>
  <section class="stats-card">
    <div class="stats-card-head">
      <h2><span v-i18n>Combinations</span> <span class="stats-dim">· {{ visibleRows.length }}</span></h2>
      <div class="stats-list-tools">
        <span class="stats-dim" v-i18n>Played at least</span>
        <SegmentedControl :options="minPlaysOptions" v-model="minPlays"/>
        <input v-model="search" type="search" class="stats-search" :placeholder="$t('Search')">
      </div>
    </div>
    <SegmentedControl class="stats-combination-types" :options="typeOptions" :modelValue="typeKey" @update:modelValue="selectType"/>
    <p v-if="visibleRows.length === 0" class="stats-note" v-i18n>No games for these filters.</p>
    <StatsTable v-else :key="typeKey" :columns="columns" :rows="visibleRows" :rowKey="rowKey" initialSort="plays">
      <template #first="{row}"><StatsEntityName :kind="type.first" :name="row.first"/></template>
      <template #second="{row}"><StatsEntityName :kind="type.second" :name="row.second"/></template>
      <template #winRate="{row}"><StatsWinRate :winRate="row.winRate" :expected="row.expectedWinRate"/></template>
    </StatsTable>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {translateText} from '@/client/directives/i18n';
import SegmentedControl from '@/client/components/create/SegmentedControl.vue';
import {SegmentOption} from '@/client/components/create/createGameChoices';
import StatsTable from './StatsTable.vue';
import StatsEntityName from './StatsEntityName.vue';
import StatsWinRate from './StatsWinRate.vue';
import {StatsColumn} from './statsTypes';
import {CombinationStats, combinations, COMBINATION_TYPES} from './statsCombinations';
import {chooseMinPlays, MIN_PLAYS_OPTIONS} from './statsMinPlays';
import {formatLift} from './statsLabels';
import {STATS_KINDS} from './statsKinds';
import {StatsPlayerResult} from './statsResults';

// More rows make the page sluggish; card + card yields thousands of pairs
const ROW_LIMIT = 100;

// Pairs of corporation, prelude and project card: how often played together and whether they yield more together than alone
export default defineComponent({
  name: 'StatsCombinationsView',
  components: {SegmentedControl, StatsTable, StatsEntityName, StatsWinRate},
  props: {
    results: {type: Array as PropType<ReadonlyArray<StatsPlayerResult>>, required: true},
  },
  data() {
    return {
      typeKey: COMBINATION_TYPES[0].key,
      typeOptions: COMBINATION_TYPES.map((type) => ({value: type.key, label: type.label})) as ReadonlyArray<SegmentOption>,
      minPlays: 1,
      minPlaysOptions: MIN_PLAYS_OPTIONS,
      search: '',
    };
  },
  created() {
    this.minPlays = chooseMinPlays(this.rows.map((row) => row.plays));
  },
  computed: {
    type(): typeof COMBINATION_TYPES[number] {
      return COMBINATION_TYPES.find((type) => type.key === this.typeKey) ?? COMBINATION_TYPES[0];
    },
    rows(): Array<CombinationStats> {
      return combinations(this.results, this.type.first, this.type.second);
    },
    visibleRows(): Array<CombinationStats> {
      const search = this.search.trim().toLowerCase();
      // Search covers the translated and the English name of both entries
      const matches = (name: string) => name.toLowerCase().includes(search) || translateText(name).toLowerCase().includes(search);
      return this.rows
        .filter((row) => row.plays >= this.minPlays && (search === '' || matches(row.first) || matches(row.second)))
        .sort((first, second) => second.plays - first.plays || second.winRate - first.winRate)
        .slice(0, ROW_LIMIT);
    },
    columns(): Array<StatsColumn> {
      return [
        {key: 'first', label: STATS_KINDS[this.type.first].singular, value: (row: CombinationStats) => translateText(row.first), text: true},
        {key: 'second', label: STATS_KINDS[this.type.second].singular, value: (row: CombinationStats) => translateText(row.second), text: true},
        {key: 'plays', label: 'Played', value: (row: CombinationStats) => row.plays},
        {key: 'winRate', label: 'Win rate', value: (row: CombinationStats) => row.winRate},
        {key: 'lift', label: 'vs. alone', value: (row: CombinationStats) => row.winRate - row.baselineWinRate, format: (row: CombinationStats) => formatLift(row.winRate, row.baselineWinRate)},
      ];
    },
  },
  methods: {
    selectType(key: string | number): void {
      this.typeKey = String(key);
      this.minPlays = chooseMinPlays(this.rows.map((row) => row.plays));
    },
    rowKey(row: CombinationStats): string {
      return `${row.first}|${row.second}`;
    },
  },
});
</script>
