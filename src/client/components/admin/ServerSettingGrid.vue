<template>
  <div class="server-settings-grid">
    <!-- Column heads once above the table, over the fields they name -->
    <div class="server-settings-row server-settings-grid-head" aria-hidden="true">
      <span></span>
      <div class="server-settings-grid-fields">
        <span v-for="column in columns" :key="column" class="server-settings-grid-column" v-i18n>{{ columnLabel(column) }}</span>
      </div>
    </div>
    <div v-for="row in rows" :key="row.name" class="server-settings-row">
      <div class="server-settings-text">
        <span class="server-settings-label" v-i18n>{{ row.label }}</span>
        <span class="server-settings-description" v-i18n>{{ row.description }}</span>
        <code class="server-settings-key">{{ row.keyPattern }}</code>
      </div>
      <div class="server-settings-grid-fields">
        <!-- Empty: the default stands grey in the field and applies. Narrow screens name the column at every field,
             the head row is too far away there -->
        <label v-for="cell in row.cells" :key="cell.key" class="server-settings-grid-cell">
          <span class="server-settings-grid-cell-name" v-i18n>{{ columnLabel(cell.column) }}</span>
          <input class="server-settings-grid-input" type="number" inputmode="numeric"
            :min="cell.minimum" :max="cell.maximum" :placeholder="cell.placeholder" :value="values[cell.key]"
            :aria-label="$t(row.label) + ' · ' + $t(columnLabel(cell.column))" autocomplete="off"
            @input="$emit('update', cell.key, ($event.target as HTMLInputElement).value)">
        </label>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {ServerSettingDefinition} from '@/common/admin/serverSettings';

type Cell = {key: string, column: string, minimum?: number, maximum?: number, placeholder?: string};
type Row = {name: string, label: string, description: string, keyPattern: string, cells: Array<Cell>};

// Column names of the AI strength table (and any other table: the column id as it is)
const COLUMN_LABELS: Readonly<Record<string, string>> = {easy: 'Easy', normal: 'Normal', hard: 'Hard'};

// Settings with a grid position as one table: a line per row, a field per column (AI strength: easy, normal, hard)
export default defineComponent({
  name: 'ServerSettingGrid',
  emits: ['update'],
  props: {
    settings: {type: Array as PropType<ReadonlyArray<ServerSettingDefinition>>, required: true},
    values: {type: Object as PropType<Readonly<Record<string, string>>>, required: true},
  },
  computed: {
    columns(): Array<string> {
      return [...new Set(this.settings.map((setting) => setting.grid?.column ?? ''))];
    },
    rows(): Array<Row> {
      const rows: Array<Row> = [];
      for (const setting of this.settings) {
        const grid = setting.grid;
        if (grid === undefined) {
          continue;
        }
        let row = rows.find((candidate) => candidate.name === grid.row);
        if (row === undefined) {
          // The keys of a row differ only in the column part, e.g. AI_*_ROLLOUTS
          row = {name: grid.row, label: setting.label, description: setting.description, keyPattern: setting.key.replace(grid.column.toUpperCase(), '*'), cells: []};
          rows.push(row);
        }
        row.cells.push({key: setting.key, column: grid.column, minimum: setting.minimum, maximum: setting.maximum, placeholder: setting.placeholder});
      }
      return rows;
    },
  },
  methods: {
    columnLabel(column: string): string {
      return COLUMN_LABELS[column] ?? column;
    },
  },
});
</script>
