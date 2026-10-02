<template>
  <div class="stats-showcase">
    <figure v-for="entry in entries" :key="entry.name" class="stats-showcase-item">
      <StatsEntityAsset :kind="kind" :name="entry.name" :siblings="names"/>
      <figcaption>
        <StatsEntityName :kind="kind" :name="entry.name"/>
        <span class="stats-showcase-numbers">{{ entry.plays }}× · {{ formatPercent(entry.winRate) }} <span v-i18n>wins</span></span>
      </figcaption>
    </figure>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import StatsEntityAsset from './StatsEntityAsset.vue';
import StatsEntityName from './StatsEntityName.vue';
import {EntityStats} from './statsAggregate';
import {StatsKind} from './statsKinds';
import {formatPercent} from './statsLabels';

// Spielmaterial nebeneinander mit Häufigkeit und Siegquote darunter (Übersicht: meistgespielte Karten usw.)
export default defineComponent({
  name: 'StatsShowcase',
  components: {StatsEntityAsset, StatsEntityName},
  props: {
    kind: {type: String as PropType<StatsKind>, required: true},
    entries: {type: Array as PropType<ReadonlyArray<EntityStats>>, required: true},
  },
  computed: {
    names(): Array<string> {
      return this.entries.map((entry) => entry.name);
    },
  },
  methods: {
    formatPercent,
  },
});
</script>
