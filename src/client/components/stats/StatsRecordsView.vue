<template>
  <div class="stats-records">
    <section v-for="record in records" :key="record.title" class="stats-card">
      <h2 v-i18n>{{ record.title }}</h2>
      <table class="stats-table stats-record">
        <tbody>
          <tr v-for="(entry, index) in record.entries" :key="index">
            <td class="stats-record-rank" :class="{'stats-best': index === 0}">#{{ index + 1 }}</td>
            <td class="stats-table-text"><StatsEntityName kind="player" :name="entry.result.player.name"/></td>
            <td><strong :class="{'stats-best': index === 0}">{{ entry.value }}</strong> <span class="stats-dim" v-i18n>{{ record.unit }}</span></td>
            <td class="stats-table-text stats-dim"><span v-for="corporation in corporationsOf(entry.result)" :key="corporation" class="stats-record-corporation" v-i18n>{{ corporation }}</span></td>
            <td class="stats-dim">
              <a v-if="entry.result.game.resultUrl !== undefined" :href="entry.result.game.resultUrl" target="_blank" class="stats-link">{{ formatDate(entry.result.game.summary.createdTimeMs) }}</a>
              <template v-else>{{ formatDate(entry.result.game.summary.createdTimeMs) }}</template>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import StatsEntityName from './StatsEntityName.vue';
import {StatsRecord, statsRecords} from './statsRecords';
import {StatsPlayerResult} from './statsResults';
import {STATS_KINDS} from './statsKinds';
import {formatDate} from './statsLabels';

// Bestenlisten: Punkte, Vorsprung, TR, Grünflächen, Städte, Karten, kürzeste Partien
export default defineComponent({
  name: 'StatsRecordsView',
  components: {StatsEntityName},
  props: {
    results: {type: Array as PropType<ReadonlyArray<StatsPlayerResult>>, required: true},
  },
  computed: {
    records(): Array<StatsRecord> {
      return statsRecords(this.results);
    },
  },
  methods: {
    formatDate,
    corporationsOf(result: StatsPlayerResult): Array<string> {
      return STATS_KINDS.corporation.namesOf(result);
    },
  },
});
</script>
