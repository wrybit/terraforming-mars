<template>
  <div class="stats-table-scroll">
    <table class="stats-table">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :class="{'stats-table-sorted': column.key === sortKey, 'stats-table-ascending': column.key === sortKey && ascending, 'stats-table-text': column.text}"
            :aria-sort="column.key === sortKey ? (ascending ? 'ascending' : 'descending') : undefined"
            @click="sortBy(column)"
            v-i18n>{{ column.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in sortedRows" :key="rowKey(row)">
          <td v-for="column in columns" :key="column.key" :class="{'stats-table-text': column.text}">
            <slot :name="column.key" :row="row" :rows="sortedRows">{{ column.format ? column.format(row) : column.value(row) }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {StatsColumn} from './statsTypes';

// Sortable table for all statistics lists
export default defineComponent({
  name: 'StatsTable',
  props: {
    columns: {type: Array as PropType<ReadonlyArray<StatsColumn>>, required: true},
    rows: {type: Array as PropType<ReadonlyArray<any>>, required: true},
    rowKey: {type: Function as PropType<(row: any) => string>, required: true},
    initialSort: {type: String, required: true},
  },
  data() {
    const column = this.columns.find((candidate) => candidate.key === this.initialSort);
    return {
      sortKey: this.initialSort,
      ascending: column?.text === true,
    };
  },
  computed: {
    sortedRows(): Array<any> {
      const column = this.columns.find((candidate) => candidate.key === this.sortKey);
      if (column === undefined) {
        return [...this.rows];
      }
      const direction = this.ascending ? 1 : -1;
      return [...this.rows].sort((first, second) => {
        const left = column.value(first);
        const right = column.value(second);
        // Unknown values always at the end, regardless of sort direction
        if (left === undefined || right === undefined) {
          return left === right ? 0 : left === undefined ? 1 : -1;
        }
        const result = typeof left === 'string' ? left.localeCompare(String(right)) : left - Number(right);
        return result * direction;
      });
    },
  },
  methods: {
    sortBy(column: StatsColumn): void {
      if (column.key === this.sortKey) {
        this.ascending = !this.ascending;
      } else {
        this.sortKey = column.key;
        this.ascending = column.text === true;
      }
    },
  },
});
</script>
