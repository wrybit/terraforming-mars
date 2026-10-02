<template>
  <div>
    <StatsTable :columns="columns" :rows="rows" :rowKey="rowKey" initialSort="total">
      <template #name="{row}">
        <span v-if="row.baseline" class="stats-dim" v-i18n>{{ row.name }}</span>
        <StatsEntityName v-else kind="player" :name="row.name"/>
      </template>
      <template #bar="{row}">
        <span class="stats-sources-bar" :title="barTitle(row)">
          <span v-for="source in sources" :key="source.key" :class="`stats-source-${source.key}`" :style="{width: `${share(row, source.key)}%`}"></span>
        </span>
      </template>
    </StatsTable>
    <div class="stats-legend">
      <span v-for="source in sources" :key="source.key"><i :class="`stats-source-${source.key}`"></i><span v-i18n>{{ source.label }}</span></span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {translateText} from '@/client/directives/i18n';
import StatsTable from './StatsTable.vue';
import StatsEntityName from './StatsEntityName.vue';
import {StatsColumn} from './statsTypes';
import {StatsPlayerResult} from './statsResults';
import {formatNumber} from './statsLabels';
import {POINT_SOURCES, PointSource, PointSourcesRow, pointSourcesByPlayer, pointSourcesOverall} from './statsPointSources';

// Woher die Siegpunkte kommen: Ø je Herkunft und Spieler, mit gestapeltem Balken
export default defineComponent({
  name: 'StatsPointSources',
  components: {StatsTable, StatsEntityName},
  props: {
    results: {type: Array as PropType<ReadonlyArray<StatsPlayerResult>>, required: true},
    /** Vergleichszeile „Alle Partien“, damit sichtbar wird, was der Eintrag verschiebt. */
    baseline: {type: Array as PropType<ReadonlyArray<StatsPlayerResult>>, default: undefined},
  },
  data() {
    return {sources: POINT_SOURCES};
  },
  computed: {
    rows(): Array<PointSourcesRow> {
      const rows = pointSourcesByPlayer(this.results);
      const baseline = this.baseline === undefined ? undefined : pointSourcesOverall(this.baseline);
      return baseline === undefined ? rows : [...rows, baseline];
    },
    columns(): Array<StatsColumn> {
      const average = (key: PointSource | 'total'): StatsColumn => ({
        key,
        label: key === 'total' ? 'Total' : POINT_SOURCES.find((source) => source.key === key)?.label ?? key,
        value: (row: PointSourcesRow) => row.averages[key],
        format: (row: PointSourcesRow) => formatNumber(row.averages[key]),
      });
      return [
        {key: 'name', label: 'Player', value: (row: PointSourcesRow) => row.name, text: true},
        {key: 'games', label: 'Games', value: (row: PointSourcesRow) => row.games},
        // Spalten, die bei allen 0 sind (z. B. Sonstiges ohne Erweiterungen), lenken nur ab
        ...POINT_SOURCES.filter((source) => this.rows.some((row) => (row.averages[source.key] ?? 0) !== 0)).map((source) => average(source.key)),
        average('total'),
        {key: 'bar', label: '', value: (row: PointSourcesRow) => row.averages.total, text: true},
      ];
    },
  },
  methods: {
    rowKey(row: PointSourcesRow): string {
      return row.name;
    },
    share(row: PointSourcesRow, key: PointSource): number {
      const total = row.averages.total ?? 0;
      return total <= 0 ? 0 : Math.max(0, row.averages[key] ?? 0) / total * 100;
    },
    barTitle(row: PointSourcesRow): string {
      return POINT_SOURCES.map((source) => `${translateText(source.label)}: ${formatNumber(row.averages[source.key])}`).join(' · ');
    },
  },
});
</script>
