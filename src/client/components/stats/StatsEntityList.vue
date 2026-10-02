<template>
  <section class="stats-card">
    <div class="stats-card-head">
      <h2><span v-i18n>{{ definition.label }}</span> <span class="stats-dim">· {{ visibleRows.length }}</span></h2>
      <div v-if="rows.length > searchThreshold" class="stats-list-tools">
        <span class="stats-dim" v-i18n>Played at least</span>
        <SegmentedControl :options="minPlaysOptions" v-model="minPlays"/>
        <input v-model="search" type="search" class="stats-search" :placeholder="$t('Search')">
      </div>
    </div>
    <p v-if="rows.length === 0" class="stats-note" v-i18n>No games for these filters.</p>
    <StatsTable v-else :columns="columns" :rows="visibleRows" :rowKey="rowKey" :initialSort="initialSort">
      <template #name="{row, rows: shownRows}"><StatsEntityName :kind="kind" :name="row.name" :siblings="namesOf(shownRows)"/></template>
      <template #winRate="{row}"><StatsWinRate :winRate="row.winRate" :expected="row.expectedWinRate"/></template>
      <template #mostPlayedBy="{row}"><StatsEntityName v-if="row.mostPlayedBy" kind="player" :name="row.mostPlayedBy"/></template>
      <template #mostWinsBy="{row}"><StatsEntityName v-if="row.mostWinsBy" kind="player" :name="row.mostWinsBy"/></template>
    </StatsTable>
    <p class="stats-note">{{ note }}</p>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {translateText} from '@/client/directives/i18n';
import {StatsColumn} from './statsTypes';
import StatsTable from './StatsTable.vue';
import SegmentedControl from '@/client/components/create/SegmentedControl.vue';
import {SegmentOption} from '@/client/components/create/createGameChoices';
import StatsEntityName from './StatsEntityName.vue';
import StatsWinRate from './StatsWinRate.vue';
import {aggregate} from './statsAggregate';
import {entityColumns, EntityRow, initialSortOf, withCardPoints, withFunderWinShare} from './statsColumns';
import {StatsKind, StatsKindDefinition, STATS_KINDS} from './statsKinds';
import {StatsPlayerResult} from './statsResults';

// Ab so vielen Einträgen lohnen sich Suchfeld und Mindestanzahl (Projektkarten)
const SEARCH_THRESHOLD = 15;
// Bei langen Listen stünden sonst lauter einmal gespielte Karten mit 100 % oben
const MIN_PLAYS_OPTIONS: ReadonlyArray<SegmentOption> = [1, 2, 3, 5].map((value) => ({value, label: `${value}×`}));
const DEFAULT_MIN_PLAYS = 3;

// Liste einer Art (Konzerne, Präludien, Karten, Meilensteine, Auszeichnungen, Spielpläne)
export default defineComponent({
  name: 'StatsEntityList',
  components: {StatsTable, StatsEntityName, StatsWinRate, SegmentedControl},
  props: {
    kind: {type: String as PropType<Exclude<StatsKind, 'player'>>, required: true},
    results: {type: Array as PropType<ReadonlyArray<StatsPlayerResult>>, required: true},
  },
  data() {
    return {search: '', searchThreshold: SEARCH_THRESHOLD, minPlays: DEFAULT_MIN_PLAYS, minPlaysOptions: MIN_PLAYS_OPTIONS};
  },
  computed: {
    definition(): StatsKindDefinition {
      return STATS_KINDS[this.kind];
    },
    rows(): Array<EntityRow> {
      const rows = aggregate(this.results, this.kind);
      if (this.kind === 'award') {
        return rows.map((row) => withFunderWinShare(row, this.results));
      }
      return this.kind === 'card' ? rows.map((row) => withCardPoints(row, this.results)) : rows;
    },
    visibleRows(): Array<EntityRow> {
      if (this.rows.length <= SEARCH_THRESHOLD) {
        return this.rows;
      }
      const search = this.search.trim().toLowerCase();
      // Gesucht wird im übersetzten und im englischen Namen
      return this.rows.filter((row) => row.plays >= this.minPlays &&
        (search === '' || row.name.toLowerCase().includes(search) || translateText(row.name).toLowerCase().includes(search)));
    },
    columns(): Array<StatsColumn> {
      return entityColumns(this.kind);
    },
    note(): string {
      const notes = ['The line in the bar is the win rate by luck alone (1 ÷ number of players); "vs. luck" is the difference in percentage points.'];
      if (this.definition.note !== undefined) {
        notes.push(this.definition.note);
      }
      return notes.map(translateText).join(' ');
    },
    initialSort(): string {
      return initialSortOf(this.kind);
    },
  },
  methods: {
    rowKey(row: EntityRow): string {
      return row.name;
    },
    namesOf(rows: ReadonlyArray<EntityRow>): Array<string> {
      return rows.map((row) => row.name);
    },
  },
});
</script>
