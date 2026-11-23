<template>
  <!-- One grid for the whole table: each AI strength is a column in its own color from its head to its last field, so
       the three strengths read as vertical groups. Phones: a block per row, every field named with its strength -->
  <div class="server-settings-grid" :style="{'--grid-rows': rows.length + 1}">
    <div v-for="(column, index) in columns" :key="'band-' + column" class="server-settings-grid-band" :class="'server-settings-grid-band--' + column" :style="{'--grid-column': index + 2}" aria-hidden="true"></div>
    <div v-for="(column, index) in columns" :key="'head-' + column" class="server-settings-grid-head" :style="{'--grid-column': index + 2}" aria-hidden="true">
      <AiStrengthLabel :column="column" />
    </div>
    <div v-for="(row, rowIndex) in rows" :key="row.name" class="server-settings-grid-row" :style="{'--grid-row': rowIndex + 2}">
      <div class="server-settings-text">
        <span class="server-settings-label" v-i18n>{{ row.label }}</span>
        <span class="server-settings-description" v-i18n>{{ row.description }}</span>
        <!-- Limit of this machine (e.g. threads: its cores), as plain information below the description -->
        <span v-if="row.limitNote !== undefined" class="server-settings-grid-limit">{{ row.limitNote }}</span>
        <code class="server-settings-key">{{ row.keyPattern }}</code>
      </div>
      <!-- Empty: the default stands grey in the field and applies -->
      <label v-for="(cell, cellIndex) in row.cells" :key="cell.key" class="server-settings-grid-cell" :class="'server-settings-grid-cell--' + cell.column" :style="{'--grid-column': cellIndex + 2}">
        <span class="server-settings-grid-cell-name"><AiStrengthLabel :column="cell.column" /></span>
        <input class="server-settings-grid-input" :class="{'server-settings-grid-input--invalid': aboveLimit(cell, values[cell.key])}" type="number" inputmode="numeric"
          :min="cell.minimum" :max="cell.maximum" :placeholder="cell.placeholder" :value="values[cell.key]"
          :aria-label="$t(row.label) + ' · ' + $t(columnLabel(cell.column))" autocomplete="off"
          @input="$emit('update', cell.key, ($event.target as HTMLInputElement).value)">
      </label>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {ServerSettingDefinition} from '@/common/admin/serverSettings';
import AiStrengthLabel from '@/client/components/admin/AiStrengthLabel.vue';
import {strengthColumnLabel} from '@/client/components/admin/aiStrengthColumns';

type Cell = {key: string, column: string, minimum?: number, maximum?: number, placeholder?: string};
type Row = {name: string, label: string, description: string, keyPattern: string, limitNote?: string, cells: Array<Cell>};

/** A limit of the machine for all fields of a row, stricter than the setting's own maximum. */
export type GridRowLimit = {maximum: number, note: string};

// Settings with a grid position as one table: a line per row, a field per column (AI strength: easy, normal, hard)
export default defineComponent({
  name: 'ServerSettingGrid',
  components: {AiStrengthLabel},
  emits: ['update'],
  props: {
    settings: {type: Array as PropType<ReadonlyArray<ServerSettingDefinition>>, required: true},
    values: {type: Object as PropType<Readonly<Record<string, string>>>, required: true},
    /** Per row name, e.g. threads: no more than the cores of the server */
    rowLimits: {type: Object as PropType<Readonly<Partial<Record<string, GridRowLimit>>>>, default: () => ({})},
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
          row = {name: grid.row, label: setting.label, description: setting.description, keyPattern: setting.key.replace(grid.column.toUpperCase(), '*'),
            limitNote: this.rowLimits[grid.row]?.note, cells: []};
          rows.push(row);
        }
        const limit = this.rowLimits[grid.row]?.maximum;
        const maximum = limit === undefined ? setting.maximum : Math.min(limit, setting.maximum ?? limit);
        // The default shown is the one that applies here: the server also cuts it down to the limit
        const placeholder = limit === undefined || setting.placeholder === undefined ? setting.placeholder : String(Math.min(limit, Number(setting.placeholder)));
        row.cells.push({key: setting.key, column: grid.column, minimum: setting.minimum, maximum, placeholder});
      }
      return rows;
    },
  },
  methods: {
    aboveLimit(cell: Cell, value: string | undefined): boolean {
      return cell.maximum !== undefined && value !== undefined && value !== '' && Number(value) > cell.maximum;
    },
    columnLabel(column: string): string {
      return strengthColumnLabel(column);
    },
  },
});
</script>
